import { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import cuid from 'cuid';
import { Modal, TextField, Tooltip } from '@mui/material';
import { Add, ChevronLeft, Close, Delete, Edit, Settings } from '@mui/icons-material';

/* const categories = [
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
]; */

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

    .close-sidebar, .settings {
        position: absolute;
        right: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: rgba(0, 0, 0, 0.3);
        }
    }

    .settings {
        left: 5px;
        padding: 5px;
    }

    .categories-container {
        overflow-y: auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
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
    max-height: 70vh;
    overflow-y: auto;

    .title, .cat-to-edit {
        font-size: 32px;
        font-weight: bold;
    }

    .cat-to-edit {
        font-weight: normal;
    }

    .delete-content {
        font-size: 32px;
        font-weight: bold;
        text-align: center;
    }

    .warning {
        color: red;
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

    .category-settings {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
    }

    .category-setting {
        display: grid;
        grid-template-columns: 250px 50px 50px;
        align-items: center;
    }

    .category {
        font-size: 26px;
    }

    .category-option-btn {
        justify-self: center;
        padding: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;
        color: #a7a7a7;

        &:hover {
            background-color: rgba(0, 0, 0, 0.1);
            color: var(--black);
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

const CloseModal = styled.div`
    position: absolute;
    top: 5px;
    right: 5px;
    transition: all 0.1s;
    cursor: pointer;
    color: #a7a7a7;
    //padding: 5px;
    border-radius: 50%;

    &:hover {
        //background-color: rgba(0, 0, 0, 0.2);
        color: var(--black);
    }
`;

export default function CategoriesSidebar({ open, closeSidebar, categories, selectCategory, updateCategories, editCategory, deleteCategory }) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [openModal, setOpenModal] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState({});
    const [newCategory, setNewCategory] = useState('');
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState({});
    const [settingsOpen, setSettingsOpen] = useState(false);

    function handleSettingsClose() {
        handleClose();
        setSettingsOpen(false);
    }

    function handleEditOpen(category) {
        setCategoryToEdit(category);
        setNewCategory(category.name);
        setSettingsOpen(false);
        setEditOpen(true);
    }

    function handleEditClose() {
        setCategoryToEdit({});
        setNewCategory('');
        setSettingsOpen(true);
        setEditOpen(false);
    }

    function handleEdit(e) {
        e.preventDefault();

        editCategory(categoryToEdit, newCategory);
        handleEditClose();
    }

    function handleOpenDelete(category) {
        setCategoryToDelete(category);
        setSettingsOpen(false);
        setConfirmDeleteOpen(true);
    }

    function handleCloseDelete() {
        setCategoryToDelete({});
        setSettingsOpen(true);
        setConfirmDeleteOpen(false);
    }

    function handleDelete() {
        deleteCategory(categoryToDelete);
        handleCloseDelete();
    }

    function handleClose() {
        setOpenModal(false);
        setNewCategory('');
    }

    async function addCategory(e) {
        e.preventDefault();
        
        await axios.post('/categories', { category: newCategory })
            .catch(err => console.log(err));
        handleClose();
        updateCategories();
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
                    <Tooltip title="Manage Categories">
                        <Settings onClick={() => setSettingsOpen(true)} sx={{ fontSize: 35 }} className="settings" />
                    </Tooltip>
                    CATEGORIES
                    <Tooltip title="Close Sidebar">
                        <ChevronLeft onClick={closeSidebar} sx={{ fontSize: 45 }} className="close-sidebar" />
                    </Tooltip>
                </div>
                <div className="categories-container">
                    {
                        /* categories.length <= 1 ? <NoCategories fontSize={30} /> : */
                        categories.map((category, index) => (
                            <CategoryButton
                                key={cuid()}
                                onClick={() => {
                                    setActiveCategory(index);
                                    selectCategory(category);
                                }}
                                className={index === activeCategory ? 'active' : ''}
                            >
                                {category.name}
                            </CategoryButton>
                        ))
                    }
                </div>
                <div
                    className="add-category-footer"
                    onClick={() => setOpenModal(true)}
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
                open={settingsOpen}
                onClose={handleSettingsClose}
            >
                <ModalContent>
                    <CloseModal onClick={handleSettingsClose}>
                        <Close sx={{ fontSize: 35 }} />
                    </CloseModal>
                    <p className="title">MANAGE CATEGORIES</p>
                    <div className="category-settings">
                        {
                            categories.map(category => (
                                (category._id !== -1 && category._id !== 0) &&
                                <div className="category-setting" key={cuid()}>
                                    <p className="category">{category.name}</p>
                                    <Tooltip title="Edit" placement="left">
                                        <Edit
                                            sx={{ fontSize: 30 }}
                                            className="category-option-btn"
                                            onClick={() => handleEditOpen(category)}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Delete" placement="right">
                                        <Delete
                                            sx={{ fontSize: 30 }}
                                            className="category-option-btn"
                                            onClick={() => handleOpenDelete(category)}
                                        />
                                    </Tooltip>
                                </div>
                            ))
                        }
                    </div>
                </ModalContent>
            </Modal>
            <Modal
                open={openModal}
                onClose={handleClose}
            >
                <form onSubmit={addCategory}>
                    <ModalContent>
                        <p className="title">ADD CATEGORY</p>
                        <Input
                            InputLabelProps={{ required: false }}
                            id="outlined-category-name"
                            variant="outlined"
                            label="CATEGORY NAME"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            fullWidth
                            required
                        />
                        <div className="modal-options">
                            <button type="button" onClick={handleClose}>Cancel</button>
                            <button type="submit">Submit</button>
                        </div>
                    </ModalContent>
                </form>
            </Modal>
            <Modal
                open={editOpen}
                onClose={handleEditClose}
            >
                <form onSubmit={handleEdit}>
                    <ModalContent>
                        <p className="title">EDIT CATEGORY</p>
                        <p className="cat-to-edit">{categoryToEdit.name}</p>
                        <Input
                            InputLabelProps={{ required: false }}
                            id="outlined-category-name"
                            variant="outlined"
                            label="NEW CATEGORY NAME"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            fullWidth
                            required
                        />
                        <div className="modal-options">
                            <button type="button" onClick={handleEditClose}>Cancel</button>
                            <button type="submit">Save</button>
                        </div>
                    </ModalContent>
                </form>
            </Modal>
            <Modal
                open={confirmDeleteOpen}
                onClose={handleCloseDelete}
            >
                <ModalContent>
                    <p className="delete-content">Are you sure you want to delete this category?</p>
                    <p className="delete-content" style={{ textDecoration: 'underline' }}>{categoryToDelete.name}</p>
                    <p className="delete-content warning">Deleting this category will move ALL items for ALL clients who have items in this category to the "Other" category!</p>
                    <div className="modal-options">
                        <button onClick={handleCloseDelete}>Cancel</button>
                        <button onClick={handleDelete}>Delete</button>
                    </div>
                </ModalContent>
            </Modal>
        </>
    );
}
