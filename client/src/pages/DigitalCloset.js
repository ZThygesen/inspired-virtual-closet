import { useState } from 'react';
import styled from 'styled-components';
import ClosetNavigation from '../components/ClosetNavigation';
import CategoriesSidebar from '../components/CategoriesSidebar';

const Container = styled.div`
    flex: 1;
    font-family: 'Fashion';
    display: flex;
`;

export default function DigitalCloset() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [category, setCategory] = useState('All');

    function openSidebar() {
        setSidebarOpen(true);
    }

    function closeSidebar() {
        setSidebarOpen(false);
    }

    function selectCategory(category) {
        setCategory(category);
    }

    return (
        <>
            <Container>
                <CategoriesSidebar open={sidebarOpen} closeSidebar={closeSidebar} selectCategory={selectCategory} />
                <ClosetNavigation open={sidebarOpen} openSidebar={openSidebar} category={category} />
            </Container>
        </>
    )
}
