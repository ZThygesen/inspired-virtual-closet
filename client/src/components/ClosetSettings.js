import { useCallback, useEffect, useState } from 'react';
import { useError } from '../components/ErrorContext';
import api from '../api'
import cuid from 'cuid';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { Tooltip } from '@mui/material';
import { ClosetSettingsContainer } from "../styles/ClosetSettings";

export default function ClosetSettings() {
    const { setError } = useError();

    const [activeSettingsTab, setActiveSettingsTab] = useState(0);
    const settingsTabs = [
        { name: 'CATEGORIES' },
        { name: 'TAGS' },
    ];

    const [categoryGroups, setCategoryGroups] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryGroup, setNewCategoryGroup] = useState('');
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState({});
    const [editCategoryOpen, setEditCategoryOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState({});
    const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    // Category management
    const getCategories = useCallback(async () => {
        setLoading(true);

        try {
            const response = await api.get('/categories');

            const groupMap = {};
            response.data.forEach(category => {
                // don't add Other category
                if (category._id !== 0) {
                    if (!groupMap[category.group]) {
                        groupMap[category.group] = [];
                    }
                    groupMap[category.group].push(category);
                }
            });

            const categoriesByGroup = [];
            const groups = Object.keys(groupMap);
            groups.forEach(group => {
                const groupCategories = groupMap[group];
                
                // sort group's categories alphabetically
                categoriesByGroup.sort(function(a, b) {
                    if (a.name < b.name) {
                        return -1;
                    } 
                    else if (a.name > b.name) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });

                categoriesByGroup.push({ group: group, categories: groupCategories });
            });

            // sort group names alphabetically
            categoriesByGroup.sort(function(a, b) {
                if (a.group < b.group) {
                    return -1;
                }
                else if (a.group > b.group) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            setCategoryGroups(categoriesByGroup); 
        } catch (err) {
            setError({
                message: 'There was an error fetching categories.',
                status: err?.response?.status || 'N/A'
            });
            setLoading(false);
        }

        setLoading(false);
    }, [setError]);

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    async function addCategory(e) {
        e.preventDefault();

        setLoading(true);
        try {
            await api.post('/categories', { category: newCategoryName, group: newCategoryGroup });
            await getCategories();
        } catch (err) {
            setError({
                message: 'There was an error adding the category.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseAddCategory();
    }

    function handleOpenAddCategory() {
        setAddCategoryOpen(true);
    }

    function handleCloseAddCategory() {
        setNewCategoryName('');
        setNewCategoryGroup('');
        setAddCategoryOpen(false);
    }

    async function editCategory(e) {
        e.preventDefault();

        setLoading(true);
        if (categoryToEdit.name === newCategoryName &&
            categoryToEdit.group === newCategoryGroup
        ) {
            setLoading(false);
            handleCloseEditCategory();
            return;
        }

        try {
            await api.patch(`/categories/${categoryToEdit._id}`, { newName: newCategoryName, newGroup: newCategoryGroup });
            await getCategories();
        } catch (err) {
            setError({
                message: 'There was an error editing the category.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseEditCategory();
    }

    function handleOpenEditCategory(category) {
        setCategoryToEdit(category)
        setNewCategoryName(category.name);
        setNewCategoryGroup(category.group);
        setEditCategoryOpen(true);
    }

    function handleCloseEditCategory() {
        setCategoryToEdit({});
        setNewCategoryName('');
        setNewCategoryGroup('');
        setEditCategoryOpen(false);
    }

    async function deleteCategory() {
        setLoading(true);
        
        try {
            await api.delete(`/categories/${categoryToDelete._id}`);
            await getCategories();
        } catch (err) {
            setError({
                message: 'There was an error deleting the category.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseDeleteCategory();
    }

    function handleOpenDeleteCategory(category) {
        setCategoryToDelete(category);
        setDeleteCategoryOpen(true);
    }

    function handleCloseDeleteCategory() {
        setCategoryToDelete({});
        setDeleteCategoryOpen(false);
    }
    
    // Tag management

    return (
        <>
            <ClosetSettingsContainer>
                <div className="settings-tabs">
                    <ul>
                        {
                            settingsTabs.map((tab, index) => (
                                <li key={cuid()} className={ index === activeSettingsTab ? 'active' : '' }>
                                    <button
                                        className={ index === activeSettingsTab ? 'settings-tab active' : 'settings-tab' }
                                        onClick={() => setActiveSettingsTab(index)}
                                    >
                                        <p className="settings-tab-text">{tab.name}</p>
                                    </button>
                                </li>
                            ))
                        }
                    </ul>
                </div>
                <div className="settings-container">
                    <div className="category-settings" style={{ display: activeSettingsTab === 0 ? 'flex' : 'none' }}>
                        <div className="groups">
                            {
                                categoryGroups.map(categoryGroup => (
                                    <div className="category-group" key={cuid()}>
                                        <p className="group">{categoryGroup.group}</p>
                                        <div className="categories">
                                            {
                                                categoryGroup?.categories?.map(category => (
                                                    ( category._id !== 0 &&
                                                        <div className="category-setting" key={cuid()}>
                                                            <p className="category">{category.name}</p>
                                                            <Tooltip title="Edit" placement="left">
                                                            <button className="material-icons category-option-btn" onClick={() => handleOpenEditCategory(category)}>edit</button>
                                                        </Tooltip>
                                                        <Tooltip title="Delete" placement="right">
                                                            <button className="material-icons category-option-btn" onClick={() => handleOpenDeleteCategory(category)}>delete</button>
                                                        </Tooltip>
                                                        </div>
                                                    )
                                                ))
                                            }
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                        <div
                            className="categories-footer"
                            onClick={handleOpenAddCategory}
                        >
                            <div className="footer-container">
                                <span className="material-icons add-category-icon">add</span>
                                <p className="footer-text">
                                    ADD CATEGORY
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="tag-settings">

                    </div>
                </div>
            </ClosetSettingsContainer>
            <Loading open={loading} />
            <Modal
                open={addCategoryOpen}
                closeFn={handleCloseAddCategory}
                isForm={true}
                submitFn={addCategory}
            >
                <>
                    <h2 className="modal-title">ADD CATEGORY</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="category-name"
                            label="Category Name"
                            value={newCategoryName ?? ''}
                            onChange={e => setNewCategoryName(e.target.value)}
                        />
                        <Input
                            type="text"
                            id="category-group"
                            label="Category Group"
                            value={newCategoryGroup ?? ''}
                            onChange={e => setNewCategoryGroup(e.target.value)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseAddCategory}>Cancel</button>
                        <button type="submit">Submit</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={editCategoryOpen}
                closeFn={handleCloseEditCategory}
                isForm={true}
                submitFn={editCategory}
            >
                <>
                    <h2 className="modal-title">EDIT CATEGORY</h2>
                    <div className="modal-content">
                        <p className="cat-to-edit" style={{fontFamily: 'Fashion', fontSize: '32px'}}>{categoryToEdit.name}</p>
                        <Input
                            type="text"
                            id="category-name"
                            label="Category Name"
                            value={newCategoryName ?? ''}
                            onChange={e => setNewCategoryName(e.target.value)}
                        />
                        <Input
                            type="text"
                            id="category-group"
                            label="Category Group"
                            value={newCategoryGroup ?? ''}
                            onChange={e => setNewCategoryGroup(e.target.value)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseEditCategory}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={deleteCategoryOpen}
                closeFn={handleCloseDeleteCategory}
            >
                <>
                    <h2 className="modal-title">DELETE CATEGORY</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this category?</p>
                        <p className="large bold underline">{categoryToDelete?.name}</p>
                        <p className="small bold warning">Deleting this category will move ALL items for ALL clients who have items in this category to the "Other" category!</p>
                    </div>
                    <div className="modal-options">
                        <button onClick={handleCloseDeleteCategory}>Cancel</button>
                        <button onClick={deleteCategory}>Delete</button>
                    </div>
                </>
            </Modal>
        </>
    );
}