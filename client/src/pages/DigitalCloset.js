import styled from 'styled-components';
import ClosetNavigation from '../components/ClosetNavigation';
import CategoriesSidebar from '../components/CategoriesSidebar';

const Container = styled.div`
    flex: 1;
    font-family: 'Fashion';
    display: flex;
`;

export default function DigitalCloset() {
    return (
        <>
            <Container>
                <CategoriesSidebar />
                <ClosetNavigation />
            </Container>
        </>
    )
}
