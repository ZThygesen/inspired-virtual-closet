import { useEffect, useState } from 'react';
import styled from 'styled-components';
import cuid from 'cuid';
import { ChevronRight } from '@mui/icons-material';
import Clothes from './Clothes';
import Canvas from './Canvas';
import Outfits from './Outfits';
import AddClothes from './AddClothes';

const Container = styled.div`
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
        min-height: var(--subheader-height);
        color: var(--black);
        display: flex;
        align-items: center;
        justify-content: center;
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
        //box-shadow: var(--box-shadow);
        display: flex;
        align-items: flex-end;
    }

    ul {
        display: flex;
    }

    li {
        padding: 15px;
        transition: all 0.3s;

        &.active {
            background-color: var(--white);
            box-shadow: var(--tab-shadow);
        }
    }

    .closet-content {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
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

export default function ClosetNavigation({ open, openSidebar, category }) {
    const [closetMode, setClosetMode] = useState(0);
    const [currCategory, setCurrCategory] = useState(category);

    useEffect(() => {
        if (category !== currCategory) {
            setCurrCategory(category);
            setClosetMode(0);
        }
    }, [category, currCategory])

    const closetModes = ['CLOTHES', 'CANVAS', 'OUTFITS', 'ADD CLOTHES'];

    return (
        <>
            <Container >
                <div id="client-closet-title">
                    {!open && <ChevronRight onClick={openSidebar} sx={{ fontSize: 45 }} className="open-sidebar" />}
                    LIZETTE'S CLOSET
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
                <div className="closet-content">
                    {closetMode === 0 && <Clothes category={category} />}
                    {closetMode === 1 && <Canvas />}
                    {closetMode === 2 && <Outfits />}
                    {closetMode === 3 && <AddClothes />}
                </div>
            </Container>
        </>
    );
}
