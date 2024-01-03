import { useState } from 'react';
import { Tooltip } from '@mui/material';
import Modal from './Modal';
import Input from './Input';
import { OutfitCardContainer } from '../styles/Outfits';

export default function OutfitCard({ outfit, editOutfit, editOutfitName, deleteOutfit }) {
    const [editOpen, setEditOpen] = useState(false);
    const [newOutfitName, setNewOutfitName] = useState(outfit.outfitName);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);

    function handleCloseImageModal() {
        setImageModalOpen(false);
    }

    function handleSubmitEdit(e) {
        e.preventDefault();
        setEditOpen(false);
        editOutfitName(outfit, newOutfitName); 
    }

    function handleCloseEdit() {
        setEditOpen(false);
        setNewOutfitName(outfit.outfitName);
    }

    function handleConfirmDeleteClose() {
        setConfirmDeleteOpen(false);
    }

    async function handleDownloadOutfit() {
        const image = await fetch(outfit.outfitImage).then(res => res.blob());
        const imageURL = URL.createObjectURL(image);

        const link = document.createElement('a');
        link.href = imageURL;
        link.download = outfit.outfitName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <>
            <OutfitCardContainer>
                <p>{outfit.outfitName}</p>
                <img
                    src={outfit.outfitImage}
                    alt={outfit.outfitName}
                    onClick={() => setImageModalOpen(true)}
                />
                <div className="outfit-options">
                    <Tooltip title="Edit Outfit on Canvas">
                        <button 
                            className='material-icons outfit-option important'
                            onClick={() => editOutfit(outfit)}
                        >
                            shortcut
                        </button>
                    </Tooltip>
                    <Tooltip title="Edit Outfit Name">
                        <button
                            className='material-icons outfit-option'
                            onClick={() => setEditOpen(true)}
                        >
                            edit
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete Outfit">
                        <button
                            className='material-icons outfit-option'
                            onClick={() => setConfirmDeleteOpen(true)}
                        >
                            delete
                        </button>
                    </Tooltip>
                    <Tooltip title="Download Outfit">
                        <button
                            className='material-icons outfit-option important'
                            onClick={handleDownloadOutfit}
                        >
                            download
                        </button>
                    </Tooltip>
                </div>
            </OutfitCardContainer>
            <Modal
                open={imageModalOpen}
                onClose={handleCloseImageModal}
                isImage={true}
            >
                <>  
                    <button className="material-icons close-modal" onClick={handleCloseImageModal}>close</button>
                    <img src={outfit.outfitImage} alt={outfit.outfitName} className="image-modal" />
                </>
            </Modal>
            <Modal
                open={confirmDeleteOpen}
                onClose={handleConfirmDeleteClose}
            >
                <>
                    <h2 className="modal-title">DELETE OUTFIT</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this outfit?</p>
                        <p className="large bold underline">{outfit.outfitName}</p>
                        <img
                            src={outfit.outfitImage}
                            alt={outfit.outfitName}
                            className="delete-img"
                        />
                    </div>
                    <div className="modal-options">
                        <button onClick={handleConfirmDeleteClose}>Cancel</button>
                        <button onClick={() => { handleConfirmDeleteClose(); deleteOutfit(outfit); }}>Delete</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={editOpen}
                onClose={handleCloseEdit}
                isForm={true}
                submitFn={handleSubmitEdit}
            >
                <>
                    <h2 className="modal-title">EDIT OUTFIT NAME</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="outfit-name"
                            label="Outfit Name"
                            value={newOutfitName}
                            onChange={e => setNewOutfitName(e.target.value)}
                        />
                        <img
                            src={outfit.outfitImage}
                            alt={outfit.outfitName}
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