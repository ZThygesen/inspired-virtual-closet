import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '../contexts/ErrorContext';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';
import { HomeContainer } from '../styles/Home';
import ActionButton from '../components/ActionButton'
import homeLogo from '../images/home-logo.png';
import { GoogleLogin } from '@react-oauth/google';

export default function Home() {
    const { setError } = useError();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { user, setUser } = useUser();

    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            setIsAuthenticated(true);

            if (user.isAdmin) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } else {
            setIsAuthenticated(false);
        }
    }, [user]);

    async function handleGoogleLogin(credentialResponse) {
        try {
            const response = await axios.post('/google-auth', 
                {
                    credential: credentialResponse.credential,
                    clientId: credentialResponse.clientId
                },
                {
                    withCredentials: true
                }
            );

            const user = response?.data?.user;
            if (user) {
                setUser(user);
            } 
            else {
                setUser(null);
            }
        } catch (err) {
            setError({ message: err.message, status: err.status }); 
        }
    }

    return (
        <>
            <HomeContainer>
                <img src={homeLogo} alt="Inspired Virtual Closet" className="big-logo" />
                { isAuthenticated ? 
                    ( isAdmin ?
                        <ActionButton variant={'primary'} onClick={() => navigate('clients')}>Manage Clients</ActionButton>
                        :
                        <ActionButton 
                            variant={'primary'}
                            onClick={() => navigate(`${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}`, { state: { client: user } })}
                        >
                            My Closet
                        </ActionButton>
                    )
                    :
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => {
                            console.log('login failed');
                        }}
                        shape='pill'
                    />
                }
            </HomeContainer>
            <p className="copyright">© 2025 Edie Styles, LLC</p>
        </>
    );
}
