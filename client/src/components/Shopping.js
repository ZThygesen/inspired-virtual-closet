import { useEffect, useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import { Tooltip } from '@mui/material';
import ShoppingCard from './ShoppingCard';
import Loading from './Loading';
import { ShoppingContainer } from '../styles/Shopping';
import cuid from 'cuid';
import Input from './Input';
import Modal from './Modal';
import { useClient } from './ClientContext';

export default function Shopping({ display, shoppingItems, updateShoppingItems }) {
    const { setError } = useError();

    const [notPurchased, setNotPurchased] = useState([]);
    const [purchased, setPurchased] = useState([]);

    const [addShoppingOpen, setAddShoppingOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemLink, setNewItemLink] = useState('');
    const [newImageLink, setNewImageLink] = useState('');
    const [newNotes, setNewNotes] = useState('');

    const [loading, setLoading] = useState(false);

    const { client } = useClient();

    useEffect(() => {
        const notPurchased = shoppingItems.filter(item => item.purchased === false);
        const purchased = shoppingItems.filter(item => item.purchased === true);

        setNotPurchased(notPurchased);
        setPurchased(purchased);
    }, [shoppingItems]);

    function handleAddShoppingClose() {
        setAddShoppingOpen(false);
        setNewItemName('');
        setNewItemLink('');
        setNewImageLink('');
        setNewNotes('');
    }

    async function addShoppingItem(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post(`/shopping/${client._id}`, {
                itemName: newItemName,
                itemLink: newItemLink,
                imageLink: newImageLink,
                notes: newNotes
            });
            handleAddShoppingClose();
            await updateShoppingItems();
        } catch(err) {
            setError({
                message: 'There was an error adding the shopping item.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

    async function editShoppingItem(shoppingItem, newItemName, newItemLink, newImageLink, newNotes, newPurchased) {
        setLoading(true);
        if (shoppingItem.itemName === newItemName &&
            shoppingItem.itemLink === newItemLink &&
            shoppingItem.imageLink === newImageLink &&
            shoppingItem.notes === newNotes &&
            shoppingItem.newPurchased === newPurchased
        ) {
            setLoading(false);
            return;
        }

        try {
            await api.patch(`/shopping/${client._id}/${shoppingItem._id}`, {
                newItemName: newItemName,
                newItemLink: newItemLink,
                newImageLink: newImageLink,
                newNotes: newNotes,
                newPurchased: newPurchased
            });
            await updateShoppingItems();
        } catch(err) {
            setError({
                message: 'There was an error editing the shopping item.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

    async function togglePurchasedStatus(shoppingItem) {
        setLoading(true);
        try {
            await api.patch(`/shopping/purchased/${client._id}/${shoppingItem._id}`, {
                newPurchased: !shoppingItem.purchased
            });
            await updateShoppingItems();
        } catch(err) {
            setError({
                message: 'There was an error editing the shopping item.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

    async function deleteShoppingItem(shoppingItem) {
        setLoading(true);
        try {
            await api.delete(`/shopping/${client._id}/${shoppingItem._id}`);
            await updateShoppingItems();
        } catch(err) {
            setError({
                message: 'There was an error deleting the shopping item.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <ShoppingContainer style={{ display: display ? 'flex' : 'none' }}>
                <h2 className="shopping-title">Shopping</h2>
                <div className="shopping-items-container">
                    { notPurchased.length > 0 &&
                        <>
                        <h3 className="shopping-subtitle">Not Purchased</h3>
                        <div className="shopping-items">
                            {
                                notPurchased?.map(shoppingItem => (
                                    <ShoppingCard
                                        shoppingItem={shoppingItem}
                                        editShoppingItem={editShoppingItem}
                                        togglePurchasedStatus={togglePurchasedStatus}
                                        deleteShoppingItem={deleteShoppingItem}
                                        key={cuid()}
                                    />
                                ))
                            }
                        </div>
                        </>
                    }

                    { (notPurchased.length > 0 && purchased.length > 0) &&
                        <div className="shopping-divider"></div>
                    }

                    { purchased.length > 0 &&
                        <>
                        <h3 className="shopping-subtitle">Purchased</h3>
                        <div className="shopping-items">
                            {
                                purchased?.map(shoppingItem => (
                                    <ShoppingCard
                                        shoppingItem={shoppingItem}
                                        editShoppingItem={editShoppingItem}
                                        togglePurchasedStatus={togglePurchasedStatus}
                                        deleteShoppingItem={deleteShoppingItem}
                                        key={cuid()}
                                    />
                                ))
                            }
                        </div>
                        </>   
                    }
                </div>
                <Tooltip title="Add Shopping Item">
                    <button className="material-icons add-shopping-item" onClick={() => setAddShoppingOpen(true)}>add</button>
                </Tooltip>
            </ShoppingContainer>
            <Loading open={loading} />
            <Modal 
                open={addShoppingOpen}
                closeFn={handleAddShoppingClose}
                isForm={true}
                submitFn={addShoppingItem}
            >
                <>
                    <h2 className="modal-title">ADD SHOPPING ITEM</h2>
                    <div className="modal-content">
                        <Input 
                            type="text"
                            id="item-name"
                            label="Item Name"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                        />
                        <Input 
                            type="text"
                            id="item-link"
                            label="Item Link"
                            value={newItemLink}
                            onChange={e => setNewItemLink(e.target.value)}
                        />
                        <Input 
                            type="text"
                            id="image-link"
                            label="Image Link"
                            value={newImageLink}
                            onChange={e => setNewImageLink(e.target.value)}
                        />
                        <Input 
                            type="text"
                            id="notes"
                            label="Notes"
                            value={newNotes}
                            onChange={e => setNewNotes(e.target.value)}
                            required={false}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleAddShoppingClose}>Cancel</button>
                        <button type="submit">Submit</button>
                    </div>
                </>
            </Modal>
        </>
        
    );
}
