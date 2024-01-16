import { createContext, useContext, useState } from 'react';

const ErrorModalContext = createContext();

export function ErrorModalProvider({ children }) {
    const [error, setError] = useState(null);

    function closeError() {
        setError(null);
    }

    return (
        <ErrorModalContext.Provider value={{ error, setError, closeError }}>
            {children}
        </ErrorModalContext.Provider>
    )
}

export function useError() {
    const context = useContext(ErrorModalContext);
    return context;
}