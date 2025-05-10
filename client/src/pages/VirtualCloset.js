import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientProvider } from '../components/ClientContext';
import { useLocation } from 'react-router-dom';
import { useError } from '../components/ErrorContext';
import styled from 'styled-components';
import api from '../api';
import ClosetNavigation from '../components/ClosetNavigation';
import CategoriesSidebar from '../components/CategoriesSidebar';
import Loading from '../components/Loading';
import { SidebarProvider } from '../components/SidebarContext';
import { DataProvider } from '../components/DataContext';

const Container = styled.div`
    flex: 1;
    font-family: 'Fashion';
    display: flex;
`;

export default function VirtualCloset() {
    const { setError } = useError();

    const { client } = useLocation().state;
    const [category, setCategory] = useState({});
    const [categories, setCategories] = useState([]);
    const [categoryGroups, setCategoryGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    const sidebarRef = useRef();

    const sendToCanvas = useRef(null);
    const [canvasItems, setCanvasItems] = useState([]);
    
    const getCategories = useCallback(async (updateCat = undefined, animateLoad = false) => {
        if (animateLoad) {
            setLoading(true);
        }
        
        let categories;
        // get all categories and their data for the current client
        try {
            const response = await api.get(`/files/${client._id}`);
            categories = response.data;
        } catch (err) {
            setError({
                message: 'There was an error fetching client items.',
                status: err.response.status
            });
            setLoading(false);
            return;
        }

        // filter out the other category
        const otherCategoryIndex = categories.findIndex(category => category._id === 0);
        const otherCategory = categories.splice(otherCategoryIndex, 1)[0];
        
        const allCategory = {
            _id: -1,
            name: 'All',
            items: []
        }

        const items = [];
        const categoriesByGroup = [];

        // create hash of { group name => categories with group name }
        const groupMap = {};
        categories.forEach(category => {
            if (!groupMap[category.group]) {
                groupMap[category.group] = [];
            }
            groupMap[category.group].push(category);
        });

        // iterate over each group
        const groups = Object.keys(groupMap);
        groups.forEach(group => {
            const groupCategories = groupMap[group];

            // extract items from each group
            groupCategories.forEach(category => {
                items.push([...category.items]);
            });

            // sort group's categories alphabetically
            groupCategories.sort(function(a, b) {
                if (a.name < b.name) {
                    return -1;
                } 
                else if (a.name > b.name) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            // save array of objects that look like { group name, categories with group name }
            categoriesByGroup.push({ group: group, categories: [...groupCategories] });
        });

        // sort group names alphabetically
        categoriesByGroup.sort(function(a, b) {
            if (a.group < b.group) {
                return -1;
            }
            else if (a.group > b.group) {
                return 1;
            }
            else {
                return 0;
            }
        });

        // compile all items together
        const allItems = [...otherCategory.items, ...items];
        allCategory.items = allItems;

        // compile all the categories together
        categories = [allCategory, otherCategory, ...categories];
        categoriesByGroup.unshift({ group: -1, categories: [allCategory, otherCategory] });

        setCategories(categories);
        setCategoryGroups(categoriesByGroup);

        // if the current category was recently updated, need to re-render
        if (updateCat) {
            setCategory(categories.filter(category => category._id === updateCat._id)[0]);
        }

        setLoading(false);
    }, [client, setError]);

    useEffect(() => {
        getCategories(undefined, true);
    }, [getCategories]);

    return (
        <>
            <ClientProvider clientId={client._id}>
                <SidebarProvider>
                    <DataProvider>
                        <Container>
                            <CategoriesSidebar
                                sidebarRef={sidebarRef}
                                categories={categories}
                                categoryGroups={categoryGroups}
                                activeCategory={category}
                                setCategory={setCategory}
                                sendToCanvas={sendToCanvas}
                                canvasItems={canvasItems}
                            />
                            <ClosetNavigation
                                sidebarRef={sidebarRef}
                                client={client}
                                category={category}
                                getCategories={getCategories}
                                setSendToCanvas={(fn) => (sendToCanvas.current = fn)}
                                setCategoryCanvasItems={setCanvasItems}
                            />
                        </Container>
                    </DataProvider>
                    <Loading open={loading} />
                </SidebarProvider>
            </ClientProvider>
            <p className="copyright">© 2025 Edie Styles, LLC</p>
        </>
    )
}
