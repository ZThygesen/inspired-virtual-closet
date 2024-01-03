import { useCallback, useEffect, useRef, useState } from 'react';
import axios from "axios";
import { Link } from 'react-router-dom';
import cuid from 'cuid';
import { Tooltip } from '@mui/material';
import Clothes from './Clothes';
import Canvas from './Canvas';
import Outfits from './Outfits';
import AddItems from './AddItems';
import { ClosetNavigationContainer } from '../styles/ClosetNavigation';


export default function ClosetNavigation({ sidebarRef, open, openSidebar, client, category, getCategories }) {
    const [closetMode, setClosetMode] = useState(0);
    const [currCategory, setCurrCategory] = useState(category?.name);
    const [showIcons, setShowIcons] = useState(window.innerWidth > 480 ? false : true);
    const [canvasItems, setCanvasItems] = useState([]);

    const [outfits, setOutfits] = useState([]);
    const [outfitEditMode, setOutfitEditMode] = useState(false);
    const [outfitToEdit, setOutfitToEdit] = useState(null);

    const ref = useRef();

    function scrollToRef(ref) {
        ref.current.scroll({
            top: 0,
            behavior: 'smooth'
        });
    }

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth <= 480) {
                setShowIcons(true);
            } else {
                setShowIcons(false);
            }
        }

        window.addEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (category.name !== currCategory) {
            setCurrCategory(category.name);
            scrollToRef(ref);
            if (closetMode !== 0 && closetMode !== 3) {
                setClosetMode(0);
            }
        }
    }, [category, currCategory, closetMode]);

    async function updateItems() {
        await getCategories(category);
        setClosetMode(0);
    }

    function addCanvasItem(item, type) {
        let canvasItem;

        if (type === 'image') {
            canvasItem = {
                canvasId: cuid(),
                type: type,
                src: item.smallFileUrl
            }
        } else {
            canvasItem = {
                canvasId: cuid(),
                type: type,
                initialText: item
            }
        }  

        setCanvasItems([...canvasItems, canvasItem]);
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
    }

    function removeCanvasItems(itemsToRemove) {
        let updatedCanvasItems = canvasItems;
        itemsToRemove.forEach(itemToRemove => {
            updatedCanvasItems = updatedCanvasItems.filter(item => item.canvasId !== itemToRemove.canvasId);
        });
        setCanvasItems(updatedCanvasItems)
    }

    const getOutfits = useCallback(async (changeMode = false) => {
        const response = await axios.get(`/outfits/${client._id}`)
            .catch(err => console.log(err));

        // reverse outfits to show recently created first
        setOutfits(response.data.reverse());

        if (changeMode) {
           setClosetMode(2); 
        }
        
    }, [client]);


    useEffect(() => {
        getOutfits();
    }, [getOutfits]);

    const closetModes = [
        { name: 'CLOTHES', icon: 'checkroom'},
        { name: `CANVAS (${canvasItems.length})`, icon: 'swipe'},
        { name: `OUTFITS (${outfits.length})`, icon: 'dry_cleaning'},
        { name: 'ADD ITEMS', icon: 'add_box'}
    ];

    return (
        <>
            <ClosetNavigationContainer className={open ? 'sidebar-open' : ''}>
                <div className="closet-title">
                    {!open &&
                        <Tooltip title="Open Sidebar">
                            <button className="material-icons open-sidebar-icon" onClick={openSidebar}>chevron_right</button>
                        </Tooltip>
                    }
                    <h1 className="client-closet">{`${client.firstName.toUpperCase()} ${client.lastName.toUpperCase()}'S CLOSET`}</h1>
                    <Tooltip title="Clients">
                        <Link to={'/manage-clients'} className="material-icons clients-icon">people</Link>
                    </Tooltip>
                </div>
                <div className="closet-options">
                    <ul>
                        {
                            closetModes.map((mode, index) => (
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
                    />
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
                    <Outfits 
                        display={closetMode === 2} 
                        outfits={outfits} 
                        updateOutfits={getOutfits} 
                        sendOutfitToCanvas={sendOutfitToCanvas} 
                    />
                    <AddItems 
                        display={closetMode === 3} 
                        client={client} 
                        category={category} 
                        openSidebar={openSidebar} 
                        updateItems={updateItems} 
                    />
                </div>
            </ClosetNavigationContainer>
        </>
    );
}
