import { useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import ClothingCard from './ClothingCard';
import Loading from './Loading';
import { ClothesContainer, DropdownContainer, SwapCategoryDropdown } from '../styles/Clothes';
import cuid from 'cuid';
import Modal from './Modal';
import { useClient } from './ClientContext';

export default function Clothes({ display, category, updateItems, addCanvasItem, canvasItems }) {
    const { setError } = useError();

    const [itemToSwapCategory, setItemToSwapCategory] = useState({});
    const [currCategorySelected, setCurrCategorySelected] = useState({});
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [swapCategoryOpen, setSwapCategoryOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { client } = useClient();

    function handleSwapCategoryClose() {
        setSwapCategoryOpen(false);
        setItemToSwapCategory({});
        setCurrCategorySelected({});
        setCategoryOptions([]);
    }

    async function handleSwapCategorySubmit() {
        if (currCategorySelected.value === category._id) {
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

    async function swapCategory(item) {
        setLoading(true);
        setItemToSwapCategory(item);

        let categories;

        try {
            const response = await api.get('/categories');
            categories = response.data; 
        } catch (err) {
            setError({
                message: 'There was an error fetching categories.',
                status: err.response.status
            });
            setLoading(false);
            setItemToSwapCategory({});
            return;
        }

        // filter out the other category
        const otherCategoryIndex = categories.findIndex(category => category._id === 0);
        const otherCategory = categories.splice(otherCategoryIndex, 1)[0];

        // sort categories alphabetically
        categories.sort(function(a, b) {
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

        const sortedCategories = [otherCategory, ...categories];

        // set dropdown options
        const options = [];
        for (const categoryOpt of sortedCategories) {
            const option = {
                value: categoryOpt._id,
                label: categoryOpt.name
            };

            if (categoryOpt._id === category._id) {
                setCurrCategorySelected(option);
            }

            options.push(option);
        }

        setCategoryOptions(options);
        setLoading(false);
        setSwapCategoryOpen(true)
    }
    
    async function editItem(item, newName) {
        setLoading(true);
        if (item.fileName === newName) {
            setLoading(false);
            return;
        }

        try {
            await api.patch(`/files/${client._id}/${category._id}/${item.gcsId}`, { newName: newName });
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
                <h2 className="category-title">{category.name}</h2>
                <div className="items">
                    {
                        category?.items?.map(item => (
                            <ClothingCard
                                item={item}
                                editable={category._id !== -1}
                                onCanvas={canvasItems.some(canvasItem => canvasItem.itemId === item.gcsId)}
                                sendToCanvas={sendToCanvas}
                                swapCategory={swapCategory}
                                editItem={editItem}
                                deleteItem={deleteItem}
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
                <div className="modal-title">CHANGE CATEGORY</div>
                <DropdownContainer>
                    <p className="curr-category">Current category: <span className="large category-name">{category.name}</span></p>
                    <p className="new-category">New Category</p>
                    <SwapCategoryDropdown options={categoryOptions} onChange={handleSelectCategory} value={currCategorySelected} />
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
