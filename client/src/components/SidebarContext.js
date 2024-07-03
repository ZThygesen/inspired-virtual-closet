import { createContext, useContext, useEffect, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 800 ? true : false);
    const [mobileMode, setMobileMode] = useState(window.innerWidth <= 800 ? true : false);
    const [canvasMode, setCanvasMode] = useState(false);
    const [currCategoryClicked, setCurrCategoryClicked] = useState(false);

    useEffect(() => {
        if (mobileMode) {
            setSidebarOpen(false);
        }
        
    }, [mobileMode]);

    useEffect(() => {
        function handleResize() {
            if (!canvasMode) {
                if (window.innerWidth <= 800) {
                    setMobileMode(true);
                } else {
                    setMobileMode(false);
                }
            }
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [canvasMode]);

    return (
        <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, mobileMode, setMobileMode, canvasMode, setCanvasMode, currCategoryClicked, setCurrCategoryClicked }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    return useContext(SidebarContext);
}