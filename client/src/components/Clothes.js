import { useEffect, useState } from 'react';
import { useError } from '../contexts/ErrorContext';
import { useClient } from '../contexts/ClientContext';
import { useData } from '../contexts/DataContext';
import api from '../api';
import ClothingCard from './ClothingCard';
import Loading from './Loading';
import { ClothesContainer } from '../styles/Clothes';
import { DropdownContainer, SwapDropdown } from '../styles/Dropdown';
import Modal from './Modal';
import Input from './Input';
import cuid from 'cuid';
import { Pagination } from '@mui/material';

export default function Clothes({ display, addCanvasItem, canvasItems, searchOutfitsByItem }) {
    const { setError } = useError();

    const [itemToSwapCategory, setItemToSwapCategory] = useState({});
    const [currCategorySelected, setCurrCategorySelected] = useState('');
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [swapCategoryOpen, setSwapCategoryOpen] = useState(false);
    const [currOpenIndex, setCurrOpenIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    const { client } = useClient();
    const { categories, updateFiles, currentCategory, currentFiles } = useData();

    // const [items, setItems] = useState(category?.items || []);
    const [searchResults, setSearchResults] = useState(currentFiles || []);
    const [resultsToShow, setResultsToShow] = useState(currentFiles || []);
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
        const results = currentFiles.filter(item =>
            words.every(word =>
                item?.fileName?.toLowerCase()?.includes(word) || 
                item?.tagNames?.some(tag => tag.toLowerCase().includes(word))
            )
        );
        setSearchResults(results);

        // check if pagination is needed
        if (results.length > itemsPerPage) {
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
    }, [currPage, searchString, currentFiles]);

    function handleSwapCategoryClose() {
        setSwapCategoryOpen(false);
        setItemToSwapCategory({});
        setCurrCategorySelected('');
        setCategoryOptions([]);
    }

    async function handleSwapCategorySubmit() {
        if (currCategorySelected.value === currentCategory._id || currCategorySelected === '') {
            handleSwapCategoryClose();
            return;
        }

        setLoading(true);

        try {
            await api.patch(`/files/category/${client._id}/${itemToSwapCategory.categoryId}/${itemToSwapCategory.gcsId}`, {
                newCategoryId: currCategorySelected.value
            });
            await updateFiles();
        } catch (err) {
            setError({
                message: 'There was an error changing the item\'s category.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
            handleSwapCategoryClose();
        }
    }

    function handleSelectCategory(selection) {
        setCurrCategorySelected(selection)
    }

    function prevClothingModal() {
        if (currOpenIndex > 0) {
            setCurrOpenIndex(current => current - 1);
        }
    }

    function nextClothingModal() {
        if (currOpenIndex < currentFiles.length - 1) {
            setCurrOpenIndex(current => current + 1);
        }
    }

    function openClothingModal(index) {
        setCurrOpenIndex(index);
    }

    function closeClothingModal() {
        setCurrOpenIndex(null);
    }

    async function swapCategory(item) {
        setItemToSwapCategory(item);

        const options = [];
        categories.forEach(group => {
            const categoryOptions = [];
            group.categories.forEach(category => {
                categoryOptions.push({
                    value: category._id,
                    label: category.name
                });
            });
            options.push({
                type: 'group',
                name: group.group,
                items: categoryOptions
            });
        });

        setCategoryOptions(options);
        setSwapCategoryOpen(true)
    }
    
    async function editItem(item, newName, itemTags) {
        setLoading(true);
        const itemTagsStr = JSON.stringify(itemTags);
        if (item.fileName === newName && JSON.stringify(item.tags) === itemTagsStr) {
            setLoading(false);
            return;
        }

        try {
            await api.patch(`/files/${client._id}/${item.categoryId}/${item.gcsId}`, { name: newName, tags: itemTags });
            await updateFiles();
        } catch (err) {
            setError({
                message: 'There was an error editing the item.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

    async function deleteItem(item) {
        setLoading(true);

        try {
            await api.delete(`/files/${client._id}/${item.categoryId}/${item.gcsId}`);
            await updateFiles();
        } catch (err) {
            setError({
                message: 'There was an error deleting the item.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <ClothesContainer style={{ display: display ? 'flex' : 'none' }}>
                <div className="title-search">
                    <h2 className="category-title">{currentCategory.name} ({searchResults.length})</h2>
                    <div className="search-box">
                        <Input
                            type="text"
                            id="fuzzy-search"
                            label="Search"
                            value={searchString}
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
                <div className="items">
                    {
                        resultsToShow?.map((item, index) => (
                            <ClothingCard
                                item={item}
                                onCanvas={canvasItems.some(canvasItem => canvasItem.itemId === item.gcsId)}
                                addCanvasItem={() => addCanvasItem(item, 'image')}
                                swapCategory={swapCategory}
                                editItem={editItem}
                                deleteItem={deleteItem}
                                searchOutfitsByItem={searchOutfitsByItem}
                                prevClothingModal={prevClothingModal}
                                nextClothingModal={nextClothingModal}
                                openClothingModal={() => openClothingModal(index)}
                                closeClothingModal={closeClothingModal}
                                isOpen={currOpenIndex === index}
                                key={cuid()}
                            />
                        ))
                    }
                </div>
            </ClothesContainer>
            <Modal
                open={swapCategoryOpen}
                closeFn={handleSwapCategoryClose}
            >
                <div className="modal-title">Change Category</div>
                <DropdownContainer>
                    <p className="curr-category">Current category: <span className="large category-name">{currentCategory.name}</span></p>
                    <p className="new-category">New Category</p>
                    <SwapDropdown options={categoryOptions} onChange={handleSelectCategory} value={currCategorySelected} />
                </DropdownContainer>
                <div className="modal-content">
                    <p className="medium bold underline">{itemToSwapCategory.fileName}</p>
                    <img
                        src={itemToSwapCategory.smallFileUrl}
                        alt={itemToSwapCategory.fileName}
                        className="delete-img"
                    />
                </div>
                <div className="modal-options">
                    <button onClick={handleSwapCategoryClose}>Cancel</button>
                    <button onClick={handleSwapCategorySubmit}>Save</button>
                </div>
            </Modal>
            <Loading open={loading} />
        </>
        
    );
}
