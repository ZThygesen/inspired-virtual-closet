import { Link } from 'react-router-dom';
import styled from 'styled-components';

const AppBar = styled.header`
    height: var(--header-height);
    width: 100vw;
    background-color: var(--primary);
    box-shadow: var(--box-shadow);
    display: flex;
    align-items: center;
    z-index: 999;

    .logo {
        text-decoration: none;
        font-family: 'Mallows';
        color: var(--white);
        font-size: 60px;
        margin-left: 50px;
        cursor: pointer;
    }
`;

export default function Header() {
    
    return (
        <AppBar>
            <Link to="/" className="logo">Edie Styles</Link>
        </AppBar>
    );
}
