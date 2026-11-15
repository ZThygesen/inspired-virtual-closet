import { createContext, useContext, useEffect, useState } from 'react';
import { useLoading } from './LoadingContext';
import api from '../api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { setLoading } = useLoading();
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);

    useEffect(() => {
        async function verifyToken() {
            try {
                const response = await api.post(`/google-auth/verify-token`);
                setUser(response?.data?.user);
            } catch (err) {
                setUser(null);
            } finally {
                setTimeout(() => {
                    setLoading(false);
                    setUserLoading(false);
                }, 500);
            }
        }
        
        verifyToken();
    }, [setLoading]);

    return (
        <UserContext.Provider value={{ user, setUser, userLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
}