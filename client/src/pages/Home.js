import { Link } from 'react-router-dom';
import styled from 'styled-components';
import logo from '../images/big_logo.png';

const Container = styled.div`
    flex-grow: 1;
    align-self: center;
    width: 100%;
    max-width: 1000px;
    display: grid;
    grid-template-columns: 50% 50%;

    .big-logo-img {
        align-self: center;
        max-width: 100%;
        max-height: calc(90vh - var(--header-height));
    }

    .home-options {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 50px;
    }

    p {
        font-size: 100px;
        font-family: 'Mallows';
        color: var(--black);
    }

    a {
        background-color: var(--secondary);
        text-decoration: none;
        color: var(--black);
        font-family: 'Fashion';
        font-size: 38px;
        letter-spacing: 1px;
        padding: 20px;
        border: 2px solid var(--black);
        border-radius: 25px;
        font-weight: bold;
        transition: all 0.1s;
        margin: 10px;

        &:hover {
            background-color: var(--secondary-light);
        }
    }

`;

export default function Home() {
    return (
        <Container>
                <img src={logo} alt="logo" className="big-logo-img" />
                <div className="home-options">
                    <div className="site-description">
                        <p>Digital Closet</p>
                    </div>
                    <Link to="manage-clients">MANAGE CLIENTS</Link>
                </div>
        </Container>
    );
}
