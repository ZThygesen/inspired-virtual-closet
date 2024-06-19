import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const ClientContext = createContext();

export const ClientProvider = ({ children, clientId }) => {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    const updateClient = useCallback(async () => {
        try {
            const response = await axios.get(`/api/clients/${clientId}`, { withCredentials: true });
            setClient(response?.data);
        } catch (err) {
            setClient(null);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    }, [clientId]);

    useEffect(() => {
        updateClient();
    }, [updateClient]);

    return (
        <ClientContext.Provider value={{ client, updateClient, loading }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClient = () => {
    return useContext(ClientContext);
}