import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import ClosetNavigation from '../components/ClosetNavigation';
import CategoriesSidebar from '../components/CategoriesSidebar';

const Container = styled.div`
    flex: 1;
    font-family: 'Fashion';
    display: flex;
`;

export default function DigitalCloset() {
    const { client } = useLocation().state;
    console.log(client);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [category, setCategory] = useState({});
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        getCategories();
    }, []);
    
    async function getCategories() {
        const response = await axios.get('/categories')
            .catch(err => console.log(err));
        
        let categories = response.data;
        const allItems = [];
        if (categories.length !== 0) {
            categories.forEach(category => {
                allItems.push(category.items);
            });

            const allCategory = {
                _id: -1,
                name: 'All',
                items: allItems
            };

            categories = [allCategory, ...categories];
            setCategory(allCategory);
        }

        setCategories(categories);
    } 

    function openSidebar() {
        setSidebarOpen(true);
    }

    function closeSidebar() {
        setSidebarOpen(false);
    }

    function selectCategory(category) {
        setCategory(category);
    };

    return (
        <>
            <Container>
                <CategoriesSidebar
                    open={sidebarOpen}
                    closeSidebar={closeSidebar}
                    categories={categories}
                    selectCategory={selectCategory}
                    updateCategories={getCategories}
                />
                <ClosetNavigation
                    open={sidebarOpen}
                    openSidebar={openSidebar}
                    category={category}
                />
            </Container>
        </>
    )
}
