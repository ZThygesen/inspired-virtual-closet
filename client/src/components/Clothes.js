import { useState } from 'react';
import axios from 'axios';
import ClothingCard from './ClothingCard';
import Loading from './Loading';
import { ClothesContainer, DropdownContainer, SwapCategoryDropdown } from '../styles/Clothes';
import cuid from 'cuid';
import Modal from './Modal';

export default function Clothes({ display, category, updateItems, addCanvasItem }) {
    const [itemToSwapCategory, setItemToSwapCategory] = useState({});
    const [currCategorySelected, setCurrCategorySelected] = useState({});
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [swapCategoryOpen, setSwapCategoryOpen] = useState(false);
    const [loading, setLoading] = useState(false);

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

        await axios.patch(`/files/category/${category._id}/${itemToSwapCategory.gcsId}`, {
            newCategoryId: currCategorySelected.value
        })
            .catch(err => console.log(err));

        await updateItems();

        setLoading(false);
        handleSwapCategoryClose();
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
        const response = await axios.get('/categories')
            .catch(err => console.log(err));
        const categories = response.data;

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
        
        console.log(categories)
    }
    
    async function editItem(item, newName) {
        setLoading(true);
        if (item.fileName === newName) {
            setLoading(false);
            return;
        }

        await axios.patch(`/files/${category._id}/${item.gcsId}`, { newName: newName })
            .catch(err => console.log(err));
        
        await updateItems();
        setLoading(false);
    }

    async function deleteItem(item) {
        setLoading(true);
        await axios.delete(`/files/${category._id}/${item.gcsId}`)
            .catch(err => console.log(err));
        
        await updateItems();
        setLoading(false);
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
