import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Modal, TextField, Tooltip } from '@mui/material';  
import { Checkroom, Delete, Edit } from '@mui/icons-material';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    box-shadow: var(--box-shadow);
    border-radius: 25px;
    padding: 40px 20px;
    background-color: var(--white);
    height: min-content;
    max-width: 300px;

    p {
        font-family: 'Fashion';
        font-size: 40px;
        font-weight: bold;
        word-break: break-word;
        text-align: center;
    }

    .client-options {
        display: flex;
        align-items: flex-end;
    }

    .client-option-btn {
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

    .client-option-btn.large {
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

    .warning {
        color: red;
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

export default function ClientCard({ client, editClient, deleteClient }) {
    const [editOpen, setEditOpen] = useState(false);
    const [newFirstName, setNewFirstName] = useState(client.firstName);
    const [newLastName, setNewLastName] = useState(client.lastName);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const navigate = useNavigate();

    function handleSubmitEdit(e) {
        e.preventDefault();
        setEditOpen(false);
        editClient(client, newFirstName, newLastName);
    }

    function handleCloseEdit() {
        setEditOpen(false);
        setNewFirstName(client.firstName);
        setNewLastName(client.lastName);
    }

    return (
        <>
            <Container>
                <p>{`${client.firstName} ${client.lastName}`}</p>
                <div className="client-options">
                    <Tooltip title="Edit">
                        <Edit onClick={() => setEditOpen(true)} sx={{ fontSize: 45 }} className="client-option-btn" />
                    </Tooltip>
                    <Tooltip title="Digital Closet">
                        <Checkroom
                            className="client-option-btn large"
                            sx={{ fontSize: 75 }}
                            onClick={() => navigate(`${client.firstName.toLowerCase()}-${client.lastName.toLowerCase()}`, { state: { client: client } })}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Delete onClick={() => setConfirmDeleteOpen(true)} sx={{ fontSize: 45 }} className="client-option-btn" />
                    </Tooltip>
                </div>
            </Container>
            <Modal
                    open={editOpen}
                    onClose={handleCloseEdit}
                >
                    <form onSubmit={handleSubmitEdit}>
                        <ModalContent>
                            <p>EDIT CLIENT</p>
                            <Input
                                InputLabelProps={{ required: false }}
                                id="outlined-client-first-name"
                                variant="outlined"
                                label="FIRST NAME"
                                value={newFirstName}
                                onChange={e => setNewFirstName(e.target.value)}
                                fullWidth
                                required
                                />
                            <Input
                                InputLabelProps={{ required: false }}
                                id="outlined-client-last-name"
                                variant="outlined"
                                label="LAST NAME"
                                value={newLastName}
                                onChange={e => setNewLastName(e.target.value)}
                                fullWidth
                                required
                            />
                            <div className="modal-options">
                                <button type="button" onClick={handleCloseEdit}>Cancel</button>
                                <button type="submit">Save</button>
                            </div>
                        </ModalContent>
                    </form>
            </Modal>
            <Modal
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
            >
                <ModalContent>
                    <p>Are you sure you want to delete this client?</p>
                    <p style={{ textDecoration: 'underline' }}>{client.firstName} {client.lastName}</p>
                    <p className="warning">Deleting this client will permanently delete all image files in their digital closet!</p>
                    <div className="modal-options">
                        <button onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
                        <button onClick={() => { setConfirmDeleteOpen(false); deleteClient(client); }}>Delete</button>
                    </div>
                </ModalContent>
            </Modal>
        </>
    );
}
