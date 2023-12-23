import { Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Home from './pages/Home';
import Router from './pages/Router';
import './App.css';

const AppContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
`;

export default function App() {

    return (
        <AppContainer>
            <Header />
            <Routes>
                <Route index element={<Home />} />
                <Route path="manage-clients/*" element={<Router />} />
            </Routes>
        </AppContainer>
    );
}
