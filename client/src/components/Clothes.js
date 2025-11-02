import { useEffect, useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import ClothingCard from './ClothingCard';
import Loading from './Loading';
import { ClothesContainer } from '../styles/Clothes';
import { DropdownContainer, SwapDropdown } from '../styles/Dropdown';
import Modal from './Modal';
import { useClient } from './ClientContext';
import { useData } from './DataContext';
import Input from './Input';
import cuid from 'cuid';

export default function Clothes({ display, category, updateItems, addCanvasItem, canvasItems }) {
    const { setError } = useError();

    const [itemToSwapCategory, setItemToSwapCategory] = useState({});
    const [currCategorySelected, setCurrCategorySelected] = useState('');
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [swapCategoryOpen, setSwapCategoryOpen] = useState(false);
    const [currOpenIndex, setCurrOpenIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    const { client } = useClient();
    const { clothesCategories } = useData();

    const [items, setItems] = useState(category?.items || []);
    const [searchResults, setSearchResults] = useState(category?.items || []);
    const [searchString, setSearchString] = useState('');

    useEffect(() => {
        setItems(category?.items || []);
    }, [category]);

    useEffect(() => {
        const words = searchString.toLowerCase().split(/\s+/).filter(Boolean);
        const results = items.filter(item =>
            words.every(word =>
                item?.fileName?.toLowerCase()?.includes(word) || 
                item?.tagNames?.some(tag => tag.toLowerCase().includes(word))
            )
        );
        setSearchResults(results);
    }, [searchString, items]);

    function handleSwapCategoryClose() {
        setSwapCategoryOpen(false);
        setItemToSwapCategory({});
        setCurrCategorySelected('');
        setCategoryOptions([]);
    }

    async function handleSwapCategorySubmit() {
        if (currCategorySelected.value === category._id || currCategorySelected === '') {
            handleSwapCategoryClose();
            return;
        }

        setLoading(true);

        try {
            await api.patch(`/files/category/${client._id}/${category._id}/${itemToSwapCategory.gcsId}`, {
                newCategoryId: currCategorySelected.value
            });
            await updateItems();
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

    function sendToCanvas(item) {
        addCanvasItem(item, 'image');
    }

    function prevClothingModal() {
        if (currOpenIndex > 0) {
            setCurrOpenIndex(current => current - 1);
        }
    }

    function nextClothingModal() {
        if (currOpenIndex < category.items.length - 1) {
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
        clothesCategories.forEach(group => {
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
            await api.patch(`/files/${client._id}/${category._id}/${item.gcsId}`, { name: newName, tags: itemTags });
            await updateItems();
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
            await api.delete(`/files/${client._id}/${category._id}/${item.gcsId}`);
            await updateItems();
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
                    <h2 className="category-title">{category.name} ({searchResults.length})</h2>
                    <Input 
                        type="text"
                        id="fuzzy-search"
                        label="Search"
                        value={searchString}
                        onChange={e => setSearchString(e.target.value)}
                    />
                </div>
                <div className="items">
                    {
                        searchResults?.map((item, index) => (
                            <ClothingCard
                                item={item}
                                editable={category._id !== -1}
                                onCanvas={canvasItems.some(canvasItem => canvasItem.itemId === item.gcsId)}
                                sendToCanvas={sendToCanvas}
                                swapCategory={swapCategory}
                                editItem={editItem}
                                deleteItem={deleteItem}
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
                    <p className="curr-category">Current category: <span className="large category-name">{category.name}</span></p>
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
