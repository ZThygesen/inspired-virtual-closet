import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Home from './pages/Home';
import DigitalCloset from './pages/DigitalCloset';
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
                <Route index element={<Home />} />
                <Route path="/digital-closet" element={<DigitalCloset />} />
            </Routes>
        </Container>
    );
}
