import { useState } from 'react';
import axios from 'axios';
import ClothingCard from './ClothingCard';
import Loading from './Loading';
import { ClothesContainer } from '../styles/Clothes';

export default function Clothes({ display, category, updateItems, addCanvasItem }) {
    const [loading, setLoading] = useState(false);

    function sendToCanvas(item) {
        addCanvasItem(item, 'image');
    }

    function swapCategory(item) {
        alert(`Swap category: ${item.fileName}`);
    }
    
    async function editItem(item, newName) {
        setLoading(true);
        if (item.fileName === newName) {
            setLoading(false);
            return;
        }

        await axios.patch('/files', { categoryId: category._id, item: item, newName: newName })
            .catch(err => console.log(err));
        
        await updateItems();
        setLoading(false);
    }

    async function deleteItem(item) {
        setLoading(true);
        await axios.delete(`/files/${category._id}/${item.fileId}`)
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
                        category?.items?.map((item, index) => (
                            <ClothingCard
                                item={item}
                                editable={category._id !== -1}
                                sendToCanvas={sendToCanvas}
                                swapCategory={swapCategory}
                                editItem={editItem}
                                deleteItem={deleteItem}
                                key={index}
                            />
                        ))
                    }
                </div>
            </ClothesContainer>
            <Loading open={loading} />
        </>
        
    );
}
