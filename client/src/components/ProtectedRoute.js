import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useUser } from '../contexts/UserContext';

export default function ProtectedRoute({ adminOnly = false }) {
    const { setLoading } = useLoading();
    const { user, userLoading } = useUser();

    useEffect(() => {
        setLoading(userLoading);
    }, [userLoading, setLoading]);

    if (userLoading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/" />;
    }

    if (adminOnly && !user?.isAdmin) {
        return <Navigate to="/" />
    }
        
    return <Outlet />;
}