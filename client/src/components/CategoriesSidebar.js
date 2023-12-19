import { useRef, useState } from 'react';
import cuid from 'cuid';
import { CategoriesSidebarContainer } from '../styles/CategoriesSidebar';
import { Tooltip } from '@mui/material';
import Modal from './Modal';
import Input from './Input';
import { CategorySettings } from '../styles/CategoriesSidebar';

// const categories = [
//     {name: 'All', _id: 0},
//     {name: 'Belts', _id: 1},
//     {name: 'Blazers', _id: 2},
//     {name: 'Boots', _id: 3},
//     {name: 'Bracelets', _id: 4},
//     {name: 'Coats', _id: 5},
//     {name: 'Dresses', _id: 6},
//     {name: 'Earrings', _id: 7},
//     {name: 'Flats', _id: 8},
//     {name: 'Handbags', _id: 9},
//     {name: 'Hats', _id: 10},
//     {name: 'Heels', _id: 11},
//     {name: 'Jackets', _id: 12},
//     {name: 'Jeans', _id: 13},
//     {name: 'Leggings', _id: 14},
//     'Belts',
//     'Blazers',
//     'Boots',
//     'Bracelets',
//     'Coats',
//     'Dresses',
//     'Earrings',
//     'Flats',
//     'Handbags',
//     'Hats',
//     'Heels',
//     'Jackets',
//     'Jeans',
//     'Leggings',
//     'Long sleeve tops',
//     'Necklaces',
//     'Pants',
//     'Rings',
//     'Sandals',
//     'Scarves',
//     'Shorts',
//     'Short sleeve tops',
//     'Sleeveless tops',
//     'Mens shoes',
//     'Shirts',
//     'Skirts',
//     'Sneakers',
//     'Suits',
//     'Sunglasses',
//     'Sweaters',
//     'Ties',
//     'This is a test for long text','sdugfwuiygdfiuywguofydgowegfw'];

export default function CategoriesSidebar({ open, closeSidebar, closeSidebarOnSelect, categories, activeCategory, setCategory, addCategory, editCategory, deleteCategory }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState({});
    const [newCategory, setNewCategory] = useState('');
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState({});
    const [settingsOpen, setSettingsOpen] = useState(false);
    const ref = useRef();

    function scrollToRef(ref) {
        ref.current.scroll({
            top: 0,
            behavior: 'smooth'
        });
    }

    function handleSettingsClose() {
        setSettingsOpen(false);
    }

    function handleCloseAdd() {
        setAddOpen(false);
        setNewCategory('');
    }

    function handleAdd(e) {
        e.preventDefault();

        addCategory(newCategory)
        handleCloseAdd();
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

    async function handleEdit(e) {
        e.preventDefault();

        await editCategory(categoryToEdit, newCategory);
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

    async function handleDelete() {
        const stay = categoryToDelete._id !== activeCategory._id;

        await deleteCategory(categoryToDelete);
        handleCloseDelete();

        if (stay) { 
            setCategory(activeCategory);
        } else {
            setCategory(categories[0]);
            scrollToRef(ref);
        }
    }

    return (
        <>
            <CategoriesSidebarContainer className={open ? 'open' : ''}>
                <div className="categories-header">
                    <Tooltip title="Manage Categories">
                        <button className="material-icons settings-icon" onClick={() => setSettingsOpen(true)}>settings</button>
                    </Tooltip>
                    <h2 className="header-title">CATEGORIES</h2>
                    <Tooltip title="Close Sidebar">
                        <button className="material-icons close-sidebar-icon" onClick={closeSidebar}>chevron_left</button>
                    </Tooltip>
                </div>
                <div className="categories-container" ref={ref}>
                    {
                        categories.map(category => (
                            <button
                                key={cuid()}
                                onClick={() => {
                                    setCategory(category);
                                    if (closeSidebarOnSelect) {
                                        closeSidebar();
                                    }
                                }}
                                className={category._id === activeCategory?._id ? 'active category-button' : 'category-button'}
                            >
                                <p className="category-name">{category.name}</p>
                                <p className="num-items">{category.items.length}</p>
                            </button>
                        ))
                    }
                </div>
                <div
                    className="categories-footer"
                    onClick={() => setAddOpen(true)}
                >
                    <div className="footer-container">
                        <span className="material-icons add-category-icon">add</span>
                        <p className="footer-text">
                            ADD CATEGORY
                        </p>
                    </div>
                </div>
            </CategoriesSidebarContainer>
            <Modal
                open={settingsOpen}
                onClose={handleSettingsClose}
            >
                <>
                    <button className="material-icons close-modal" onClick={handleSettingsClose}>close</button>
                    <h2 className="modal-title">MANAGE CATEGORIES</h2>
                    <div className="modal-content">
                        <CategorySettings>
                            {
                                categories.map(category => (
                                    (category._id !== -1 && category._id !== 0) &&
                                    <div className="category-setting" key={cuid()}>
                                        <p className="category">{category.name}</p>
                                        <Tooltip title="Edit" placement="left">
                                            <button className="material-icons category-option-btn" onClick={() => handleEditOpen(category)}>edit</button>
                                        </Tooltip>
                                        <Tooltip title="Delete" placement="right">
                                            <button className="material-icons category-option-btn" onClick={() => handleOpenDelete(category)}>delete</button>
                                        </Tooltip>
                                    </div>
                                ))
                            }
                        </CategorySettings>
                    </div>
                </>
            </Modal>
            <Modal
                open={addOpen}
                onClose={handleCloseAdd}
                isForm={true}
                submitFn={handleAdd}
            >
                <>
                    <h2 className="modal-title">ADD CATEGORY</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="category-name"
                            label="Category Name"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseAdd}>Cancel</button>
                        <button type="submit">Submit</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={editOpen}
                onClose={handleEditClose}
                isForm={true}
                submitFn={handleEdit}
            >
                <>
                    <h2 className="modal-title">EDIT CATEGORY</h2>
                    <div className="modal-content">
                        <p className="cat-to-edit" style={{fontFamily: 'Fashion', fontSize: '32px'}}>{categoryToEdit.name}</p>
                        <Input
                            type="text"
                            id="category-name"
                            label="Category Name"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleEditClose}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={confirmDeleteOpen}
                onClose={handleCloseDelete}
            >
                <>
                    <h2 className="modal-title">DELETE CATEGORY</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this category?</p>
                        <p className="large bold underline">{categoryToDelete.name}</p>
                        <p className="small bold warning">Deleting this category will move ALL items for ALL clients who have items in this category to the "Other" category!</p>
                    </div>
                    <div className="modal-options">
                        <button onClick={handleCloseDelete}>Cancel</button>
                        <button onClick={handleDelete}>Delete</button>
                    </div>
                </>
            </Modal>
        </>
    );
}
