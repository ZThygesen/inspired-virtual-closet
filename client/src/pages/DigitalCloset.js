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

    function openSidebar() {
        setSidebarOpen(true);
    }

    function closeSidebar() {
        setSidebarOpen(false);
    }

    return (
        <>
            <Container>
                <CategoriesSidebar open={sidebarOpen} closeSidebar={closeSidebar} />
                <ClosetNavigation open={sidebarOpen} openSidebar={openSidebar} />
            </Container>
        </>
    )
}
