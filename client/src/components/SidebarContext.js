import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 800 ? true : false);
    const [mobileMode, setMobileMode] = useState(window.innerWidth <= 800 ? true : false);
    const [canvasMode, setCanvasMode] = useState(false);
    const [currCategoryClicked, setCurrCategoryClicked] = useState(false);

    const { user } = useUser();
    useEffect(() => {
        if (mobileMode) {
            setSidebarOpen(false);
        }
        
    }, [mobileMode]);

    useEffect(() => {
        function handleResize() {
            if (!canvasMode) {
                if (user?.isAdmin || user?.isSuperAdmin) {
                    if (window.innerWidth <= 1050) {
                        setMobileMode(true);
                    } else {
                        setMobileMode(false);
                    }
                } else {
                    if (window.innerWidth <= 900) {
                        setMobileMode(true);
                    } else {
                        setMobileMode(false);
                    }
                }  
            }
        }

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [canvasMode, user]);

    return (
        <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, mobileMode, setMobileMode, canvasMode, setCanvasMode, currCategoryClicked, setCurrCategoryClicked }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    return useContext(SidebarContext);
}