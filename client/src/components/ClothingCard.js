import { useState } from 'react';
import styled from 'styled-components';
import { Modal, TextField, Tooltip } from '@mui/material';
import { Delete, Edit, Shortcut, SwapVert } from '@mui/icons-material';
import ImageModal from './ImageModal';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: var(--box-shadow);
    padding: 20px;
    border-radius: 25px;
    max-width: 250px;
    word-wrap: break-word;

    p {
        font-size: 32px;
        color: var(--black);

    }

    img {
        width: 250px;
        height: auto;
        cursor: pointer;
    }

    .item-options {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 5px 0 15px 0;
    }

    .item-option {
        padding: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;
        color: #a7a7a7;

        &:hover {
            background-color: rgba(0, 0, 0, 0.1);
            color: var(--black);
        }
    }

    .item-option.important {
        color: var(--secondary);
    }
`;

const ModalContent = styled.div`
    font-family: 'Fashion';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background-color: var(--white);
    border: 2px solid var(--black);
    border-radius: 20px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40px;

    p {
        font-size: 32px;
        font-weight: bold;
        text-align: center;
    }

    .delete-img, .edit-img {
        width: 150px;
        height: auto;
    }

    .modal-options {
        display: flex;
        gap: 50px;
    }

    button {
        background: none;
        border: 1px solid var(--black);
        width: 100%;
        border-radius: 8px;
        padding: 12px;
        font-family: 'Fashion';
        font-size: 24px;
        transition: all 0.1s;
        cursor: pointer;

        &:hover {
            background-color: var(--secondary);
            border-color: var(--secondary);
            color: var(--white);
        }
    }
`;

const Input = styled(TextField)`
    & label {
        font-family: 'Fashion';
        font-weight: bold;
        color: var(--black);
    }

    .MuiInput-underline:before {
        border-bottom: 2px solid var(--black);
    }

    && .MuiInput-underline:hover:before {
        border-bottom: 2px solid var(--secondary);
    }

    & label.Mui-focused {
        color: var(--secondary);
    }
    & .MuiInput-underline:after {
        border-bottom-color: var(--secondary);
    }
    & .MuiOutlinedInput-root {
        & fieldset {
            font-family: 'Fashion';
            border-color: var(--black);
        }

        &:hover fieldset {
            border-color: var(--secondary);
        }

        &.Mui-focused fieldset {
            border-color: var(--secondary);
        }
    }
`;

export default function ClothingCard({ item, editable, sendToCanvas, swapCategory, editItem, deleteItem }) {
    const [editOpen, setEditOpen] = useState(false);
    const [newItemName, setNewItemName] = useState(item.fileName);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);

    function handleSubmitEdit(e) {
        e.preventDefault();
        setEditOpen(false);
        editItem(item, newItemName); 
    }

    function handleCloseEdit() {
        setEditOpen(false);
        setNewItemName(item.fileName);
    }

    return (
        <>
            <Container>
                <p>{item.fileName}</p>
                <img
                    src={item.mediumFileUrl}
                    alt={item.fileName}
                    onClick={() => setImageModalOpen(true)}
                />
                <div className="item-options">
                    <Tooltip title="Send to Canvas">
                        <Shortcut
                            className="item-option important"
                            sx={{ fontSize: 45 }}
                            onClick={() => sendToCanvas(item)}
                        />
                    </Tooltip>
                    {
                        editable &&
                        <>
                            <Tooltip title="Change Category">
                                <SwapVert
                                    className="item-option"
                                    sx={{ fontSize: 45 }}
                                    onClick={() => swapCategory(item)}
                                />
                            </Tooltip>
                            <Tooltip title="Edit">
                                <Edit
                                    className="item-option"
                                    sx={{ fontSize: 45 }}
                                    onClick={() => setEditOpen(true)}
                                />
                            </Tooltip>
                            <Tooltip title="Delete">
                                <Delete
                                    className="item-option"
                                    sx={{ fontSize: 45 }}
                                    onClick={() => setConfirmDeleteOpen(true)}
                                />
                            </Tooltip>
                        </>
                    }
                </div>
            </Container>
            <ImageModal
                open={imageModalOpen}
                image={{ src: item.fullFileUrl, alt: item.fileName }}
                closeModal={() => setImageModalOpen(false)}
            />
            <Modal
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
            >
                <ModalContent>
                    <p>Are you sure you want to delete this item?</p>
                    <p style={{ textDecoration: 'underline' }}>{item.fileName}</p>
                    <img
                        src={item.fullFileUrl}
                        alt={item.fileName}
                        className="delete-img"
                    />
                    <div className="modal-options">
                        <button onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
                        <button onClick={() => { setConfirmDeleteOpen(false); deleteItem(item); }}>Delete</button>
                    </div>
                </ModalContent>
            </Modal>
            <Modal
                open={editOpen}
                onClose={handleCloseEdit}
            >
                <form onSubmit={handleSubmitEdit}>
                    <ModalContent>
                        <p>EDIT ITEM</p>
                        <Input
                            InputLabelProps={{ required: false }}
                            id="outlined-item-name"
                            variant="outlined"
                            label="ITEM NAME"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            fullWidth
                            required
                        />
                        <img
                        src={item.fileUrl}
                        alt={item.fileName}
                        className="edit-img"
                    />
                        <div className="modal-options">
                            <button type="button" onClick={handleCloseEdit}>Cancel</button>
                            <button type="submit">Save</button>
                        </div>
                    </ModalContent>
                </form>
            </Modal>
        </>
    );
}
