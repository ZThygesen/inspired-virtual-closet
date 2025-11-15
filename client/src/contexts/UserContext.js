import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import Loading from '../components/Loading';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function verifyToken() {
            try {
                const response = await axios.post(`/google-auth/verify-token`, { withCredentials: true });
                setUser(response?.data?.user);
            } catch (err) {
                setUser(null);
            } finally {
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
            <Loading open={loading} />
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
}