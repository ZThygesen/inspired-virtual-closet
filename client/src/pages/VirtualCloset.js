import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import ClosetNavigation from '../components/ClosetNavigation';
import CategoriesSidebar from '../components/CategoriesSidebar';
import Loading from '../components/Loading';
import { useCallback } from 'react';

const Container = styled.div`
    flex: 1;
    font-family: 'Fashion';
    display: flex;
`;

export default function VirtualCloset() {
    const { client } = useLocation().state;
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 800 ? true : false);
    const [closeSidebarOnSelect, setCloseSidebarOnSelect] = useState(window.innerWidth > 800 ? true : false);
    const [category, setCategory] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        function handleResize() {
            if (window.innerWidth <= 800) {
                setCloseSidebarOnSelect(true);

                if (sidebarOpen) {
                    setSidebarOpen(false);
                }
            } else {
                setCloseSidebarOnSelect(false);
            }
        }

        window.addEventListener('resize', handleResize);
    }, [sidebarOpen]);
    
    const getCategories = useCallback(async (updateCat = undefined) => {
        // get all categories and their data for the current client
        const response = await axios.get(`/files/${client._id}`)
            .catch(err => console.log(err));

        let categories = response.data.files;

        // filter out the other category
        const otherCategoryIndex = categories.findIndex(category => category._id === 0);
        const otherCategory = categories.splice(otherCategoryIndex, 1)[0];    

        // filter out categories with and without items
        const catsWithItems = [];
        const catsWithoutItems = [];
        if (categories.length > 1) {
            categories.forEach(category => {
                if (category.items.length > 0) {
                    catsWithItems.push(category);
                } else {
                    catsWithoutItems.push(category);
                }
            });

            // sort category names alphabetically
            catsWithItems.sort(function(a, b) {
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

            catsWithoutItems.sort(function(a, b) {
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

            // create all items category
            let catItems = [];
            catsWithItems.forEach(cat => {
                catItems.push(...cat.items)
            });
            const allItems = [...otherCategory.items, ...catItems];

            const allCategory = {
                _id: -1,
                name: 'All',
                items: allItems
            };

            // compile all the categories together
            categories = [allCategory, otherCategory, ...catsWithItems, ...catsWithoutItems];
        }
        
        // on initial render
        if (JSON.stringify(category) === '{}') {
            setCategory(categories[0]);
        }

        setCategories(categories);

        // if the current category was recently updated, need to re-render
        if (updateCat) {
            setCategory(categories.filter(category => category._id === updateCat._id)[0]);
        }
    }, [client, category]);

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    async function addCategory(newCategory) {
        setLoading(true);
        await axios.post('/categories', { category: newCategory })
            .catch(err => console.log(err));
        
        await getCategories();
        setLoading(false);
    }

    async function editCategory(category, newName) {
        setLoading(true);
        if (category.name === newName) {
            setLoading(false);
            return;
        }

        await axios.patch('/categories', { categoryId: category._id, newName: newName })
            .catch(err => console.log(err));
        
        await getCategories(category);
        setLoading(false);
    }
    
    async function deleteCategory(category) {
        setLoading(true);
        
        await axios.delete(`/categories/${category._id}`)
            .catch(err => console.log(err));
        
        await getCategories();
        setLoading(false);
    }

    function openSidebar() {
        setSidebarOpen(true);
    }

    function closeSidebar() {
        setSidebarOpen(false);
    }

    return (
        <>
            <Container>
                <CategoriesSidebar
                    open={sidebarOpen}
                    closeSidebar={closeSidebar}
                    closeSidebarOnSelect={closeSidebarOnSelect}
                    categories={categories}
                    activeCategory={category}
                    setCategory={setCategory}
                    addCategory={addCategory}
                    updateCategories={getCategories}
                    editCategory={editCategory}
                    deleteCategory={deleteCategory}
                />
                <ClosetNavigation
                    open={sidebarOpen}
                    openSidebar={openSidebar}
                    client={client}
                    category={category}
                    setCategory={setCategory}
                    getCategories={getCategories}
                />
            </Container>
            <Loading open={loading} />
        </>
    )
}
