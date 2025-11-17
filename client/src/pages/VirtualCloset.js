import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useClient } from '../contexts/ClientContext';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import styled from 'styled-components';
import CategoriesSidebar from '../components/CategoriesSidebar';
import { ClosetNavigationContainer } from '../styles/ClosetNavigation';
import { Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import cuid from 'cuid';
import Clothes from '../components/Clothes';
import Canvas from '../components/Canvas';
import Outfits from '../components/Outfits';
import Shopping from '../components/Shopping';
import Profile from '../components/Profile';
import AddItems from '../components/AddItems';

const Container = styled.div`
    flex: 1;
    font-family: 'Prata';
    display: flex;
`;

const logoCanvasItem = {
    canvasId: 0,
    type: 'image',
    src: 'https://storage.googleapis.com/edie-styles-virtual-closet/canvas-logo.png'
};

export default function VirtualCloset() {
    const { user } = useUser();
    const { client } = useClient();
    const { outfits, shopping, currentCategory } = useData();
    const { sidebarOpen, setSidebarOpen, mobileMode } = useSidebar();

    const ref = useRef();
    const sidebarRef = useRef();
    const closetTitleRef = useRef();

    const [showIcons, setShowIcons] = useState(window.innerWidth > 740 ? false : true);
    const [closetTitleHeight, setClosetTitleHeight] = useState(closetTitleRef?.current?.offsetHeight || 0);

    const [canvasItems, setCanvasItems] = useState([logoCanvasItem]);

    const [outfitEditMode, setOutfitEditMode] = useState(false);
    const [outfitToEdit, setOutfitToEdit] = useState(null);

    const [itemToSearch, setItemToSearch] = useState(null);

    const [optionsExpanded, setOptionsExpanded] = useState(false);

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

    // canvas
    const addCanvasItem = useCallback((item, type) => {
        let canvasItem;
        if (type === 'image') {
            canvasItem = {
                canvasId: cuid(),
                itemId: item.gcsId,
                type: type,
                src: item.fullFileUrl,
            };
        } 
        else {
            canvasItem = {
                canvasId: cuid(),
                type: type,
                initialText: item
            };
        }  

        setCanvasItems([...canvasItems, canvasItem]);
    }, [canvasItems]);

    function removeCanvasItems(itemsToRemove) {
        let updatedCanvasItems = canvasItems;
        itemsToRemove.forEach(itemToRemove => {
            updatedCanvasItems = updatedCanvasItems.filter(item => item.canvasId !== itemToRemove.canvasId || itemToRemove.canvasId === 0);
        });
        setCanvasItems(updatedCanvasItems)
    }

    // outfits
    const searchOutfitsByItem = useCallback((item) => {
        setClosetMode(2);
        setItemToSearch(item);
    }, []);

    function clearItemToSearch() {
        setItemToSearch(null);
    }

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
    
    // closet controls
    const [closetMode, setClosetMode] = useState(0);
    const closetModes = [
        { name: 'Clothes', icon: 'checkroom'},
        { name: `Canvas (${canvasItems.length - 1})`, icon: 'swipe'},
        { name: `Outfits (${outfits.length})`, icon: 'dry_cleaning'},
        { name: `Shopping (${shopping.length})`, icon: 'sell'},
        { name: 'Profile', icon: 'person'},
        { name: 'Add', icon: 'add_box'}
    ];

    useEffect(() => {
        scrollToRef(ref);
    }, [currentCategory, closetMode]);

    function scrollToRef(ref) {
        ref.current.scroll({
            top: 0,
            behavior: 'smooth'
        });
    }

    return (
        <>
            <Container>
                <CategoriesSidebar
                    sidebarRef={sidebarRef}
                    addCanvasItem={addCanvasItem}
                    searchOutfitsByItem={searchOutfitsByItem}
                    canvasItems={canvasItems}
                    setClothesClosetMode={() => setClosetMode(0)}
                />
                <ClosetNavigationContainer className={`${sidebarOpen ? 'sidebar-open' : ''} ${closetMode === 1 && mobileMode ? 'canvas-mode-mobile' : ''} ${user?.isAdmin || user?.isSuperAdmin ? 'user-admin' : 'user-non-admin'}`}>
                    <div className={`closet-title ${optionsExpanded ? 'expanded' : ''}`} ref={closetTitleRef}>
                        {!sidebarOpen &&
                            <Tooltip title="Open Sidebar">
                                <button className="material-icons open-sidebar-icon" onClick={() => setSidebarOpen(true)}>chevron_right</button>
                            </Tooltip>
                        }
                        <h1 className="client-closet">
                            {`${client.firstName} ${client.lastName}`}
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
                            addCanvasItem={addCanvasItem}
                            canvasItems={canvasItems}
                            searchOutfitsByItem={searchOutfitsByItem}
                        />
                        { user?.isAdmin &&
                            <Canvas 
                                display={closetMode === 1}
                                sidebarRef={sidebarRef} 
                                images={canvasItems.filter(item => item.type === 'image')}
                                textboxes={canvasItems.filter(item => item.type === 'textbox')}
                                addCanvasItem={addCanvasItem}
                                removeCanvasItems={removeCanvasItems} 
                                editMode={outfitEditMode}
                                outfitToEdit={outfitToEdit}
                                cancelEdit={cancelOutfitEdit}
                            />
                        }
                        <Outfits 
                            display={closetMode === 2}
                            sendOutfitToCanvas={sendOutfitToCanvas}
                            itemToSearch={itemToSearch}
                            clearItemToSearch={clearItemToSearch}
                        />
                        <Shopping 
                            display={closetMode === 3}
                        />
                        <Profile 
                            display={closetMode === 4}
                        />
                        <AddItems   
                            display={closetMode === 5}
                        />
                    </div>
                </ClosetNavigationContainer>
            </Container>
            <p className="copyright">© 2025 Edie Styles, LLC</p>
        </>
    )
}
