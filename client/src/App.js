import { Route, Routes } from 'react-router-dom';
import { ErrorModalProvider, useError } from './components/ErrorContext';
import ErrorModal from './components/ErrorModal';
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

// function ErrorModalWrapper() {
//     const { isOpen, closeModal, errorMessage } = useError();
//     console.log(isOpen, closeModal, errorMessage)

//     return (
//         <ErrorModal isOpen={isOpen} onClose={closeModal} errorMessage={errorMessage} />
//     );
// }

export default function App() {

    return (
        <ErrorModalProvider>
            <AppContainer>
                <Header />
                <Routes>
                    <Route index element={<Home />} />
                    <Route path="clients/*" element={<Router />} />
                </Routes>
            </AppContainer>
            <ErrorModal />
        </ErrorModalProvider>
    );
}
