import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
`;

export default function ManageClients() {
    const client = 'Lizette';

    return (
        <Container>
            Manage Clients
            <Link to={`${client.toLowerCase()}`} state={{ clientName: client }}>Digital Closet</Link>
        </Container>
    ); 
}
