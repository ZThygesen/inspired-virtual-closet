import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from './UserContext';
import Loading from './Loading';

export default function ProtectedRoute({ adminOnly = false }) {
    const { user, loading } = useUser();

    if (!loading) {
        if (!user) {
            return <Navigate to="/" />;
        }

        if (adminOnly && !user?.isAdmin) {
            return <Navigate to="/" />
        }
        
        return <Outlet />;
    } else {
        return <Loading open={loading} />;
    }
}