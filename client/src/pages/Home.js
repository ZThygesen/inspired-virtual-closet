import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '../components/ErrorContext';
import { useUser } from '../components/UserContext';
import axios from 'axios';
import { HomeContainer } from '../styles/Home';
import ActionButton from '../components/ActionButton'
import logo from '../images/big_logo.png';
import Loading from '../components/Loading';
import { GoogleLogin } from '@react-oauth/google';

export default function Home() {
    const { setError } = useError();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { user, setUser, loading } = useUser();

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
            const response = await axios.post('/google-auth', {
                credential: credentialResponse.credential,
                clientId: credentialResponse.clientId
            });

            const token =  response?.data?.token;
            if (token) {
                localStorage.setItem('jwtToken', token);
            }

            const user = response?.data?.user;
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        } catch (err) {
            setError({ message: err.message, status: err.status }); 
        }
    }

    return (
        <>
            <HomeContainer>
                <img src={logo} alt="Edie Styles" className="big-logo" />
                <div className="home-options">
                    <h1>Virtual Closet</h1>
                    { isAuthenticated ? 
                        ( isAdmin ?
                            <ActionButton variant={'primary'} onClick={() => navigate('clients')}>Clients</ActionButton>
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
                </div>
            </HomeContainer>
            <Loading open={loading} />
        </>
    );
}
