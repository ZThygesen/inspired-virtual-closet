import { Link } from 'react-router-dom';
import styled from 'styled-components';

const AppHeader = styled.header`
    width: 100%;
    height: var(--header-height);
    display: flex;
    align-items: center;
    padding: 0 24px;
    background-color: var(--primary);
    box-shadow: var(--box-shadow);
    z-index: 1000;

    .logo {
        text-decoration: none;
        font-family: 'Mallows';
        color: var(--white);
        font-size: 60px;
        cursor: pointer;
    }

    @media (min-width: 500px) {
        padding: 0 48px;
    }

    @media (min-width: 768px) {
        padding: 0 60px;
    }
`;

export default function Header() {
    
    return (
        <AppHeader>
            <Link to="/" className="logo">Edie styles</Link>
        </AppHeader>
    );
}
