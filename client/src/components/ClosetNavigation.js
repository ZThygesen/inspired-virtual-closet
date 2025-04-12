import { useCallback, useEffect, useRef, useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import { Link } from 'react-router-dom';
import cuid from 'cuid';
import { Tooltip } from '@mui/material';
import Clothes from './Clothes';
import Canvas from './Canvas';
import Outfits from './Outfits';
import Shopping from './Shopping';
import AddItems from './AddItems';
import Profile from './Profile';
import { ClosetNavigationContainer } from '../styles/ClosetNavigation';
import { useUser } from './UserContext';
import { useSidebar } from './SidebarContext';

const logoCanvasItem = {
    canvasId: 0,
    type: 'image',
    src: 'https://storage.googleapis.com/edie-styles-virtual-closet/logo.png'
};

export default function ClosetNavigation({ sidebarRef, client, category, getCategories, setSendToCanvas, setCategoryCanvasItems }) {
    const { setError } = useError();
    
    const closetTitleRef = useRef();
    const [closetTitleHeight, setClosetTitleHeight] = useState(closetTitleRef?.current?.offsetHeight || 0);

    const [closetMode, setClosetMode] = useState(0);
    const [currCategory, setCurrCategory] = useState(category?.name);
    const [showIcons, setShowIcons] = useState(window.innerWidth > 740 ? false : true);
    const [canvasItems, setCanvasItems] = useState([logoCanvasItem]);

    const [outfits, setOutfits] = useState([]);
    const [outfitEditMode, setOutfitEditMode] = useState(false);
    const [outfitToEdit, setOutfitToEdit] = useState(null);

    const [shoppingItems, setShoppingItems] = useState([]);

    const [optionsExpanded, setOptionsExpanded] = useState(false);

    const { sidebarOpen, setSidebarOpen, mobileMode, currCategoryClicked, setCurrCategoryClicked } = useSidebar();
    const { user } = useUser();

    const ref = useRef();

    function scrollToRef(ref) {
        ref.current.scroll({
            top: 0,
            behavior: 'smooth'
        });
    }

    useEffect(() => {
        function handleResize() {
            if (user?.isAdmin || user?.isSuperAdmin) {
                if (window.innerWidth <= 740) {
                    setShowIcons(true);
                } else {
                    setShowIcons(false);
                }
            } else {
                if (window.innerWidth <= 640) {
                    setShowIcons(true);
                } else {
                    setShowIcons(false);
                }
            }

            setClosetTitleHeight(closetTitleRef.current.offsetHeight);
        }

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [user]);

    function handleExpandOptions() {
        setOptionsExpanded(current => !current);
    }

    useEffect(() => {
        if (category.name !== currCategory || currCategoryClicked) {
            setCurrCategory(category.name);
            scrollToRef(ref);
            if (closetMode !== 0 && closetMode !== 1 && closetMode !== 5) {
                setClosetMode(0);
            }
            setCurrCategoryClicked(false);
        }
    }, [category, currCategory, closetMode, currCategoryClicked, setCurrCategoryClicked]);

    async function updateItems(animateLoad = false) {
        await getCategories(category, animateLoad);
        setClosetMode(0);
    }

    const addCanvasItem = useCallback((item, type) => {
        let canvasItem;

        if (type === 'image') {
            canvasItem = {
                canvasId: cuid(),
                itemId: item.gcsId,
                type: type,
                src: item.fullFileUrl,
            }
        } else {
            canvasItem = {
                canvasId: cuid(),
                type: type,
                initialText: item
            }
        }  

        setCanvasItems([...canvasItems, canvasItem]);
    }, [canvasItems]);

    useEffect(() => {
        setSendToCanvas(addCanvasItem);
    }, [setSendToCanvas, addCanvasItem]);

    useEffect(() => {
        setCategoryCanvasItems(canvasItems);
    }, [setCategoryCanvasItems, canvasItems]);

    function sendOutfitToCanvas(outfit) {
        setCanvasItems([]);

        const stageItems = outfit.stageItems;
        const items = [];
        stageItems.forEach(stageItem => {
            if (stageItem.className === 'Image') {
                // get the image object from the stageItem
                const existingItem = stageItem.attrs.item;

                // add the stage item canvas attrs but without the item attribute (bc we already have it)
                const { item, ...attrs } = stageItem.attrs; 
                existingItem.attrs = attrs;

                items.push(existingItem)
            } else {
                // get the textbox object from the stageItem
                const existingItem = stageItem.attrs.item;
                // add the stage item canvas attrs but without the item attribute (bc we already have it)
                const { item, ...attrs} = stageItem.attrs;
                existingItem.groupAttrs = attrs;

                // handle the text node attrs
                const textItem = stageItem.children[0];
                existingItem.textAttrs = textItem.attrs;
                
                items.push(existingItem);
            }
        });
        setOutfitEditMode(true);
        setOutfitToEdit(outfit);
        setClosetMode(1);
        setCanvasItems(items);
    }

    async function cancelOutfitEdit() {
        setOutfitEditMode(false);
        setOutfitToEdit(null);
        setCanvasItems([logoCanvasItem]);
    }

    function removeCanvasItems(itemsToRemove) {
        let updatedCanvasItems = canvasItems;
        itemsToRemove.forEach(itemToRemove => {
            updatedCanvasItems = updatedCanvasItems.filter(item => item.canvasId !== itemToRemove.canvasId || itemToRemove.canvasId === 0);
        });
        setCanvasItems(updatedCanvasItems)
    }

    const getOutfits = useCallback(async (changeMode = false) => {
        try {
            const response = await api.get(`/outfits/${client._id}`);
            
            // reverse outfits to show recently created first
            setOutfits(response.data.reverse());

            if (changeMode) {
                setClosetMode(2); 
            }
        } catch (err) {
            setError({
                message: 'There was an error fetching client outfits.',
                status: err.response.status
            });
        }
    }, [client, setError]);

    useEffect(() => {
        getOutfits();
    }, [getOutfits]);

    const getShoppingItems = useCallback(async () => {
        try {
            const response = await api.get(`/shopping/${client._id}`);
            setShoppingItems(response.data);
        } catch (err) {
            setError({
                message: 'There was an error fetching client shopping items.',
                status: err.response.status
            });
        }
    }, [client, setError]);

    useEffect(() => {
        getShoppingItems();
    }, [getShoppingItems]);

    const closetModes = [
        { name: 'CLOTHES', icon: 'checkroom'},
        { name: `CANVAS (${canvasItems.length - 1})`, icon: 'swipe'},
        { name: `OUTFITS (${outfits.length})`, icon: 'dry_cleaning'},
        { name: `SHOPPING (${shoppingItems.length})`, icon: 'sell'},
        { name: 'PROFILE', icon: 'person'},
        { name: 'ADD', icon: 'add_box'}
    ];

    return (
        <>
            <ClosetNavigationContainer className={`${sidebarOpen ? 'sidebar-open' : ''} ${closetMode === 1 && mobileMode ? 'canvas-mode-mobile' : ''} ${user?.isAdmin || user?.isSuperAdmin ? 'user-admin' : 'user-non-admin'}`}>
                <div className={`closet-title ${optionsExpanded ? 'expanded' : ''}`} ref={closetTitleRef}>
                    {!sidebarOpen &&
                        <Tooltip title="Open Sidebar">
                            <button className="material-icons open-sidebar-icon" onClick={() => setSidebarOpen(true)}>chevron_right</button>
                        </Tooltip>
                    }
                    <h1 className="client-closet">
                        {`${client.firstName.toUpperCase()} ${client.lastName.toUpperCase()}`}
                        { closetMode === 1 &&
                            <Tooltip title="Expand Options" placement="top">
                                <button className="material-icons expand-closet-options" onClick={handleExpandOptions}>expand_more</button>
                            </Tooltip>
                        }
                    </h1>
                    { user?.isAdmin &&
                        <Tooltip title="Clients">
                            <Link to={'/clients'} className="material-icons clients-icon">people</Link>
                        </Tooltip>
                    }
                </div>
                <div className={`closet-options ${closetMode === 1 ? 'canvas-mode' : ''} ${optionsExpanded ? 'expanded' : ''}`} style={{ top: `${closetMode === 1 ? `${closetTitleHeight}px` : 'unset'}` }}>
                    <ul>
                        {
                            closetModes.map((mode, index) => (
                                (index !== 1 || (index === 1 && user?.isAdmin)) &&    
                                <li key={cuid()} className={ index === closetMode ? 'active' : '' }>
                                    <button
                                        className={ index === closetMode ? 'closet-button active' : 'closet-button' }
                                        onClick={() => setClosetMode(index)}
                                    >
                                        {showIcons ?
                                            <Tooltip title={mode.name}>
                                                <p className="material-icons closet-mode-icon">{mode.icon}</p>
                                            </Tooltip> 
                                            :
                                            <p className="closet-mode-text">{mode.name}</p>
                                        }
                                    </button>
                                </li>
                                
                            ))
                       }
                    </ul>
                </div>
                <div ref={ref} className="closet-container">
                    <Clothes 
                        display={closetMode === 0} 
                        category={category} 
                        updateItems={updateItems} 
                        addCanvasItem={addCanvasItem}
                        canvasItems={canvasItems}
                    />
                    { user?.isAdmin &&
                        <Canvas 
                            display={closetMode === 1}
                            sidebarRef={sidebarRef} 
                            client={client} 
                            images={canvasItems.filter(item => item.type === 'image')}
                            textboxes={canvasItems.filter(item => item.type === 'textbox')}
                            addCanvasItem={addCanvasItem}
                            removeCanvasItems={removeCanvasItems} 
                            updateOutfits={getOutfits}
                            editMode={outfitEditMode}
                            outfitToEdit={outfitToEdit}
                            cancelEdit={cancelOutfitEdit}
                        />
                    }
                    <Outfits 
                        display={closetMode === 2} 
                        outfits={outfits} 
                        updateOutfits={getOutfits} 
                        sendOutfitToCanvas={sendOutfitToCanvas} 
                    />
                    <Shopping 
                        display={closetMode === 3}
                        shoppingItems={shoppingItems}
                        updateShoppingItems={getShoppingItems}
                    />
                    <Profile 
                        display={closetMode === 4}
                    />
                    <AddItems   
                        display={closetMode === 5}
                        category={category}
                        updateItems={updateItems} 
                    />
                </div>
            </ClosetNavigationContainer>
        </>
    );
}
