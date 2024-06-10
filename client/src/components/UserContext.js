import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        
        async function verifyToken() {
            if (token) {
                try {
                    const response = await axios.post(`/google-auth/verify-token`, { token });
                    setUser(response?.data?.user);
                } catch (err) {
                    setUser(null);
                } finally {
                    setTimeout(() => {
                        setLoading(false);
                    }, 500);
                    
                }
            } else {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        }
        
        verifyToken();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
}