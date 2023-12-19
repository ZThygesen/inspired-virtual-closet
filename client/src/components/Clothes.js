import { useState } from 'react';
import axios from 'axios';
import cuid from 'cuid';
import ClothingCard from './ClothingCard';
import Loading from './Loading';
import { ClothesContainer } from '../styles/Clothes';

export default function Clothes({ display, category, clothes, updateItems }) {
    const [loading, setLoading] = useState(false);

    function sendToCanvas(item) {
        alert(`Send to canvas: ${item.fileName}`);
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
                {
                    /* category.name === undefined ? <NoCategories fontSize={28} /> : */
                        <>
                            <h2 className="category-title">{category.name}</h2>
                            <div className="items">
                                {
                                    clothes.map(item => (
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
                        </>
                }
            </ClothesContainer>
            <Loading open={loading} />
        </>
        
    );
}
