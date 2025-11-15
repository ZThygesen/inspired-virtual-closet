import { useEffect, useState } from 'react';
import { useError } from '../contexts/ErrorContext';
import { useUser } from '../contexts/UserContext';
import { useClient } from '../contexts/ClientContext';
import { useData } from '../contexts/DataContext';
import api from '../api';
import { Tooltip } from '@mui/material';
import ShoppingCard from './ShoppingCard';
import { ShoppingContainer } from '../styles/Shopping';
import cuid from 'cuid';
import Input from './Input';
import Modal from './Modal';

export default function Shopping({ display }) {
    const { setError } = useError();
    const { user } = useUser();
    const { client } = useClient();
    const { shopping, updateShopping, setLoading } = useData();

    const [notPurchased, setNotPurchased] = useState([]);
    const [purchased, setPurchased] = useState([]);

    useEffect(() => {
        const notPurchased = shopping.filter(item => item.purchased === false).reverse();
        const purchased = shopping.filter(item => item.purchased === true).reverse();

        setNotPurchased(notPurchased);
        setPurchased(purchased);
    }, [shopping]);

    // modal controls
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [modalShoppingItem, setModalShoppingItem] = useState({});
    const [newItemName, setNewItemName] = useState('');
    const [newItemLink, setNewItemLink] = useState('');
    const [newImageLink, setNewImageLink] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [newPurchased, setNewPurchased] = useState(false);

    function closeAddModal() {
        setAddModalOpen(false);
        setNewItemName('');
        setNewItemLink('');
        setNewImageLink('');
        setNewNotes('');
    }

    function closeEditModal() {
        setEditModalOpen(false);
        setModalShoppingItem({});
        setNewItemName('');
        setNewItemLink('');
        setNewImageLink('');
        setNewNotes('');
        setNewPurchased(false);
    }

    function closeDeleteModal() {
        setDeleteModalOpen(false);
        setModalShoppingItem({});
    }

    async function addShoppingItem(e) {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post(`/shopping/${client._id}`, {
                itemName: newItemName,
                itemLink: newItemLink,
                imageLink: newImageLink,
                notes: newNotes
            });
            await updateShopping();
        } 
        catch(err) {
            setError({
                message: 'There was an error adding the shopping item.',
                status: err?.response?.status,
            });
        } 
        finally {
            setLoading(false);
            closeAddModal();
        }
    }

    useEffect(() => {
        if (editModalOpen) {
            setNewItemName(modalShoppingItem.itemName);
            setNewItemLink(modalShoppingItem.itemLink);
            setNewImageLink(modalShoppingItem.imageLink);
            setNewNotes(modalShoppingItem.notes);
            setNewPurchased(modalShoppingItem.purchased);
        }
    }, [editModalOpen, modalShoppingItem]);

    async function editShoppingItem(e) {
        e.preventDefault();
        if (modalShoppingItem.itemName === newItemName &&
            modalShoppingItem.itemLink === newItemLink &&
            modalShoppingItem.imageLink === newImageLink &&
            modalShoppingItem.notes === newNotes &&
            modalShoppingItem.purchased === newPurchased
        ) {
            return;
        }

        try {
            setLoading(true);
            await api.patch(`/shopping/${client._id}/${modalShoppingItem._id}`, {
                newItemName: newItemName,
                newItemLink: newItemLink,
                newImageLink: newImageLink,
                newNotes: newNotes,
                newPurchased: newPurchased
            });
            await updateShopping();
        } 
        catch(err) {
            setError({
                message: 'There was an error editing the shopping item.',
                status: err?.response?.status,
            });
        } 
        finally {
            setLoading(false);
            closeEditModal();
        }
    }

    async function togglePurchased(shoppingItem) {
        try {
            setLoading(true);
            await api.patch(`/shopping/purchased/${client._id}/${shoppingItem._id}`, {
                newPurchased: !shoppingItem.purchased
            });
            await updateShopping();
        } 
        catch(err) {
            setError({
                message: 'There was an error editing the shopping item.',
                status: err?.response?.status,
            });
        } 
        finally {
            setLoading(false);
        }
    }

    async function deleteShoppingItem() {
        try {
            setLoading(true);
            await api.delete(`/shopping/${client._id}/${modalShoppingItem._id}`);
            await updateShopping();
        } 
        catch(err) {
            setError({
                message: 'There was an error deleting the shopping item.',
                status: err.response.status
            });
        } 
        finally {
            setLoading(false);
            closeDeleteModal();
        }
    }

    return (
        <>
            <ShoppingContainer style={{ display: display ? 'flex' : 'none' }}>
                <h2 className="shopping-title">Shopping</h2>
                <div className="shopping-info">
                    <p className="shopping-guide">
                        Be sure to look at the&nbsp;
                        <a href="https://drive.google.com/file/d/1vjY20JfvfqLXqWkTbBorg3F0IvPnNdgw/view?usp=sharing" target="_blank" rel="noreferrer" className="shop-guide-emphasis">
                            ONLINE SHOPPING GUIDE
                        </a>
                        &nbsp;and&nbsp;
                        <span className="review-emphasis">
                            REVIEW NOTES
                        </span>
                        &nbsp;prior to purchasing anything online!
                    </p>
                    <p className="scam-detector">
                        Check product websites using this&nbsp;
                        <a href="https://www.scam-detector.com/" target="_blank" rel="noreferrer" className="scam-emphasis">
                            SCAM DETECTOR
                        </a>
                        &nbsp;to ensure a safe purchase!
                    </p>
                </div>
                <div className="shopping-items-container">
                    { notPurchased.length > 0 &&
                        <>
                        <h3 className="shopping-subtitle not-purchased">TODO: Purchase Items</h3>
                        <div className="shopping-items">
                            {
                                notPurchased?.map(shoppingItem => (
                                    <ShoppingCard
                                        className="shopping-card"
                                        shoppingItem={shoppingItem}
                                        togglePurchased={togglePurchased}
                                        setEditModalOpen={setEditModalOpen}
                                        setDeleteModalOpen={setDeleteModalOpen}
                                        setModalShoppingItem={setModalShoppingItem}
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
                        <h3 className="shopping-subtitle purchased">Purchased <span className="material-icons purchased-icon">check</span></h3>
                        <div className="shopping-items">
                            {
                                purchased?.map(shoppingItem => (
                                    <ShoppingCard
                                        className="shopping-card"
                                        shoppingItem={shoppingItem}
                                        togglePurchased={togglePurchased}
                                        setEditModalOpen={setEditModalOpen}
                                        setDeleteModalOpen={setDeleteModalOpen}
                                        setModalShoppingItem={setModalShoppingItem}
                                        key={cuid()}
                                    />
                                ))
                            }
                        </div>
                        </>   
                    }
                </div>
                { user?.isAdmin &&
                    <Tooltip title="Add Shopping Item">
                        <button className="material-icons add-shopping-item" onClick={() => setAddModalOpen(true)}>add</button>
                    </Tooltip>
                }
                
            </ShoppingContainer>
            <Modal 
                open={addModalOpen}
                closeFn={closeAddModal}
                isForm={true}
                submitFn={addShoppingItem}
            >
                <>
                    <h2 className="modal-title">Add Shopping Item</h2>
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
                            type="textarea"
                            id="notes"
                            label="Notes &nbsp;"
                            value={newNotes}
                            onChange={e => setNewNotes(e.target.value)}
                            required={false}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={closeAddModal}>Cancel</button>
                        <button type="submit">Submit</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={editModalOpen}
                closeFn={closeEditModal}
                isForm={true}
                submitFn={editShoppingItem}
            >
                <>
                    <h2 className="modal-title">Edit Shopping Item</h2>
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
                            type="textarea"
                            id="notes"
                            label="Notes &nbsp;"
                            value={newNotes}
                            onChange={e => setNewNotes(e.target.value)}
                            required={false}
                        />
                        <Input 
                            type="checkbox"
                            id="purchased"
                            label="Purchased"
                            value={newPurchased}
                            onChange={e => setNewPurchased(e.target.checked)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={closeEditModal}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={deleteModalOpen}
                closeFn={closeDeleteModal}
            >
                <>
                    <h2 className="modal-title">Delete Shopping Item</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this shopping item?</p>
                        <p className="large bold underline">{modalShoppingItem.itemName}</p>
                        <img
                            src={modalShoppingItem.imageLink}
                            alt={modalShoppingItem.itemName}
                            className="delete-img"
                        />
                    </div>
                    <div className="modal-options">
                        <button onClick={closeDeleteModal}>Cancel</button>
                        <button onClick={deleteShoppingItem}>Delete</button>
                    </div>
                </>
            </Modal>
        </>
        
    );
}
