import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import cuid from 'cuid';
import { Tooltip } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import Clothes from './Clothes';
import Canvas from './Canvas';
import Outfits from './Outfits';
import AddItems from './AddItems';

const Container = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--white);
    width: 100%;
    transition: 0.3s;

    #client-closet-title, .closet-options {
        position: sticky;
        width: 100%;
        font-size: 32px;
        font-weight: bold;
        background-color: var(--primary-light);
        height: var(--subheader-height);
        color: var(--black);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
    }

    .open-sidebar {
        position: absolute;
        left: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: rgba(0, 0, 0, 0.3);
        }
    }

    .closet-options {
        display: flex;
        align-items: flex-end;
    }

    ul {
        display: flex;
    }

    li {
        padding: 15px;
        transition: all 0.3s;
        box-sizing: border-box;

        &.active {
            background-color: var(--white);
            box-shadow: var(--tab-shadow);
        }
    }
`;

const ClosetButton = styled.button`
        display: inline-block;
        background: none;
        border: none;
        width: 100%;
        font-family: 'Fashion';
        color: var(--black);
        font-size: 28px;
        cursor: pointer;
        position: relative;

        &:after {
            content: '';
            position: absolute;
            width: 100%;
            transform: scaleX(0);
            height: 2px;
            bottom: 0;
            left: 0;
            background-color: var(--black);
            transform-origin: bottom right;
            transition: transform 0.15s ease-out;
        }

        &.active {
            &:after {
                transform: scaleX(1);
            }

        }

        &:not(.active):hover:after {
            transform: scaleX(1);
            transform-origin: bottom left;
        }
`;

const ClosetContainer = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    height: calc(100vh - var(--header-height) - (2 * var(--subheader-height)));
    overflow-y: auto;
`;

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
            <Container >
                <div id="client-closet-title">
                    {!open &&
                        <Tooltip title="Open Sidebar">
                            <ChevronRight onClick={openSidebar} sx={{ fontSize: 45 }} className="open-sidebar" />
                        </Tooltip>}
                    {`${client.firstName.toUpperCase()} ${client.lastName.toUpperCase()}'S CLOSET`}
                </div>
                <div className="closet-options">
                    <ul>
                        {
                            closetModes.map((mode, index) => (
                                <li key={cuid()} className={ index === closetMode ? 'active' : '' }>
                                    <ClosetButton
                                        className={ index === closetMode ? 'active' : '' }
                                        onClick={() => setClosetMode(index)}
                                    >
                                        {mode}
                                    </ClosetButton>
                                </li>
                            ))
                       }
                    </ul>
                </div>
                <ClosetContainer>
                    <Clothes display={closetMode === 0} category={category} clothes={currClothes} updateItems={getClothes} />
                    <Canvas display={closetMode === 1} />
                    <Outfits display={closetMode === 2} />
                    <AddItems display={closetMode === 3} client={client} category={category} openSidebar={openSidebar} updateItems={getClothes} />
                </ClosetContainer>
            </Container>
        </>
    );
}
