import { useState } from 'react';
import { useError } from './ErrorContext';
import { Tooltip } from '@mui/material';
import Modal from './Modal';
import Input from './Input';
import { OutfitCardContainer } from '../styles/Outfits';

export default function OutfitCard({ outfit, editOutfit, editOutfitName, deleteOutfit }) {
    const { setError } = useError();

    const [editOpen, setEditOpen] = useState(false);
    const [editNameOpen, setEditNameOpen] = useState(false);
    const [newOutfitName, setNewOutfitName] = useState(outfit.outfitName);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);

    function handleCloseImageModal() {
        setImageModalOpen(false);
    }

    function handleConfirmEdit() {
        setEditOpen(false);
        editOutfit(outfit);
    }

    function handleSubmitEditName(e) {
        e.preventDefault();
        setEditNameOpen(false);
        editOutfitName(outfit, newOutfitName); 
    }

    function handleCloseEditName() {
        setEditNameOpen(false);
        setNewOutfitName(outfit.outfitName);
    }

    function handleConfirmDeleteClose() {
        setConfirmDeleteOpen(false);
    }

    async function handleDownloadOutfit() {
        try {
            const image = await fetch(outfit.outfitUrl).then(res => res.blob());
            const imageURL = URL.createObjectURL(image);
            const link = document.createElement('a');
            link.href = imageURL;
            link.download = outfit.outfitName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setError({
                message: 'There was an error downloading the outfit.',
                status: err.response.status
            });
        } 
    }

    return (
        <>
            <OutfitCardContainer>
                <p className="outfit-name">{outfit.outfitName}</p>
                <img
                    src={outfit.outfitUrl}
                    alt={outfit.outfitName}
                    onClick={() => setImageModalOpen(true)}
                />
                <div className="outfit-options">
                    <Tooltip title="Edit Outfit on Canvas">
                        <button 
                            className='material-icons outfit-option important'
                            onClick={() => setEditOpen(true)}
                        >
                            shortcut
                        </button>
                    </Tooltip>
                    <Tooltip title="Edit Outfit Name">
                        <button
                            className='material-icons outfit-option'
                            onClick={() => setEditNameOpen(true)}
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
                closeFn={handleCloseImageModal}
                isImage={true}
            >
                <>  
                    <button className="material-icons close-modal" onClick={handleCloseImageModal}>close</button>
                    <img src={outfit.outfitUrl} alt={outfit.outfitName} className="image-modal" />
                </>
            </Modal>
            <Modal
                open={confirmDeleteOpen}
                closeFn={handleConfirmDeleteClose}
            >
                <>
                    <h2 className="modal-title">DELETE OUTFIT</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this outfit?</p>
                        <p className="large bold underline">{outfit.outfitName}</p>
                        <img
                            src={outfit.outfitUrl}
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
                open={editNameOpen}
                closeFn={handleCloseEditName}
                isForm={true}
                submitFn={handleSubmitEditName}
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
                            src={outfit.outfitUrl}
                            alt={outfit.outfitName}
                            className="edit-img"
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseEditName}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={editOpen}
                closeFn={() => setEditOpen(false)}
            >
                <>
                    <h2 className="modal-title">EDIT OUTFIT ON CANVAS</h2>
                    <div className="modal-content">
                    <p className="medium">Are you sure you want to edit this outfit?</p>
                        {/* <p className="large bold underline">{categoryToDelete.name}</p> */}
                        <p className="small bold warning">Continuing will wipe out ALL items currently on the canvas!</p>
                    </div>
                    <div className="modal-options">
                        <button onClick={() => setEditOpen(false)}>Cancel</button>
                        <button onClick={handleConfirmEdit}>Continue</button>
                    </div>
                </>
            </Modal>
        </>
    );
}