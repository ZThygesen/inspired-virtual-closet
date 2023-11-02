import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import cuid from 'cuid';
import { Tooltip } from '@mui/material';
import Clothes from './Clothes';
import Canvas from './Canvas';
import Outfits from './Outfits';
import AddItems from './AddItems';
import { ClosetNavigationContainer } from '../styles/ClosetNavigation';

export default function ClosetNavigation({ client, category, open, openSidebar }) {
    const [closetMode, setClosetMode] = useState(0);
    const [currCategory, setCurrCategory] = useState(category?.name);
    const [allClothes, setAllClothes] = useState([]);
    const [currClothes, setCurrClothes] = useState([]);

    useEffect(() => {
        if (category.name !== currCategory) {
            setCurrCategory(category.name);
            if (closetMode !== 0 && closetMode !== 3) {
                setClosetMode(0);
            }
        }
    }, [category, currCategory, closetMode]);

    useEffect(() => {
        let clothes = [];
        if (category._id === -1) {
            allClothes.forEach(category => {
                clothes = [...clothes, ...category.items];
            });
        } else {
            for (let i = 0; i < allClothes.length; i++) {
                if (allClothes[i]._id === category._id) {
                    clothes = [...allClothes[i].items];
                    break;
                }
            }
        }

        setCurrClothes(clothes);
    }, [category, allClothes]);

    const getClothes = useCallback(async () => {
        const response = await axios.get(`/files/${client._id}`)
            .catch(err => console.log(err));
        
        setAllClothes(response.data.files);
        setClosetMode(0);
    }, [client._id]);

    useEffect(() => {
        getClothes();
    }, [getClothes]);


    const closetModes = ['CLOTHES', 'CANVAS', 'OUTFITS', 'ADD ITEMS'];

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
                                        {mode}
                                    </button>
                                </li>
                            ))
                       }
                    </ul>
                </div>
                <div className="closet-container">
                    <Clothes display={closetMode === 0} category={category} clothes={currClothes} updateItems={getClothes} />
                    <Canvas display={closetMode === 1} />
                    <Outfits display={closetMode === 2} />
                    <AddItems display={closetMode === 3} client={client} category={category} openSidebar={openSidebar} updateItems={getClothes} />
                </div>
            </ClosetNavigationContainer>
        </>
    );
}
