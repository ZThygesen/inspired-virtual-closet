import { Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Home from './pages/Home';
import Router from './pages/Router';
import './App.css';

const Container = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
`;

export default function App() {

    return (
        <Container>
            <Header />
            <Routes>
                <Route path="/*" element={<Home />} />
                <Route path="manage-clients/*" element={<Router />} />
            </Routes>
        </Container>
    );
}
