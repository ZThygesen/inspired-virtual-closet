import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`;

export default function Clothes({ display, category }) {
    return (
        <Container style={{ display: display ? 'flex' : 'none' }}>
            CLOTHES - {category}
        </Container>
        
    );
}
