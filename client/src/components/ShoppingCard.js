import { useState } from 'react';
import { Tooltip } from '@mui/material';
import Modal from './Modal';
import Input from './Input';
import { ShoppingCardContainer } from '../styles/Shopping';
import { useUser } from './UserContext';

export default function ShoppingCard({ shoppingItem, editShoppingItem, togglePurchasedStatus, deleteShoppingItem }) {
    const [editOpen, setEditOpen] = useState(false);
    const [newItemName, setNewItemName] = useState(shoppingItem.itemName);
    const [newItemLink, setNewItemLink] = useState(shoppingItem.itemLink);
    const [newImageLink, setNewImageLink] = useState(shoppingItem.imageLink);
    const [newNotes, setNewNotes] = useState(shoppingItem.notes);
    const [newPurchased, setNewPurchased] = useState(shoppingItem.purchased);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const { user } = useUser();

    function handleSubmitEdit(e) {
        e.preventDefault();
        setEditOpen(false);
        editShoppingItem(shoppingItem, newItemName, newItemLink, newImageLink, newNotes, newPurchased); 
    }

    function handleCloseEdit() {
        setEditOpen(false);
        setNewItemName(shoppingItem.itemName);
        setNewItemLink(shoppingItem.itemLink);
        setNewImageLink(shoppingItem.imageLink);
        setNewNotes(shoppingItem.notes);
        setNewPurchased(shoppingItem.purchased);
    }

    function handleSubmitDelete() {
        setConfirmDeleteOpen(false);
        deleteShoppingItem(shoppingItem);
    }

    return (
        <>
            <ShoppingCardContainer>
                <p className="shopping-item-name">{shoppingItem.itemName}</p>
                <a href={shoppingItem.itemLink} target="_blank" rel="noreferrer">
                    <img
                        src={shoppingItem.imageLink}
                        alt={shoppingItem.itemName}
                    />
                </a>
                <p className="shopping-item-notes">Notes: {shoppingItem.notes}</p>
                <div className="shopping-item-options">
                    { shoppingItem.purchased ?
                        <Tooltip title="Not Purchased?">
                            <button
                                className='material-icons shopping-item-option important'
                                onClick={() => togglePurchasedStatus(shoppingItem)}
                            >
                                close
                            </button>
                        </Tooltip>
                        :
                        <Tooltip title="Purchased?">
                            <button
                                className='material-icons shopping-item-option important'
                                onClick={() => togglePurchasedStatus(shoppingItem)}
                            >
                                check
                            </button>
                        </Tooltip>
                    }
                    <Tooltip title="View Item">
                        <a
                            className='material-icons shopping-item-option important'
                            href={shoppingItem.itemLink}
                            target="_blank"
                            rel="noreferrer"
                        >
                            shortcut
                        </a>
                    </Tooltip>
                    { user?.isAdmin &&
                        <>
                        <Tooltip title="Edit">
                            <button 
                                className='material-icons shopping-item-option'
                                onClick={() => setEditOpen(true)}
                            >
                                edit
                            </button>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <button
                                className='material-icons shopping-item-option'
                                onClick={() => setConfirmDeleteOpen(true)}
                            >
                                delete
                            </button>
                        </Tooltip>
                        </>
                    }
                </div>
            </ShoppingCardContainer>
            <Modal
                open={confirmDeleteOpen}
                closeFn={() => setConfirmDeleteOpen(false)}
            >
                <>
                    <h2 className="modal-title">DELETE SHOPPING ITEM</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this shopping item?</p>
                        <p className="large bold underline">{shoppingItem.itemName}</p>
                        <img
                            src={shoppingItem.imageLink}
                            alt={shoppingItem.itemName}
                            className="delete-img"
                        />
                    </div>
                    <div className="modal-options">
                        <button onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
                        <button onClick={handleSubmitDelete}>Delete</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={editOpen}
                closeFn={handleCloseEdit}
                isForm={true}
                submitFn={handleSubmitEdit}
            >
                <>
                    <h2 className="modal-title">EDIT SHOPPING ITEM</h2>
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
                        <button type="button" onClick={handleCloseEdit}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
        </>
    );
}
