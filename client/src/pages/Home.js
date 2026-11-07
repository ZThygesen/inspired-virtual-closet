import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '../contexts/ErrorContext';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';
import { HomeContainer } from '../components/styles/Home';
import ActionButton from '../components/ActionButton'
import homeLogo from '../images/home-logo.png';
import { GoogleLogin } from '@react-oauth/google';

export default function Home() {
    const { setError } = useError();
    const { user, setUser } = useUser();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (sessionStorage.getItem('disabled')) {
            setUser(null);
            setError({ message: 'Login access to your closet has been blocked', messageOnly: true });
            sessionStorage.removeItem('disabled');
        }
    }, [setError, setUser]);

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
        } 
        catch (err) {
            let message = err.message;
            let messageOnly = false;
            if (err?.response?.data?.message === 'user is disabled') {
                message = 'Login access to your closet has been blocked.';
                messageOnly = true;
            }
            setError({ message: message, status: err.status, messageOnly: messageOnly }); 
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
                            onClick={() => {
                                navigate(user._id);
                            }}
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
            <p className="copyright">© 2026 Edie Styles, LLC</p>
        </>
    );
}
