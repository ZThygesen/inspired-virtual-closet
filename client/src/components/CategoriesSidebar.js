import { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
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
    'Ties',
    'This is a test for long text',
    'sdugfwuiygdfiuywguofydgowegfw'
];

const sidebarBottomPadding = 20;

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
        flex-grow: 1;
        overflow-x: hidden;
    }

    .add-category-footer {
        position: sticky;
        width: 100%;
        font-size: 32px;
        font-weight: bold;
        background-color: var(--grey);
        min-height: var(--subheader-height);
        color: var(--black);
        box-shadow: var(--top-shadow);
        cursor: pointer; 
        overflow: hidden;
        display: flex;
        align-items: center;
    }

    .footer-container {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-left: 15px;
        box-sizing: border-box;
        padding-right: 10px;
    }

    .footer-text {
        white-space: nowrap;

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

        &:hover:after {
            transform: scaleX(1);
            transform-origin: bottom left;
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
    const [ategories, setCategories] = useState([]);

    /* useEffect(() => {
        getCategories();
    }, []); */

    async function getCategories() {
        const categories = await axios.get('/categories')
            .catch(err => console.log(err));
        setCategories(categories.data);
    } 

    function handleOpen() {
        setOpenModal(true);
    }

    function handleClose() {
        setOpenModal(false);
        setNewCategory('');
    }

    async function addCategory() {
        await axios.post('/categories', { category: newCategory })
            .catch(err => console.log(err));
        handleClose();
        getCategories();
    }

    return (
        <>
            <Sidebar
                style={{
                    minWidth: open ? '260px' : '0px',
                    width: open ? '260px' : '0px',
                    whiteSpace: open ? 'normal' : 'nowrap',
                    wordWrap: open ? 'break-word' : 'normal',
                }}>
                <div id="categories-title">
                    CATEGORIES
                    <ChevronLeft onClick={closeSidebar} sx={{ fontSize: 45 }} className="close-sidebar" />
                </div>
                <div className="categories-container">
                    {
                        categories.length > 0 &&
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
                </div>
                <div
                    className="add-category-footer"
                    onClick={handleOpen}
                >
                    <div className="footer-container">
                        <Add sx={{ fontSize: 40 }} />
                        <p className="footer-text">
                            ADD CATEGORY
                        </p>
                    </div>
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
