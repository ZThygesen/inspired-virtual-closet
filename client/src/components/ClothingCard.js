import { useEffect, useState } from 'react';
import { Tooltip } from '@mui/material';
import Modal from './Modal';
import Input from './Input';
import { ClothingCardContainer } from '../styles/Clothes';
import { useUser } from './UserContext';
import { useData } from './DataContext';

export default function ClothingCard({ item, editable, onCanvas, sendToCanvas, swapCategory, editItem, deleteItem, prevClothingModal, nextClothingModal, openClothingModal, closeClothingModal, isOpen, fromSidebar }) {
    const [editOpen, setEditOpen] = useState(false);
    const [tagModalOpen, setTagModalOpen] = useState(false);
    const [itemTags, setItemTags] = useState([]);
    const [itemTagObjects, setItemTagObjects] = useState([]);

    const [newItemName, setNewItemName] = useState(item.fileName);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(isOpen);
    const [resolvedTags, setResolvedTags] = useState('');
    const { user } = useUser();

    const { tags, resolveTagIds } = useData();

    useEffect(() => {
        setItemTags(item.tags || []);
    }, [item])

    useEffect(() => {
        const itemTagsResolved = resolveTagIds(itemTags) || [];
        setResolvedTags(itemTagsResolved?.map(tag => tag.tagName)?.join(' | ') || '');
    }, [itemTags, item, resolveTagIds]);

    useEffect(() => {
        const itemTagObjects = [];
        tags.forEach(tagGroup => {
            const activeTags = tagGroup.tags.filter(tag => itemTags?.includes(tag.tagId));
            if (activeTags.length > 0) {
                itemTagObjects.push(...activeTags);
            }
        });
        setItemTagObjects(itemTagObjects);
    }, [tags, itemTags]);

    useEffect(() => {
        setImageModalOpen(isOpen);
    }, [isOpen])

    function handleCloseImageModal() {
        setImageModalOpen(false);
        closeClothingModal();
    }

    function handleSubmitEdit(e) {
        e.preventDefault();
        setEditOpen(false);
        editItem(item, newItemName, itemTags); 
    }

    function handleCloseEdit() {
        setEditOpen(false);
        setNewItemName(item.fileName);
        setItemTags(item.tags);
    }

    function handleConfirmDeleteClose() {
        setConfirmDeleteOpen(false);
    }

    function openTagModal() {
        setTagModalOpen(true);
    }

    function closeTagModal() {
        setTagModalOpen(false);
    }

    function changeItemTags(checkbox) {
        let updatedTags = [];
        const tagId = checkbox.id;
        if (itemTags.includes(tagId)) {
            updatedTags = itemTags.filter(tag => tag !== tagId);
        }
        else {
            updatedTags = [...itemTags, tagId];
        }
        setItemTags(updatedTags);
    }
    console.log(item)
    return (
        <>
            <ClothingCardContainer className={`${onCanvas ? 'on-canvas' : ''} ${fromSidebar ? 'from-sidebar' : ''}`}>
                { onCanvas &&
                    <Tooltip title="On Canvas">
                        <span className="material-icons on-canvas-icon">swipe</span>
                    </Tooltip>
                }
                <p className="file-name">{resolvedTags !== '' ? `${resolvedTags} | ` : ''}{item.fileName}</p>
                <div className="clothing-card-img">
                    <img
                        src={item.smallFileUrl}
                        alt={item.fileName}
                        onClick={() => { openClothingModal(); setImageModalOpen(true); }}
                    />
                </div>
                <div className="item-options">
                    { user?.isAdmin &&
                        <Tooltip title="Send to Canvas">
                            <button 
                                className="material-icons item-option important"
                                onClick={() => sendToCanvas(item, "image")}
                            >
                                shortcut
                            </button>
                        </Tooltip>
                    }
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
                    <ClothingCardContainer className={`${onCanvas ? 'on-canvas on-modal' : 'on-modal'}`}>
                        { onCanvas &&
                            <Tooltip title="On Canvas">
                                <span className="material-icons on-canvas-icon">swipe</span>
                            </Tooltip>
                        }
                        <p className="file-name">{resolvedTags !== '' ? `${resolvedTags} | ` : ''}{item.fileName}</p>
                        <div className="clothing-card-img">
                            <img
                                src={item.fullFileUrl}
                                alt={item.fileName}
                            />
                        </div>
                        <div className="item-options">
                            <Tooltip title="Previous Item">
                                <button
                                    className='material-icons item-option prev-card'
                                    onClick={prevClothingModal}
                                >
                                    chevron_left
                                </button>
                            </Tooltip>
                            { user?.isAdmin &&
                                <Tooltip title="Send to Canvas">
                                    <button 
                                        className="material-icons item-option important send-to-canvas"
                                        onClick={() => sendToCanvas(item, "image")}
                                    >
                                        shortcut
                                    </button>
                                </Tooltip>
                            }
                            <Tooltip title="Next Item">
                                <button
                                    className='material-icons item-option next-card'
                                    onClick={nextClothingModal}
                                >
                                    chevron_right
                                </button>
                            </Tooltip>
                        </div>
                    </ClothingCardContainer>
                </>
            </Modal>
            <Modal
                open={confirmDeleteOpen}
                closeFn={handleConfirmDeleteClose}
            >
                <>
                    <h2 className="modal-title">Delete Item</h2>
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
                    <h2 className="modal-title">Edit Item</h2>
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
                        <div className="tags-container">
                            <p className="tags-prompt">Tags</p>
                            <div className="tags">
                                {
                                    itemTagObjects.map(tag => (
                                        <div className="tag" key={tag.tagId}>
                                            <p className="tag-name">{tag.tagName}</p>
                                            <div className="tag-color" style={{ backgroundColor: tag.tagColor }}></div>
                                        </div>
                                    ))
                                }
                            </div>
                            <button className="add-tags-button" type="button" onClick={openTagModal}>Edit Tags</button>
                        </div>
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseEdit}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={tagModalOpen}
                closeFn={closeTagModal}
            >
                <>
                    <h2 className="modal-title">Add Tags</h2>
                    <div className="modal-content">
                        <div className="file-card-img">
                            <img
                                src={item.smallFileUrl}
                                alt={item.fileName}
                                className="file-img"
                            />
                        </div>
                        <div className="tag-checkboxes">
                            <div className="tag-groups">
                                {
                                    tags.map(group => (
                                        (
                                            group.tags.length > 0 && 
                                            <div className="tag-group" key={group._id}>
                                                <p className="tag-group-name">{group.tagGroupName}</p>
                                                <div className="tags">
                                                    {
                                                        group.tags.map(tag => (
                                                            <div className={`tag ${tags.includes(String(tag.tagId)) ? 'checked' : ''}`} key={tag.tagId}>
                                                                <Input
                                                                    type="checkbox"
                                                                    id={`${tag.tagId}`}
                                                                    label={tag.tagName}
                                                                    value={itemTags?.includes(String(tag.tagId))}
                                                                    onChange={e => changeItemTags(e.target)}
                                                                />
                                                                <div className="tag-color" style={{ backgroundColor: tag.tagColor }}></div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <div className="modal-options">
                        <button onClick={closeTagModal}>Done</button>
                    </div>
                </>
            </Modal>
        </>
    );
}
