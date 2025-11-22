import { useCallback, useEffect, useState } from 'react';
import { useError } from '../../contexts/ErrorContext';
import { useClient } from '../../contexts/ClientContext';
import { useData } from '../../contexts/DataContext';
import api from '../../api';
import ClothingCard from './ClothingCard';
import { ClothesContainer } from './ClothesStyles';
import { DropdownContainer, SwapDropdown } from '../styles/Dropdown';
import Modal from '../Modal';
import Input from '../Input';
import cuid from 'cuid';
import { Pagination } from '@mui/material';

export default function Clothes({ display, addCanvasItem, canvasItems, searchOutfitsByItem, onSidebar }) {
    const { setError } = useError();
    const { client } = useClient();
    const { categories, tags, updateItems, currentCategory, currentItems, setLoading } = useData();

    const [searchResults, setSearchResults] = useState(currentItems || []);
    const [resultsToShow, setResultsToShow] = useState(currentItems || []);
    const [searchString, setSearchString] = useState('');
    const [showPagination, setShowPagination] = useState(false);
    const [currPage, setCurrPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 50;

    function handlePageChange(e, page) {
        setCurrPage(page);
    }

    useEffect(() => {
        setCurrPage(1);
    }, [searchString, currentCategory]);

    useEffect(() => {
        const words = searchString.toLowerCase().split(/\s+/).filter(Boolean);
        const results = currentItems.filter(item =>
            words.every(word =>
                (new RegExp(`\\b${word}`, 'i')).test(item?.categoryName + ' ' + item?.tagNamesPrefix + ' ' + item?.fileName)
            )
        );
        setSearchResults(results);

        // check if pagination is needed
        // we want to show all results from sidebar
        if ((results.length > itemsPerPage) && !onSidebar) {
            setShowPagination(true);
            setTotalPages(Math.ceil(results.length / itemsPerPage));
            const startIndex = (currPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const reducedResults = results.slice(startIndex, endIndex);
            setResultsToShow(reducedResults);
        }
        else {
            setShowPagination(false);
            setResultsToShow(results);
        }
    }, [currPage, searchString, currentItems, onSidebar]);

    // modal controls
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [tagsModalOpen, setTagsModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [modalItem, setModalItem] = useState({});
    const [newItemName, setNewItemName] = useState('');
    const [newItemTags, setNewItemTags] = useState([]);
    const [newItemTagObjects, setNewItemTagObjects] = useState([]);
    const [categorySelected, setCategorySelected] = useState('');
    const [categoryOptions, setCategoryOptions] = useState([]);

    function closeImageModal() {
        setImageModalOpen(false);
        setModalItem({});
    }

    function closeEditModal() {
        setEditModalOpen(false);
        setModalItem({});
        setNewItemName('');
        setNewItemTags([]);
        setNewItemTagObjects([]);
    }

    function closeTagsModal() {
        setTagsModalOpen(false);
    }

    function closeCategoryModal() {
        setCategoryModalOpen(false);
        setModalItem({});
        setCategorySelected('');
    }

    function closeDeleteModal() {
        setDeleteModalOpen(false);
        setModalItem({});
    }

    useEffect(() => {
        if (editModalOpen) {
            setNewItemName(modalItem.fileName);
            setNewItemTags(modalItem.tags || []);
        }
    }, [editModalOpen, modalItem, tags]);

    useEffect(() => {
        const itemTagObjects = [];
        for (const tagGroup of tags) {
            const activeTags = tagGroup.tags.filter(tag => newItemTags?.includes(tag.tagId));
            if (activeTags.length > 0) {
                itemTagObjects.push(...activeTags);
            }
        }
        setNewItemTagObjects(itemTagObjects);
    }, [newItemTags, modalItem, tags]);

    async function editItem(e) {
        e.preventDefault();
        if (newItemName === modalItem.fileName && JSON.stringify(newItemTags) === JSON.stringify(modalItem.tags)) {
            closeEditModal();
            return;
        }

        try {
            setLoading(true);
            await api.patch(`/items/${client._id}/${modalItem._id}`, { name: newItemName, tags: newItemTags });
            await updateItems();
        } 
        catch (err) {
            setError({
                message: 'There was an error editing the item.',
                status: err?.response?.status,
            });
        } 
        finally {
            setLoading(false);
            closeEditModal();
        }
    }

    useEffect(() => {
        const theseCategories = categories.filter(category => category._id !== 0);
        const categoriesWithGroups = theseCategories.filter(category => category.group);
        const categoriesWithoutGroups = theseCategories.filter(category => !category.group);

        const groupMap = {};
        for (const category of categoriesWithGroups) {
            if (!groupMap[category.group]) {
                groupMap[category.group] = [];
            }
            groupMap[category.group].push(category);
        }
        for (const category of categoriesWithoutGroups) {
            if (!groupMap['Other']) {
                groupMap['Other'] = [];
            }
            groupMap['Other'].push(category);
        }

        const options = [{ value: 0, label: 'Other' }];
        const groups = Object.keys(groupMap).sort((a, b) => {
            if (a === 'Other' && b === 'Other') {
                return 0;
            }
            else if (a === 'Other' || b === 'Other') {
                return 1;
            }
            else if (a < b) { 
                return -1; 
            }
            else if (a > b) { 
                return 1; 
            }
            else { 
                return 0; 
            }
        });
        for (const group of groups) {
            const categoryOptions = [];
            const groupCategories = groupMap[group];
            for (const category of groupCategories) {
                categoryOptions.push({
                    value: category._id,
                    label: category.name,
                });
            }
            options.push({
                type: 'group',
                name: group,
                items: categoryOptions,
            });
        }
        setCategoryOptions(options);
    }, [categories]);

    const getCategoryName = useCallback((categoryId) => {
        if (categoryId || categoryId === 0) {
            const category = categories.filter(category => category._id === categoryId)[0];
            return category.name;
        }
        else {
            return '';
        }
    }, [categories]);

    async function swapCategory() {
        if (categorySelected.value === modalItem.categoryId || categorySelected === '') {
            closeCategoryModal();
            return;
        }

        try {
            setLoading(true);
            await api.patch(`/items/category/${client._id}/${modalItem._id}`, {
                newCategoryId: categorySelected.value,
            });
            await updateItems();
        }
        catch (err) {
            setError({
                message: 'There was an error changing the item\'s category.',
                status: err?.response?.status,
            });
        } 
        finally {
            setLoading(false);
            closeCategoryModal();
        }
    }

    async function deleteItem() {
        try {
            setLoading(true);
            await api.delete(`/items/${client._id}/${modalItem._id}`);
            await updateItems();
        }
        catch (err) {
            setError({
                message: 'There was an error deleting the item.',
                status: err?.response?.status,
            });
        } 
        finally {
            setLoading(false);
            closeDeleteModal();
        }
    }

    function prevModalItem() {
        const currIndex = currentItems.findIndex(item => item._id === modalItem._id);
        if (currIndex > 0) {
            setModalItem(currentItems[currIndex - 1]);
        }
    }

    function nextModalItem() {
        const currIndex = currentItems.findIndex(item => item._id === modalItem._id);
        if (currIndex >= 0 && currIndex < (currentItems.length - 1)) {
            setModalItem(currentItems[currIndex + 1]);
        }
    }

    return (
        <>
            <ClothesContainer style={{ display: display ? 'flex' : 'none' }}>
                { !onSidebar &&
                    <div className="title-search">
                        <h2 className="category-title">{currentCategory.name} ({searchResults.length})</h2>
                        <div className="search-box">
                            <Input
                                type="text"
                                id="fuzzy-search"
                                label="Search"
                                value={searchString}
                                size="small"
                                onChange={e => setSearchString(e.target.value)}
                            />
                            <button className='material-icons clear-search-button' onClick={() => setSearchString('')}>
                                clear
                            </button>
                        </div>
                        { showPagination && 
                            <Pagination 
                                count={totalPages} 
                                page={currPage} 
                                onChange={handlePageChange}
                                variant='outlined'
                                shape='rounded'
                            />
                        }
                    </div>
                }
                <div className={`items ${onSidebar ? 'on-sidebar': ''}`}>
                    {
                        resultsToShow?.map(item => (
                            <ClothingCard
                                item={item}
                                addCanvasItem={addCanvasItem}
                                searchOutfitsByItem={searchOutfitsByItem}
                                setImageModalOpen={setImageModalOpen}
                                setEditModalOpen={setEditModalOpen}
                                setCategoryModalOpen={setCategoryModalOpen}
                                setDeleteModalOpen={setDeleteModalOpen}
                                setModalItem={setModalItem}
                                onSidebar={onSidebar}
                                onCanvas={canvasItems.some(canvasItem => canvasItem.itemId === item._id)}
                                key={cuid()}
                            />
                        ))
                    }
                </div>
            </ClothesContainer>
            <Modal
                open={imageModalOpen}
                closeFn={closeImageModal}
                isImage={true}
            >
                <>  
                    <button className="material-icons close-modal" onClick={closeImageModal}>close</button>
                    <ClothingCard 
                        item={modalItem}
                        addCanvasItem={addCanvasItem}
                        searchOutfitsByItem={searchOutfitsByItem}
                        onModal={true}
                        onCanvas={canvasItems.some(canvasItem => canvasItem.itemId === modalItem._id)}
                        prevModalItem={prevModalItem}
                        nextModalItem={nextModalItem}
                    />
                </>
            </Modal>
            <Modal
                open={editModalOpen}
                closeFn={closeEditModal}
                isForm={true}
                submitFn={editItem}
            >
                <>
                    <h2 className="modal-title">Edit Item</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="item-name"
                            label="Item Name"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                        />
                        <img
                            src={modalItem.smallFileUrl}
                            alt={modalItem.fileName}
                            className="edit-img"
                        />
                        <div className="tags-container">
                            <p className="tags-prompt">Tags</p>
                            <div className="tags">
                                {
                                    newItemTagObjects.map(tag => (
                                        <div className="tag" key={tag.tagId}>
                                            <p className="tag-name">{tag.tagName}</p>
                                            <div className="tag-color" style={{ backgroundColor: tag.tagColor }}></div>
                                        </div>
                                    ))
                                }
                            </div>
                            <button className="add-tags-button" type="button" onClick={() => setTagsModalOpen(true)}>Edit Tags</button>
                        </div>
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={closeEditModal}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={tagsModalOpen}
                closeFn={closeTagsModal}
            >
                <>
                    <h2 className="modal-title">Add Tags</h2>
                    <div className="modal-content">
                        <div className="file-card-img">
                            <img
                                src={modalItem.smallFileUrl}
                                alt={modalItem.fileName}
                                className="file-img"
                            />
                        </div>
                        <div className="tag-checkboxes">
                            <div className="tag-groups">
                                {
                                    tags.map(group => (
                                        (
                                            group.tags.length > 0 && 
                                            <div className="tag-group" key={group._id}>
                                                <p className="tag-group-name">{group.tagGroupName}</p>
                                                <div className="tags">
                                                    {
                                                        group.tags.map(tag => (
                                                            <div className={`tag ${tags.includes(String(tag.tagId)) ? 'checked' : ''}`} key={tag.tagId}>
                                                                <Input
                                                                    type="checkbox"
                                                                    id={`${tag.tagId}`}
                                                                    label={tag.tagName}
                                                                    value={newItemTags?.includes(String(tag.tagId))}
                                                                    onChange={e => {
                                                                        let updatedTags = [];
                                                                        const tagId = e.target.id;
                                                                        if (newItemTags?.includes(tagId)) {
                                                                            updatedTags = newItemTags?.filter(tag => tag !== tagId);
                                                                        }
                                                                        else {
                                                                            updatedTags = [...newItemTags, tagId];
                                                                        }
                                                                        setNewItemTags(updatedTags);
                                                                    }}
                                                                />
                                                                <div className="tag-color" style={{ backgroundColor: tag.tagColor }}></div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <div className="modal-options">
                        <button onClick={closeTagsModal}>Done</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={categoryModalOpen}
                closeFn={closeCategoryModal}
            >
                <div className="modal-title">Change Category</div>
                <DropdownContainer>
                    <p className="curr-category">Current category: <span className="large category-name">{getCategoryName(modalItem.categoryId)}</span></p>
                    <p className="new-category">New Category</p>
                    <SwapDropdown 
                        options={categoryOptions} 
                        onChange={(selection) => setCategorySelected(selection)} 
                        value={categorySelected} 
                    />
                </DropdownContainer>
                <div className="modal-content">
                    <p className="medium bold underline">{modalItem.fileName}</p>
                    <img
                        src={modalItem.smallFileUrl}
                        alt={modalItem.fileName}
                        className="delete-img"
                    />
                </div>
                <div className="modal-options">
                    <button onClick={closeCategoryModal}>Cancel</button>
                    <button onClick={swapCategory}>Save</button>
                </div>
            </Modal>
            <Modal
                open={deleteModalOpen}
                closeFn={closeDeleteModal}
            >
                <>
                    <h2 className="modal-title">Delete Item</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this item?</p>
                        <p className="large bold underline">{modalItem.fileName}</p>
                        <img
                            src={modalItem.smallFileUrl}
                            alt={modalItem.fileName}
                            className="delete-img"
                        />
                    </div>
                    <div className="modal-options">
                        <button onClick={closeDeleteModal}>Cancel</button>
                        <button onClick={deleteItem}>Delete</button>
                    </div>
                </>
            </Modal>
        </>
        
    );
}
