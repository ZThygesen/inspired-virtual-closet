import { useCallback, useEffect, useRef, useState } from 'react';
import { useError } from '../contexts/ErrorContext';
import api from '../api'
import cuid from 'cuid';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { Tooltip } from '@mui/material';
import { ClosetSettingsContainer } from './styles/ClosetSettings';
import { DropdownContainer, SwapDropdown } from './styles/Dropdown';

export default function ClosetSettings() {
    const { setError } = useError();

    const [activeSettingsTab, setActiveSettingsTab] = useState(0);
    const settingsTabs = [
        { name: 'Categories' },
        { name: 'Tags' },
    ];

    const [categoryGroups, setCategoryGroups] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryGroup, setNewCategoryGroup] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('clothes');
    const [newCategoryView, setNewCategoryView] = useState('no'); // permissions
    const [newCategoryAdd, setNewCategoryAdd] = useState('no'); // permissions
    const [newCategoryRmbg, setNewCategoryRmbg] = useState('no'); // permissions
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState({});
    const [editCategoryOpen, setEditCategoryOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState({});
    const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);

    const [tagGroups, setTagGroups] = useState([]);
    const [tagGroupOptions, setTagGroupOptions] = useState([]);

    const [newTagGroupName, setNewTagGroupName] = useState('');
    const [addTagGroupOpen, setAddTagGroupOpen] = useState(false);
    const [tagGroupToEdit, setTagGroupToEdit] = useState({});
    const [editTagGroupOpen, setEditTagGroupOpen] = useState(false);
    const [tagGroupToDelete, setTagGroupToDelete] = useState({});
    const [deleteTagGroupOpen, setDeleteTagGroupOpen] = useState(false);

    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#000000');
    const newTagColorRef = useRef(newTagColor);
    const [owningTagGroup, setOwningTagGroup] = useState({});
    const [addTagOpen, setAddTagOpen] = useState(false);
    const [tagToEdit, setTagToEdit] = useState({});
    const [editTagOpen, setEditTagOpen] = useState(false);
    const [tagToArchive, setTagToArchive] = useState({});
    const [archiveTagOpen, setArchiveTagOpen] = useState(false);

    const [tagToSwap, setTagToSwap] = useState({});
    const [newTagGroup, setNewTagGroup] = useState({});
    const [swapTagGroupOpen, setSwapTagGroupOpen] = useState(false);

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
            await api.post('/categories', {
                name: newCategoryName, 
                group: newCategoryGroup,
                type: newCategoryType,
                clientViewItems: newCategoryView === 'yes' ? true : false,
                clientAddItems: newCategoryAdd === 'yes' ? true : false,
                rmbgItems: newCategoryRmbg === 'yes' ? true : false,
            });
            await getCategories();
        } 
        catch (err) {
            setError({
                message: 'There was an error adding the category.',
                status: err.response.status
            });
        } 
        finally {
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
        setNewCategoryType('clothes');
        setNewCategoryView('no');
        setNewCategoryAdd('no');
        setNewCategoryRmbg('no');
        setAddCategoryOpen(false);
    }

    async function editCategory(e) {
        e.preventDefault();

        setLoading(true);
        if (categoryToEdit.name === newCategoryName &&
            categoryToEdit.group === newCategoryGroup &&
            categoryToEdit.type === newCategoryType &&
            categoryToEdit.clientViewItems === (newCategoryView === 'yes' ? true : false) &&
            categoryToEdit.clientAddItems === (newCategoryAdd === 'yes' ? true : false) &&
            categoryToEdit.rmbgItems === (newCategoryRmbg === 'yes' ? true : false)
        ) {
            setLoading(false);
            handleCloseEditCategory();
            return;
        }

        try {
            await api.patch(`/categories/${categoryToEdit._id}`, { 
                name: newCategoryName, 
                group: newCategoryGroup,
                type: newCategoryType,
                clientViewItems: newCategoryView === 'yes' ? true : false,
                clientAddItems: newCategoryAdd === 'yes' ? true : false,
                rmbgItems: newCategoryRmbg === 'yes' ? true : false,
            });
            await getCategories();
        } 
        catch (err) {
            setError({
                message: 'There was an error editing the category.',
                status: err.response.status
            });
        } 
        finally {
            setLoading(false);
        }

        handleCloseEditCategory();
    }

    function handleOpenEditCategory(category) {
        setCategoryToEdit(category)
        setNewCategoryName(category.name);
        setNewCategoryGroup(category.group || '');
        setNewCategoryType(category.type || 'clothes');
        setNewCategoryView(category.clientViewItems === true ? 'yes' : 'no');
        setNewCategoryAdd(category.clientAddItems === true ? 'yes' : 'no');
        setNewCategoryRmbg(category.rmbgItems === true ? 'yes' : 'no');
        setEditCategoryOpen(true);
    }

    function handleCloseEditCategory() {
        setCategoryToEdit({});
        setNewCategoryName('');
        setNewCategoryGroup('');
        setNewCategoryType('clothes');
        setNewCategoryView('no');
        setNewCategoryAdd('no');
        setNewCategoryRmbg('no');
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

    // Tag group management
    const getTagGroups = useCallback(async () => {
        setLoading(true);

        try {
            const response = await api.get('/tags/active');
            const tagData = response.data;

            tagData.forEach(tagGroup => {
                tagGroup.tags.sort(function(a, b) {
                    if (a.tagName < b.tagName) {
                        return -1;
                    }
                    else if (a.tagName > b.tagName) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            });

            tagData.sort(function(a, b) {
                if (a?.sortOrder === undefined) return 1;
                if (b?.sortOrder === undefined) return -1;

                return a.sortOrder - b.sortOrder;
            });

            const options = [];
            for (const tagGroup of tagData) {
                const option = {
                    value: tagGroup._id,
                    label: tagGroup.tagGroupName
                };

                options.push(option);
            }

            setTagGroups(tagData);
            setTagGroupOptions(options);
        } catch (err) {
            setError({
                message: 'There was an error fetching tags.',
                status: err?.response?.status || 'N/A'
            });
            setLoading(false);
        }

        setLoading(false);
    }, [setError]);

    useEffect(() => {
        getTagGroups();
    }, [getTagGroups]);

    async function addTagGroup(e) {
        e.preventDefault();

        setLoading(true);
        try {
            await api.post('/tags/group', { tagGroupName: newTagGroupName });
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error adding the tag group.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseAddTagGroup();
    }

    function handleOpenAddTagGroup() {
        setAddTagGroupOpen(true);
    }

    function handleCloseAddTagGroup() {
        setNewTagGroupName('');
        setAddTagGroupOpen(false);
    }

    async function editTagGroup(e) {
        e.preventDefault();

        setLoading(true);
        if (tagGroupToEdit.tagGroupName === newTagGroupName) {
            setLoading(false);
            handleCloseEditTagGroup();
            return;
        }

        try {
            await api.patch(`/tags/group/${tagGroupToEdit._id}`, { tagGroupName: newTagGroupName });
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error editing the tag group.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseEditTagGroup();
    }

    function handleOpenEditTagGroup(tagGroup) {
        setTagGroupToEdit(tagGroup);
        setNewTagGroupName(tagGroup.tagGroupName);
        setEditTagGroupOpen(true);
    }

    function handleCloseEditTagGroup() {
        setTagGroupToEdit({});
        setNewTagGroupName('');
        setEditTagGroupOpen(false);
    }

    async function deleteTagGroup() {
        setLoading(true);
        
        try {
            await api.delete(`/tags/group/${tagGroupToDelete._id}`);
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error deleting the tag group.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseDeleteTagGroup();
    }

    function handleOpenDeleteTagGroup(tagGroup) {
        setTagGroupToDelete(tagGroup);
        setDeleteTagGroupOpen(true);
    }

    function handleCloseDeleteTagGroup() {
        setTagGroupToDelete({});
        setDeleteTagGroupOpen(false);
    }

    // Tag management
    async function addTag(e) {
        e.preventDefault();

        setLoading(true);
        try {
            await api.post(`/tags/tag/${owningTagGroup._id}`, { tagName: newTagName, tagColor: newTagColor });
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error adding the tag.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseAddTag();
    }

    function handleOpenAddTag(tagGroup) {
        setOwningTagGroup(tagGroup);
        setAddTagOpen(true);
    }

    function handleCloseAddTag() {
        setNewTagName('');
        setNewTagColor('#000000');
        newTagColorRef.current = '#000000';
        setOwningTagGroup({});
        setAddTagOpen(false);
    }

    async function editTag(e) {
        e.preventDefault();

        setLoading(true);
        if (tagToEdit.tagName === newTagName &&
            tagToEdit.tagColor === newTagColor) {
            setLoading(false);
            handleCloseEditTag();
            return;
        }

        try {
            await api.patch(`/tags/tag/${owningTagGroup._id}/${tagToEdit.tagId}`, { tagName: newTagName, tagColor: newTagColor });
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error editing the tag.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseEditTag();
    }

    function handleOpenEditTag(tagGroup, tag) {
        setOwningTagGroup(tagGroup);
        setTagToEdit(tag);
        setNewTagName(tag.tagName);
        setNewTagColor(tag.tagColor);
        newTagColorRef.current = tag.tagColor;
        setEditTagOpen(true);
    }

    function handleCloseEditTag() {
        setOwningTagGroup({});
        setTagToEdit({});
        setNewTagName('');
        setNewTagColor('#000000');
        newTagColorRef.current = '#000000';
        setEditTagOpen(false);
    }

    async function archiveTag() {
        setLoading(true);
        
        try {
            await api.patch(`/tags/archive-tag/${owningTagGroup._id}/${tagToArchive.tagId}`);
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error archiving the tag.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseArchiveTag();
    }

    function handleOpenArchiveTag(tagGroup, tag) {
        setOwningTagGroup(tagGroup);
        setTagToArchive(tag);
        setArchiveTagOpen(true);
    }

    function handleCloseArchiveTag() {
        setOwningTagGroup({});
        setTagToArchive({});
        setArchiveTagOpen(false);
    }

    async function swapTagGroup() {
        setLoading(true);
        if (owningTagGroup._id === newTagGroup.value) {
            setLoading(false);
            handleCloseSwapTagGroup();
            return;
        }

        try {
            await api.patch(`/tags/tag-group/${owningTagGroup._id}/${tagToSwap.tagId}`, { newTagGroupId: newTagGroup.value });
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error changing the tag\'s group.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseSwapTagGroup();
    }

    function handleSelectTagGroup(selection) {
        setNewTagGroup(selection);
    }

    function handleOpenSwapTagGroup(tagGroup, tag) {
        setOwningTagGroup(tagGroup);
        setTagToSwap(tag);
        setNewTagGroup({ value: tagGroup._id, label: tagGroup.tagGroupName });
        setSwapTagGroupOpen(true);
    }

    function handleCloseSwapTagGroup() {
        setOwningTagGroup({});
        setTagToEdit({});
        setNewTagGroup({});
        setSwapTagGroupOpen(false);
    }

    function handleColorChange(e) {
        newTagColorRef.current = e.target.value;
        requestAnimationFrame(() => setNewTagColor(newTagColorRef.current));
    }

    async function handleReorderGroup(tagGroup) {
        const tagGroupsCopy = [...tagGroups];
        const index = tagGroups.findIndex(group => group._id === tagGroup._id);
        if (index === 0) {
            return;
        }
        tagGroupsCopy.splice(index, 1);
        tagGroupsCopy.splice(index - 1, 0, tagGroup);
        const tagGroupIds = tagGroupsCopy.map(group => group._id);

        try {
            await api.patch('/tags/group-order', { tagGroups: tagGroupIds });
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error reordering the tag groups.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

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
                                    Add Category
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="tag-settings" style={{ display: activeSettingsTab === 1 ? 'flex' : 'none' }}>
                        <div className="tag-groups">
                            {
                                tagGroups.map((tagGroup, index) => (
                                    <div className="tag-group-container" key={index}>
                                        <div className="tag-group-setting">
                                            <div className="tag-group-name">
                                                <p className="tag-group">{tagGroup.tagGroupName}</p>
                                                { index !== 0 &&
                                                    <Tooltip title="Move Up" placement="right" className="reorder-group">
                                                        <button className="material-icons tag-group-option-btn" onClick={() => handleReorderGroup(tagGroup)}>north</button>
                                                    </Tooltip>
                                                }
                                            </div>
                                            <Tooltip title="Add Tag" placement="left">
                                                <button className="material-icons tag-group-option-btn" onClick={() => handleOpenAddTag(tagGroup)}>add</button>
                                            </Tooltip>
                                            { tagGroup._id !== 0 &&
                                            <>
                                                <Tooltip title="Edit" placement="right">
                                                    <button className="material-icons tag-group-option-btn" onClick={() => handleOpenEditTagGroup(tagGroup)}>edit</button>
                                                </Tooltip>
                                                <Tooltip title="Delete" placement="right">
                                                    <button className="material-icons tag-group-option-btn" onClick={() => handleOpenDeleteTagGroup(tagGroup)}>delete</button>
                                                </Tooltip>
                                            </>
                                            }
                                        </div>
                                        <div className="tags">
                                            {
                                                tagGroup?.tags?.map(tag => (
                                                    <div className="tag-setting" key={cuid()}>
                                                        <div className="tag-display">
                                                            <div className="tag-color" style={{ backgroundColor: `${tag.tagColor}` }}></div>
                                                            <p className="tag">{tag.tagName}</p>
                                                        </div>
                                                        <Tooltip title="Change Group" placement="left">
                                                            <button className="material-icons tag-option-btn" onClick={() => handleOpenSwapTagGroup(tagGroup, tag)}>swap_vert</button>
                                                        </Tooltip>
                                                        <Tooltip title="Edit" placement="right">
                                                            <button className="material-icons tag-option-btn" onClick={() => handleOpenEditTag(tagGroup, tag)}>edit</button>
                                                        </Tooltip>
                                                        <Tooltip title="Archive" placement="right">
                                                            <button className="material-icons tag-option-btn" onClick={() => handleOpenArchiveTag(tagGroup, tag)}>archive</button>
                                                        </Tooltip>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                        <div
                            className="tag-groups-footer"
                            onClick={handleOpenAddTagGroup}
                        >
                            <div className="footer-container">
                                <span className="material-icons add-tag-group-icon">add</span>
                                <p className="footer-text">
                                    Add Tag Group
                                </p>
                            </div>
                        </div>
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
                    <h2 className="modal-title">Add Category</h2>
                    <div className="modal-content left">
                        <Input
                            type="text"
                            id="category-name"
                            label="Name"
                            value={newCategoryName ?? ''}
                            onChange={e => setNewCategoryName(e.target.value)}
                        />
                        <Input
                            type="text"
                            id="category-group"
                            label="Group"
                            value={newCategoryGroup ?? ''}
                            onChange={e => setNewCategoryGroup(e.target.value)}
                        />
                        <div className="radio-selection">
                            <p>Category Location</p>
                            <Input
                                type="radio"
                                value={newCategoryType}
                                radioOptions={[
                                    { value: 'clothes', label: 'Clothes' },
                                    { value: 'profile', label: 'Profile' },
                                ]}
                                onChange={e => setNewCategoryType(e.target.value)}
                            />
                        </div>
                        <div className="radio-selection">
                            <p>Can clients view items in this category?</p>
                            <Input
                                type="radio"
                                value={newCategoryView}
                                radioOptions={[
                                    { value: 'no', label: 'No' },
                                    { value: 'yes', label: 'Yes' },
                                ]}
                                onChange={e => {
                                    if (e.target.value === 'no') {
                                        setNewCategoryAdd('no');
                                    }
                                    setNewCategoryView(e.target.value)
                                }}
                            />
                        </div>
                        <div className={`radio-selection ${newCategoryView === 'no' ? 'disabled' : ''}`}>
                            <p>Can clients add items to this category?</p>
                            <Input
                                type="radio"
                                value={newCategoryAdd}
                                radioOptions={[
                                    { value: 'no', label: 'No' },
                                    { value: 'yes', label: 'Yes' },
                                ]}
                                onChange={e => {
                                    if (!newCategoryView) {
                                        setNewCategoryAdd(false);
                                    }
                                    else {
                                        setNewCategoryAdd(e.target.value);
                                    }
                                }}
                            />
                        </div>
                        <div className={`radio-selection`}>
                            <p>Should the background be removed from items added to this category?</p>
                            <Input
                                type="radio"
                                value={newCategoryRmbg}
                                radioOptions={[
                                    { value: 'no', label: 'No' },
                                    { value: 'yes', label: 'Yes' },
                                ]}
                                onChange={e => {
                                    setNewCategoryRmbg(e.target.value);
                                }}
                            />
                        </div>
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
                    <h2 className="modal-title">Edit Category</h2>
                    <div className="modal-content">
                        <p className="cat-to-edit" style={{fontFamily: 'Prata', fontSize: '28px'}}>{categoryToEdit.name}</p>
                        <Input
                            type="text"
                            id="category-name"
                            label="Name"
                            value={newCategoryName ?? ''}
                            onChange={e => setNewCategoryName(e.target.value)}
                        />
                        <Input
                            type="text"
                            id="category-group"
                            label="Group"
                            value={newCategoryGroup ?? ''}
                            onChange={e => setNewCategoryGroup(e.target.value)}
                        />
                        <div className="radio-selection">
                            <p>Category Location</p>
                            <Input
                                type="radio"
                                value={newCategoryType}
                                radioOptions={[
                                    { value: 'clothes', label: 'Clothes' },
                                    { value: 'profile', label: 'Profile' },
                                ]}
                                onChange={e => setNewCategoryType(e.target.value)}
                            />
                        </div>
                        <div className="radio-selection">
                            <p>Can clients view items in this category?</p>
                            <Input
                                type="radio"
                                value={newCategoryView}
                                radioOptions={[
                                    { value: 'no', label: 'No' },
                                    { value: 'yes', label: 'Yes' },
                                ]}
                                onChange={e => {
                                    if (e.target.value === 'no') {
                                        setNewCategoryAdd('no');
                                    }
                                    setNewCategoryView(e.target.value)
                                }}
                            />
                        </div>
                        <div className={`radio-selection ${newCategoryView === 'no' ? 'disabled' : ''}`}>
                            <p>Can clients add items to this category?</p>
                            <Input
                                type="radio"
                                value={newCategoryAdd}
                                radioOptions={[
                                    { value: 'no', label: 'No' },
                                    { value: 'yes', label: 'Yes' },
                                ]}
                                onChange={e => {
                                    if (!newCategoryView) {
                                        setNewCategoryAdd(false);
                                    }
                                    else {
                                        setNewCategoryAdd(e.target.value);
                                    }
                                }}
                            />
                        </div>
                        <div className={`radio-selection`}>
                            <p>Should the background be removed from items added to this category?</p>
                            <Input
                                type="radio"
                                value={newCategoryRmbg}
                                radioOptions={[
                                    { value: 'no', label: 'No' },
                                    { value: 'yes', label: 'Yes' },
                                ]}
                                onChange={e => {
                                    setNewCategoryRmbg(e.target.value);
                                }}
                            />
                        </div>
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
                    <h2 className="modal-title">Delete Category</h2>
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
            <Modal
                open={addTagGroupOpen}
                closeFn={handleCloseAddTagGroup}
                isForm={true}
                submitFn={addTagGroup}
            >
                <>
                    <h2 className="modal-title">Add Tag Group</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="tag-group-name"
                            label="Name"
                            value={newTagGroupName ?? ''}
                            onChange={e => setNewTagGroupName(e.target.value)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseAddTagGroup}>Cancel</button>
                        <button type="submit">Submit</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={editTagGroupOpen}
                closeFn={handleCloseEditTagGroup}
                isForm={true}
                submitFn={editTagGroup}
            >
                <>
                    <h2 className="modal-title">Edit Tag Group</h2>
                    <div className="modal-content">
                        <p className="tag-group-to-edit" style={{fontFamily: 'Prata', fontSize: '28px'}}>{tagGroupToEdit.tagGroupName}</p>
                        <Input
                            type="text"
                            id="tag-group-name"
                            label="Name"
                            value={newTagGroupName ?? ''}
                            onChange={e => setNewTagGroupName(e.target.value)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseEditTagGroup}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={deleteTagGroupOpen}
                closeFn={handleCloseDeleteTagGroup}
            >
                <>
                    <h2 className="modal-title">Delete Tag Group</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this tag group?</p>
                        <p className="large bold underline">{tagGroupToDelete?.tagGroupName}</p>
                        <p className="small bold warning">ALL TAGS in this group will remain active but will be moved to the Other tag group!</p>
                    </div>
                    <div className="modal-options">
                        <button onClick={handleCloseDeleteTagGroup}>Cancel</button>
                        <button onClick={deleteTagGroup}>Delete</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={addTagOpen}
                closeFn={handleCloseAddTag}
                isForm={true}
                submitFn={addTag}
            >
                <>
                    <h2 className="modal-title">Add Tag</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="tag-name"
                            label="Name"
                            value={newTagName ?? ''}
                            onChange={e => setNewTagName(e.target.value)}
                        />
                        <Input
                            type="color"
                            id="tag-color"
                            label="Color"
                            value={newTagColorRef.current}
                            onChange={handleColorChange}
                            onBlur={() => setNewTagColor(newTagColorRef.current)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseAddTag}>Cancel</button>
                        <button type="submit">Submit</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={editTagOpen}
                closeFn={handleCloseEditTag}
                isForm={true}
                submitFn={editTag}
            >
                <>
                    <h2 className="modal-title">Edit Tag</h2>
                    <div className="modal-content">
                        <p className="tag-to-edit" style={{fontFamily: 'Prata', fontSize: '28px'}}>{tagToEdit.tagName}</p>
                        <Input
                            type="text"
                            id="tag-name"
                            label="Name"
                            value={newTagName ?? ''}
                            onChange={e => setNewTagName(e.target.value)}
                        />
                        <Input
                            type="color"
                            id="tag-color"
                            label="Color"
                            value={newTagColorRef.current}
                            onChange={handleColorChange}
                            onBlur={() => setNewTagColor(newTagColorRef.current)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseEditTag}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={archiveTagOpen}
                closeFn={handleCloseArchiveTag}
            >
                <>
                    <h2 className="modal-title">Archive Tag</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to archive this tag?</p>
                        <p className="large bold underline">{tagToArchive?.tagName}</p>
                        {/* <p className="small bold warning">The tags in this group will stay active in this group. You can change their group after archiving this group.</p> */}
                    </div>
                    <div className="modal-options">
                        <button onClick={handleCloseArchiveTag}>Cancel</button>
                        <button onClick={archiveTag}>Archive</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={swapTagGroupOpen}
                closeFn={handleCloseSwapTagGroup}
            >
                <div className="modal-title">Change Tag Group</div>
                <div className="modal-content">
                    <p className="medium bold underline">{tagToSwap.tagName}</p>
                </div>
                <DropdownContainer>
                    <p className="curr-category">Current tag group: {owningTagGroup.tagGroupName}</p>
                    <p className="new-category">New Tag Group</p>
                    <SwapDropdown options={tagGroupOptions} onChange={handleSelectTagGroup} value={newTagGroup} />
                </DropdownContainer>
                <div className="modal-options">
                    <button onClick={handleCloseSwapTagGroup}>Cancel</button>
                    <button onClick={swapTagGroup}>Save</button>
                </div>
            </Modal>
        </>
    );
}