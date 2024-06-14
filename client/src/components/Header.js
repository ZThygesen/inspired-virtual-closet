import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { googleLogout } from '@react-oauth/google';
import Loading from './Loading';
import api from '../api';

const AppHeader = styled.header`
    width: 100%;
    min-height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
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

    .logout {
        font-size: 24px;
        font-weight: 600;
        font-family: 'Fashion';
        color: var(--white);
        letter-spacing: 2px;
        white-space: nowrap;
        padding: 8px 16px;
        background: none;
        cursor: pointer;
        transition: 0.1s;
        border-radius: 56px;

        &:hover {
            color: var(--black);
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
                <Link to="/" className="logo">Edie styles</Link>
                { user && 
                    <button className="logout" onClick={handleLogout}>
                        Log Out
                    </button>
                }
            </AppHeader>
            <Loading open={loading} />
        </>
    );
}
