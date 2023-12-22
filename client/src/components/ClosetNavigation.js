import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import cuid from 'cuid';
import { Tooltip } from '@mui/material';
import Clothes from './Clothes';
import Canvas from './Canvas';
import Outfits from './Outfits';
import AddItems from './AddItems';
import { ClosetNavigationContainer } from '../styles/ClosetNavigation';


export default function ClosetNavigation({ open, openSidebar, client, category, getCategories }) {
    const [closetMode, setClosetMode] = useState(0);
    const [currCategory, setCurrCategory] = useState(category?.name);
    const [showIcons, setShowIcons] = useState(window.innerWidth > 480 ? false : true);
    const [canvasItems, setCanvasItems] = useState([]);
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

    function addCanvasItem(item) {
        setCanvasItems([...canvasItems, item]);
    }

    function removeCanvasItems(itemsToRemove) {
        let updatedCanvasItems = canvasItems;
        itemsToRemove.forEach(itemToRemove => {
            updatedCanvasItems = updatedCanvasItems.filter(item => item.fileId !== itemToRemove.fileId);
        });
        setCanvasItems(updatedCanvasItems)
    }

    const closetModes = [
        { name: 'CLOTHES', icon: 'checkroom'},
        { name: `CANVAS (${canvasItems.length})`, icon: 'swipe'},
        { name: 'OUTFITS', icon: 'dry_cleaning'},
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
                    <Clothes display={closetMode === 0} category={category} updateItems={updateItems} addCanvasItem={addCanvasItem} />
                    <Canvas display={closetMode === 1} open={open} itemList={canvasItems} removeCanvasItems={removeCanvasItems} />
                    <Outfits display={closetMode === 2} />
                    <AddItems display={closetMode === 3} client={client} category={category} openSidebar={openSidebar} updateItems={updateItems} />
                </div>
            </ClosetNavigationContainer>
        </>
    );
}
