import { createContext, useCallback, useContext, useState } from 'react';
import axios from 'axios';
import Loading from '../components/Loading';

const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(false);

    const resetClient = useCallback(() => {
        setClient(null);
    }, []);

    const updateClient = useCallback(async () => {
        if (client) {
            try {
                const response = await axios.get(`/api/clients/${client._id}`, { withCredentials: true });
                setClient(response?.data);
            } 
            catch (err) {
                setClient(null);
            } 
            finally {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        }
    }, [client]);

    return (
        <ClientContext.Provider value={{ client, setClient, updateClient, resetClient }}>
            {children}
            <Loading open={loading} />
        </ClientContext.Provider>
    );
};

export const useClient = () => {
    return useContext(ClientContext);
}