import { Link } from 'react-router-dom';
import styled from 'styled-components';
import logo from '../images/big_logo.png';

const Container = styled.div`
    flex-grow: 1;
    display: flex;

    .big-logo-img {
        background-image: url(${logo});
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
        width: 100%;
        height: 800px;
    }

`;

export default function Home() {
    return (
        <Container>
            <div className="big-logo-img"></div>
            <Link to="manage-clients">Manage Clients</Link>
        </Container>
    );
}
