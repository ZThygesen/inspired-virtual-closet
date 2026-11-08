import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import api from '../api';

const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setLoading } = useLoading();

    const [client, setClient] = useState(null);
    const [clientId, setClientId] = useState(null);

    const resetClient = useCallback(() => {
        setClient(null);
        setClientId(null);
        if (location.pathname !== '/clients') {
            navigate('/clients');
        }
    }, [location.pathname, navigate]);

    const updateClient = useCallback(async () => {
        if (clientId) {
            try {
                const response = await api.get(`/api/clients/${clientId}`);
                setClient(response?.data);
            } 
            catch (err) {
                resetClient();
            } 
            finally {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        }
    }, [clientId, resetClient, setLoading]);

    useEffect(() => {
        if (location.pathname === '/clients') {
            setClient(null);
            setClientId(null);
        }
    }, [location.pathname]);


    useEffect(() => {
        if (clientId && (location.pathname !== '/clients')) {
            updateClient();
        }
    }, [clientId, location.pathname, resetClient, updateClient]);

    return (
        <ClientContext.Provider value={{ client, setClient, setClientId, updateClient, resetClient }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClient = () => {
    return useContext(ClientContext);
}