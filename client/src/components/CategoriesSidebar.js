import { useState } from 'react';
import styled from 'styled-components';
import cuid from 'cuid';
import { Modal, TextField } from '@mui/material';
import { Add, ChevronLeft } from '@mui/icons-material';

const categories = [
    'All',
    'Belts',
    'Blazers',
    'Boots',
    'Bracelets',
    'Coats',
    'Dresses',
    'Earrings',
    'Flats',
    'Handbags',
    'Hats',
    'Heels',
    'Jackets',
    'Jeans',
    'Leggings',
    'Long sleeve tops',
    'Necklaces',
    'Pants',
    'Rings',
    'Sandals',
    'Scarves',
    'Shorts',
    'Short sleeve tops',
    'Sleeveless tops',
    'Mens shoes',
    'Shirts',
    'Skirts',
    'Sneakers',
    'Suits',
    'Sunglasses',
    'Sweaters',
    'Ties'
];

const sidebarBottomPadding = 10;

const Sidebar = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: sticky;
    height: calc(100vh - var(--header-height));
    bottom: ${sidebarBottomPadding}px;
    background-color: var(--secondary-light);
    transition: 0.3s;

    #categories-title {
        position: sticky;
        width: 100%;
        font-size: 32px;
        font-weight: bold;
        background-color: var(--secondary);
        min-height: var(--subheader-height);
        text-decoration: underline;
        color: var(--white);
        box-shadow: var(--box-shadow);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-sidebar {
        position: absolute;
        right: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: rgba(0, 0, 0, 0.3);
        }
    }

    .categories-container {
        overflow-y: auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .add-category-footer {
        background: none;
        border: none;
        font-family: 'Fashion';
        position: sticky;
        bottom: ${sidebarBottomPadding}px;
        z-index: 1;
        margin-top: auto;
        background-color: var(--white);
        padding: 20px 0;
        width: 200px;
        border-radius: 20px;
        margin-top: ${sidebarBottomPadding}px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 28px;
        cursor: pointer;
        transition: all 0.1s;
        box-shadow: var(--button-shadow);

        &:hover {
            transform: scale(1.03);
        }
    }
`;

const CategoryButton = styled.button`
        background: none;
        border: none;
        width: 100%;
        padding: 8px;
        font-family: 'Fashion';
        font-size: 28px;
        transition: all 0.1s;
        cursor: pointer;

        &:hover, &.active {
            background-color: var(--secondary);
            color: var(--white);
        }
`;

const ModalContent = styled.div`
    font-family: 'Fashion';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background-color: var(--white);
    border: 2px solid var(--black);
    border-radius: 20px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40px;

    p {
        font-size: 32px;
        font-weight: bold;
    }

    .modal-options {
        display: flex;
        gap: 50px;
    }

    button {
        background: none;
        border: 1px solid var(--black);
        width: 100%;
        border-radius: 8px;
        padding: 12px;
        font-family: 'Fashion';
        font-size: 24px;
        transition: all 0.1s;
        cursor: pointer;

        &:hover {
            background-color: var(--secondary);
            border-color: var(--secondary);
            color: var(--white);
        }
    }
`;

const Input = styled(TextField)`
    & label {
        font-family: 'Fashion';
        font-weight: bold;
        color: var(--black);
    }

    .MuiInput-underline:before {
        border-bottom: 2px solid var(--black);
    }

    && .MuiInput-underline:hover:before {
        border-bottom: 2px solid var(--secondary);
    }

    & label.Mui-focused {
        color: var(--secondary);
    }
    & .MuiInput-underline:after {
        border-bottom-color: var(--secondary);
    }
    & .MuiOutlinedInput-root {
        & fieldset {
            font-family: 'Fashion';
        border-color: var(--black);
        }
        &:hover fieldset {
        border-color: var(--secondary);
        }
        &.Mui-focused fieldset {
        border-color: var(--secondary);
        }
    }
`;

export default function CategoriesSidebar({ open, closeSidebar, selectCategory }) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [openModal, setOpenModal] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    function handleOpen() {
        setOpenModal(true);
    }

    function handleClose() {
        setOpenModal(false);
        setNewCategory('');
    }

    function addCategory() {
        alert(newCategory);
        handleClose();
    }

    return (
        <>
            <Sidebar style={{ minWidth: open ? '260px' : '0px', width: open ? '260px' : '0px' }}>
                <div id="categories-title">
                    CATEGORIES
                    <ChevronLeft onClick={closeSidebar} sx={{ fontSize: 45 }} className="close-sidebar" />
                </div>
                <div className="categories-container">
                    {
                        categories.map((category, index) => (
                            <CategoryButton
                                key={cuid()}
                                onClick={() => {
                                    setActiveCategory(index);
                                    selectCategory(category);
                                }}
                                className={index === activeCategory ? 'active' : ''}
                            >
                                {category}
                            </CategoryButton>
                        ))
                    }
                    <button className="add-category-footer" onClick={handleOpen}>
                        <Add fontSize="large"/>
                        ADD CATEGORY
                    </button>
                </div>
            </Sidebar>
            <Modal
                open={openModal}
                onClose={handleClose}
            >
                <ModalContent>
                    <p>ADD CATEGORY</p>
                    <Input
                        id="outlined-category-name"
                        variant="outlined"
                        label="CATEGORY NAME"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        fullWidth
                    />
                    <div className="modal-options">
                        <button onClick={handleClose}>Cancel</button>
                        <button onClick={addCategory}>Submit</button>
                    </div>
                </ModalContent>
            </Modal>
        </>
    );
}
