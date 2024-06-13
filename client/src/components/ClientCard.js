import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientCardContainer } from '../styles/ClientCard';
import { Tooltip } from '@mui/material';
import Modal from './Modal';
import Input from './Input';
import { useUser } from './UserContext';

export default function ClientCard({ client, editClient, deleteClient }) {
    const [editOpen, setEditOpen] = useState(false);
    const [newFirstName, setNewFirstName] = useState(client.firstName);
    const [newLastName, setNewLastName] = useState(client.lastName);
    const [newEmail, setNewEmail] = useState(client.email);
    const [newCredits, setNewCredits] = useState(client.credits);
    const [newRole, setNewRole] = useState(client.isAdmin);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const { user } = useUser();
    
    const navigate = useNavigate();

    function handleSubmitEdit(e) {
        e.preventDefault();
        setEditOpen(false);
        editClient(client, newFirstName, newLastName, newEmail, newCredits, newRole);
    }

    function handleCloseEdit() {
        setEditOpen(false);
        setNewFirstName(client.firstName);
        setNewLastName(client.lastName);
        setNewEmail(client.email);
        setNewRole(client.isAdmin);
        setNewCredits(client.credits);
    }

    return (
        <>
            <ClientCardContainer>
                <p className="client-name">{`${client.firstName} ${client.lastName}`}</p>
                <p className="client-name secondary">{`${client.email} - ${client.isAdmin} - ${client?.isSuperAdmin || false} - ${client.credits || 0}`}</p>
                <div className="client-options">
                    { (!client?.isSuperAdmin && user?.isSuperAdmin) &&
                        <Tooltip title="Edit">
                            <button className="material-icons edit-icon" onClick={() => setEditOpen(true)}>edit</button>
                        </Tooltip>
                    }
                    <Tooltip title="Virtual Closet">
                        <button
                            className="material-icons closet-icon"
                            onClick={() => navigate(`${client.firstName.toLowerCase()}-${client.lastName.toLowerCase()}`, { state: { client: client } })}
                        >
                            checkroom
                        </button>
                    </Tooltip>
                    { (!client?.isSuperAdmin && user?.isSuperAdmin) &&
                        <Tooltip title="Delete">
                            <button className="material-icons delete-icon" onClick={() => setConfirmDeleteOpen(true)}>delete</button>
                        </Tooltip>
                    }
                    
                </div>
            </ClientCardContainer>
            { (!client?.isSuperAdmin && user?.isSuperAdmin) &&
                <Modal
                    open={editOpen}
                    closeFn={handleCloseEdit}
                    isForm={true}
                    submitFn={handleSubmitEdit}
                >
                    <h2 className="modal-title">EDIT CLIENT</h2>
                    <Input
                        type="text"
                        id="first-name"
                        label="First Name"
                        value={newFirstName}
                        onChange={e => setNewFirstName(e.target.value)}
                    />
                    <Input
                        type="text"
                        id="last-name"
                        label="Last Name"
                        value={newLastName}
                        onChange={e => setNewLastName(e.target.value)}
                    />
                    <Input
                        type="text"
                        id="email"
                        label="Email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                    />
                    <Input
                        type="number"
                        id="credits"
                        label="Credits"
                        value={newCredits}
                        onChange={e => setNewCredits(e.target.value)}
                    />
                    <Input
                        type="checkbox"
                        id="role"
                        label="Admin"
                        value={newRole}
                        onChange={e => setNewRole(e.target.checked)}
                    />
                    <div className="modal-options">
                        <button type="button" onClick={handleCloseEdit}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </Modal>
            }
            <Modal
                open={confirmDeleteOpen}
                closeFn={() => setConfirmDeleteOpen(false)}
            >
                <>
                    <h2 className="modal-title">DELETE CLIENT</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this client?</p>
                        <p className="large bold underline">{client.firstName} {client.lastName}</p>
                        <p className="small bold warning">Deleting this client will permanently delete all image files and all outfits in their virtual closet!</p>
                    </div>
                    <div className="modal-options">
                        <button onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
                        <button onClick={() => { setConfirmDeleteOpen(false); deleteClient(client); }}>Delete</button>
                    </div>
                </>
            </Modal>
        </>
    );
}
