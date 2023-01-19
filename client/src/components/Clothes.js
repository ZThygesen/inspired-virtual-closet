import styled from 'styled-components';
import NoCategories from './NoCategories';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;
`;

export default function Clothes({ display, category }) {
    return (
        <Container style={{ display: display ? 'flex' : 'none' }}>
            {
                category.name === undefined ? <NoCategories fontSize={28} /> :
                <>CLOTHES - {category.name}</>
            }
        </Container>
        
    );
}
