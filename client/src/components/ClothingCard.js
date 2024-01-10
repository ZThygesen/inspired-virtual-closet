import { useState } from 'react';
import { Tooltip } from '@mui/material';
import Modal from './Modal';
import Input from './Input';
import { ClothingCardContainer } from '../styles/Clothes';

export default function ClothingCard({ item, editable, sendToCanvas, swapCategory, editItem, deleteItem }) {
    const [editOpen, setEditOpen] = useState(false);
    const [newItemName, setNewItemName] = useState(item.fileName);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);

    function handleCloseImageModal() {
        setImageModalOpen(false);
    }

    function handleSubmitEdit(e) {
        e.preventDefault();
        setEditOpen(false);
        editItem(item, newItemName); 
    }

    function handleCloseEdit() {
        setEditOpen(false);
        setNewItemName(item.fileName);
    }

    function handleConfirmDeleteClose() {
        setConfirmDeleteOpen(false);
    }

    return (
        <>
            <ClothingCardContainer>
                <p className="file-name">{item.fileName}</p>
                <img
                    src={item.smallFileUrl}
                    alt={item.fileName}
                    onClick={() => setImageModalOpen(true)}
                />
                <div className="item-options">
                    <Tooltip title="Send to Canvas">
                        <button 
                            className='material-icons item-option important'
                            onClick={() => sendToCanvas(item)}
                        >
                            shortcut
                        </button>
                    </Tooltip>
                    {
                        editable &&
                        <>
                            <Tooltip title="Change Category">
                                <button
                                    className='material-icons item-option'
                                    onClick={() => swapCategory(item)}
                                >
                                    swap_vert
                                </button>
                            </Tooltip>
                            <Tooltip title="Edit">
                                <button
                                    className='material-icons item-option'
                                    onClick={() => setEditOpen(true)}
                                >
                                    edit
                                </button>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <button
                                    className='material-icons item-option'
                                    onClick={() => setConfirmDeleteOpen(true)}
                                >
                                    delete
                                </button>
                            </Tooltip>
                        </>
                    }
                </div>
            </ClothingCardContainer>
            <Modal
                open={imageModalOpen}
                closeFn={handleCloseImageModal}
                isImage={true}
            >
                <>  
                    <button className="material-icons close-modal" onClick={handleCloseImageModal}>close</button>
                    <img src={item.fullFileUrl} alt={item.fileName} className="image-modal" />
                </>
            </Modal>
            <Modal
                open={confirmDeleteOpen}
                closeFn={handleConfirmDeleteClose}
            >
                <>
                    <h2 className="modal-title">DELETE ITEM</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this item?</p>
                        <p className="large bold underline">{item.fileName}</p>
                        <img
                            src={item.smallFileUrl}
                            alt={item.fileName}
                            className="delete-img"
                        />
                    </div>
                    <div className="modal-options">
                        <button onClick={handleConfirmDeleteClose}>Cancel</button>
                        <button onClick={() => { handleConfirmDeleteClose(); deleteItem(item); }}>Delete</button>
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
                    <h2 className="modal-title">EDIT ITEM</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="item-name"
                            label="Item Name"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                        />
                        <img
                            src={item.smallFileUrl}
                            alt={item.fileName}
                            className="edit-img"
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
