import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from './UserContext';

export default function ProtectedRoute({ adminOnly = false }) {
    const { user } = useUser();
    
    if (!user) {
        return <Navigate to="/" />;
    }

    if (adminOnly && !user?.isAdmin) {
        return <Navigate to="/" />
    }
    
    return <Outlet />;
}