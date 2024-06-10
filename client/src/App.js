import { Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ErrorModalProvider } from './components/ErrorContext';
import { UserProvider } from './components/UserContext';
import ErrorModal from './components/ErrorModal';
import styled from 'styled-components';
import Header from './components/Header';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import VirtualCloset from './pages/VirtualCloset';
import Router from './pages/Router';

const AppContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
`;

export default function App() {
    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_OAUTH_CLIENT_ID}>
            <ErrorModalProvider>
                <UserProvider>
                    <AppContainer>
                        <Header />
                        <Routes>
                            <Route index element={<Home />} />
                            <Route element={<ProtectedRoute adminOnly />}>
                                <Route path="clients/*" element={<Router />} />
                            </Route>
                            <Route element={<ProtectedRoute />}>
                                <Route path=":client" element={<VirtualCloset />} />
                            </Route>
                        </Routes>
                    </AppContainer>
                    <ErrorModal />
                </UserProvider>
            </ErrorModalProvider>
        </GoogleOAuthProvider>
    );
}
