import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from '@mui/material';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { googleLogout } from '@react-oauth/google';
import Loading from './Loading';
import api from '../api';
import headerLogo from '../images/header-logo.png';

const AppHeader = styled.header`
    width: 100%;
    min-height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 0 24px;
    background-color: var(--grey);
    border-bottom: 2px solid var(--black);
    /* box-shadow: var(--box-shadow); */
    z-index: 1000;

    .header-logo {
        display: flex;
        justify-content: center;
        align-items: center;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;

        & img {
            height: calc(var(--header-height) - 20px);
        }
    }

    .links {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .main-links {
        display: flex;
        flex-direction: column;
    }

    .logout,
    .main-site,
    .help {
        font-size: 20px;
        font-family: 'Prata';
        color: var(--black);
        white-space: nowrap;
        background: none;
        cursor: pointer;
        transition: 0.1s;
        border-radius: 56px;

        &:hover {
            color: var(--primary);
        }
    }

    @media (min-width: 500px) {
        .links {
            flex-direction: row;
            gap: 28px;
        }

        .main-links {
            flex-direction: row;
            gap: 28px;
        }
    }

    @media (min-width: 500px) {
        padding: 0 48px;
    }

    @media (min-width: 768px) {
        padding: 0 60px;
    }
`;

export default function Header() {
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { user, setUser } = useUser();


    async function handleLogout() {
        setLoading(true);
        try {
            await api.post('/google-auth/logout');
            googleLogout();
            setUser(null);
            navigate('/');
        } catch (err) {
            console.log(err)
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    }

    return (
        <>
            <AppHeader>
                <Link to="/" className="header-logo"><img src={headerLogo} alt="Edie Styles Inspired Virtual Closet" className="big-logo" /></Link>
                <div className="links">
                    <div className="main-links">
                        <a className="main-site" href="https://ediestyles.com/" target="_blank" rel="noreferrer">
                            Main Site
                        </a>
                        { user &&
                            <button className="logout" onClick={handleLogout}>
                                Log Out
                            </button>
                        }
                    </div>
                    <Tooltip title="Help">
                        <a className="help" href="https://drive.google.com/file/d/14mXhkWNy0VFvizLMCzTMTO9eYCwZNCYw/view?ts=68b5f963" target="_blank" rel="noreferrer">
                            ?
                        </a>
                    </Tooltip>
                </div>
            </AppHeader>
            <Loading open={loading} />
        </>
    );
}

