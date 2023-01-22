import { useState } from 'react';
import axios from 'axios';
import cuid from 'cuid';
import styled from 'styled-components';
import ClothingCard from './ClothingCard';
import NoCategories from './NoCategories';
import Loading from './Loading';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;

    .category-title {
        font-size: 50px;
        margin-bottom: 10px;
    }

    .items {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 30px;
    }
`;

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
            <Container style={{ display: display ? 'flex' : 'none' }}>
                {
                    category.name === undefined ? <NoCategories fontSize={28} /> :
                        <>
                            <p className="category-title">{category.name}</p>
                            <div className="items">
                                {
                                    clothes.map(item => (
                                        <ClothingCard
                                            item={item}
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
            </Container>
            <Loading open={loading} />
        </>
        
    );
}
