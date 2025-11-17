import { useEffect, useState } from 'react';
import { useError } from '../contexts/ErrorContext';
import { useClient } from '../contexts/ClientContext';
import { useData } from '../contexts/DataContext';
import api from '../api';
import OutfitCard from './OutfitCard';
import { OutfitsContainer } from '../styles/Outfits';
import Input from './Input';
import cuid from 'cuid'; 
import Modal from './Modal';
import { Tooltip } from '@mui/material';

export default function Outfits({ display, sendOutfitToCanvas, itemToSearch, clearItemToSearch }) {
    const { setError } = useError();
    const { client } = useClient();
    const { outfits, updateOutfits, setLoading } = useData();

    const [searchResults, setSearchResults] = useState(outfits || []);
    const [searchString, setSearchString] = useState('');

    useEffect(() => {
        const words = searchString.toLowerCase().split(/\s+/).filter(Boolean);
        let results = outfits.filter(outfit =>
            words.every(word => outfit?.outfitName?.toLowerCase()?.includes(word))
        );
        if (itemToSearch) {
            results = results.filter(outfit => 
                outfit?.itemsUsed?.includes(itemToSearch?._id)
            );
        }
        setSearchResults(results);
    }, [searchString, itemToSearch, outfits]);

    // modal controls
    const [imageModalOpen, setImageModalOpen] = useState(false);
    function closeImageModal() {
        setImageModalOpen(false);
        setModalOutfit({});
    }
    
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [canvasEditModalOpen, setCanvasEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [modalOutfit, setModalOutfit] = useState({});
    const [newOutfitName, setNewOutfitName] = useState('');

    function closeEditModal() {
        setEditModalOpen(false);
        setModalOutfit({});
        setNewOutfitName('');
    }

    function closeCanvasEditModal() {
        setCanvasEditModalOpen(false);
        setModalOutfit({});
    }

    function closeDeleteModal() {
        setDeleteModalOpen(false);
        setModalOutfit({});
    }

    useEffect(() => {
        if (editModalOpen) {
            setNewOutfitName(modalOutfit.outfitName);
        }
    }, [editModalOpen, modalOutfit]);

    async function editOutfit(e) {
        e.preventDefault();
        if (newOutfitName === modalOutfit.outfitName) {
            closeEditModal();
            return;
        }

        try {
            setLoading(true);
            await api.patch(`/outfits/name/${client._id}/${modalOutfit._id}`, { outfitName: newOutfitName });
            await updateOutfits();
        } 
        catch (err) {
            setError({
                message: 'There was an error editing the outfit\'s name.',
                status: err?.response?.status,
            });
        } 
        finally {
            setLoading(false);
            closeEditModal();
        }        
    }

    function canvasEditOutfit() {
        sendOutfitToCanvas(modalOutfit);
        closeCanvasEditModal();
    }

    async function deleteOutfit() {
        try {
            setLoading(true);
            await api.delete(`/outfits/${client._id}/${modalOutfit._id}`);
            await updateOutfits();
        } 
        catch (err) {
            setError({
                message: 'There was an error deleting the outfit.',
                status: err?.response?.status,
            });
        } 
        finally {
            setLoading(false);
            closeDeleteModal();
        }
    }

    return (
        <>
            <OutfitsContainer style={{ display: display ? 'flex' : 'none' }}>
                <div className="title-search">
                    <h2 className="outfits-title">Outfits ({searchResults.length})</h2>
                    <div className="search-container">
                        <div className="search-box">
                            <Input
                                type="text"
                                id="fuzzy-search"
                                label="Search"
                                value={searchString}
                                size="small"
                                onChange={e => setSearchString(e.target.value)}
                            />
                            <button className='material-icons clear-search-button' onClick={() => setSearchString('')}>
                                clear
                            </button>
                        </div>
                        { itemToSearch &&
                            <div className="item-search-container">
                                <div className='item-to-search-text'>
                                    <p>
                                        Showing all outfits using item:<br />
                                        <span>{itemToSearch.tagNamesPrefix !== '' ? `${itemToSearch.tagNamesPrefix} | ` : ''}{itemToSearch.fileName}</span>
                                    </p>
                                    <Tooltip title="Stop Searching By Item">
                                        <button
                                            className='material-icons clear-search-by-item'
                                            onClick={clearItemToSearch}
                                        >
                                            close
                                        </button>
                                    </Tooltip>
                                </div>
                                <div className="item-to-search">
                                    <img
                                        src={itemToSearch.smallFileUrl}
                                        alt={itemToSearch.fileName}
                                    />
                                </div>
                            </div>
                        }
                    </div>
                </div>

                {/* { itemToSearch &&
                    <div className='item-search-container'>
                        <div>Showing outfits using item:</div>
                        <div>
                            <Tooltip title="Stop Searching By Item">
                                <button
                                    className='material-icons clear-search-by-item'
                                    onClick={clearItemToSearch}
                                >
                                    close
                                </button>
                            </Tooltip>
                            <img
                                src={itemToSearch.smallFileUrl}
                                alt={itemToSearch.fileName}
                            />
                        </div>
                    </div>
                } */}
                    
                <div className='outfits'>
                    {
                        searchResults?.map(outfit => (
                            <OutfitCard
                                outfit={outfit}
                                setImageModalOpen={setImageModalOpen}
                                setEditModalOpen={setEditModalOpen}
                                setCanvasEditModalOpen={setCanvasEditModalOpen}
                                setDeleteModalOpen={setDeleteModalOpen}
                                setModalOutfit={setModalOutfit}
                                key={cuid()}
                            />
                        ))
                    }
                </div>
            </OutfitsContainer>
            <Modal
                open={imageModalOpen}
                closeFn={closeImageModal}
                isImage={true}
            >
                <>  
                    <button className="material-icons close-modal" onClick={closeImageModal}>close</button>
                    <img
                        src={modalOutfit.outfitUrl}
                        alt={modalOutfit.outfitName}
                    />
                </>
            </Modal>
            <Modal
                open={editModalOpen}
                closeFn={closeEditModal}
                isForm={true}
                submitFn={editOutfit}
            >
                <>
                    <h2 className="modal-title">Edit Outfit Name</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="outfit-name"
                            label="Outfit Name"
                            value={newOutfitName}
                            onChange={e => setNewOutfitName(e.target.value)}
                        />
                        <img
                            src={modalOutfit.outfitUrl}
                            alt={modalOutfit.outfitName}
                            className="edit-img"
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={closeEditModal}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={canvasEditModalOpen}
                closeFn={closeCanvasEditModal}
            >
                <>
                    <h2 className="modal-title">Edit Outfit On Canvas</h2>
                    <div className="modal-content">
                    <p className="medium">Are you sure you want to edit this outfit?</p>
                        <p className="small bold warning">Continuing will wipe out ALL items currently on the canvas!</p>
                    </div>
                    <div className="modal-options">
                        <button onClick={closeCanvasEditModal}>Cancel</button>
                        <button onClick={canvasEditOutfit}>Continue</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={deleteModalOpen}
                closeFn={closeDeleteModal}
            >
                <>
                    <h2 className="modal-title">Delete Outfit</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this outfit?</p>
                        <p className="large bold underline">{modalOutfit.outfitName}</p>
                        <img
                            src={modalOutfit.outfitUrl}
                            alt={modalOutfit.outfitName}
                            className="delete-img"
                        />
                    </div>
                    <div className="modal-options">
                        <button onClick={closeDeleteModal}>Cancel</button>
                        <button onClick={deleteOutfit}>Delete</button>
                    </div>
                </>
            </Modal>
        </>
    );
}
