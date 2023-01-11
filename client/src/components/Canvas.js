import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`;

export default function Canvas({ display }) {
    return (
        <Container style={{ display: display ? 'flex' : 'none' }}>
            CANVAS
        </Container>
    );
}
