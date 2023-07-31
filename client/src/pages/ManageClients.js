import { useEffect, useState } from 'react';
import axios from 'axios';
import cuid from 'cuid';
import styled from 'styled-components';
import { ManageClientsContainer } from '../styles/ManageClients';
import ClientCard from '../components/ClientCard';
import Loading from '../components/Loading';
import { Modal, TextField } from '@mui/material';

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

export default function ManageClients() {
    const [clients, setClients] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [newClientFName, setNewClientFName] = useState('');
    const [newClientLName, setNewClientLName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getClients();
    }, []);

    async function getClients() {
        setLoading(true);
        const response = await axios.get('/clients')
            .catch(err => console.log(err));
        
        setClients(response.data);
        setLoading(false);
    }

    function handleClose() {
        setOpenModal(false);
        setNewClientFName('');
        setNewClientLName('');
    }

    async function addClient(e) {
        e.preventDefault();
        setLoading(true);

        await axios.post('/clients', {
            firstName: newClientFName,
            lastName: newClientLName
        })
            .catch(err => console.log(err));

        handleClose();
        await getClients();
        setLoading(false);
    }

    async function editClient(client, newFirstName, newLastName) {
        setLoading(true);
        if (client.firstName === newFirstName && client.lastName === newLastName) {
            setLoading(false);
            return;
        }

        await axios.patch('/clients', { clientId: client._id, newFirstName: newFirstName, newLastName: newLastName })
            .catch(err => console.log(err));
        
        await getClients();
        setLoading(false);
    }

    async function deleteClient(client) {
        setLoading(true);
        await axios.delete(`/clients/${client._id}`)
            .catch(err => console.log(err));
        
        await getClients();
        setLoading(false);
    }

    return (
        <>
            <ManageClientsContainer>
                <h1 className="title">Manage Clients</h1>
                <div className="clients">
                    {
                        clients.map(client => (
                            <ClientCard client={client} editClient={editClient} deleteClient={deleteClient} key={cuid()} />
                        ))
                    }
                </div>
                <div className="footer">
                    <button className="add-client" onClick={() => setOpenModal(true)}>ADD CLIENT</button>
                </div>
            </ManageClientsContainer>
            <Loading open={loading} />
            <Modal
                    open={openModal}
                    onClose={handleClose}
                >
                    <form onSubmit={addClient}>
                        <ModalContent>
                            <p>ADD CLIENT</p>
                            <Input
                                InputLabelProps={{ required: false }}
                                id="outlined-client-first-name"
                                variant="outlined"
                                label="FIRST NAME"
                                value={newClientFName}
                                onChange={e => setNewClientFName(e.target.value)}
                                fullWidth
                                required
                                />
                            <Input
                                InputLabelProps={{ required: false }}
                                id="outlined-client-last-name"
                                variant="outlined"
                                label="LAST NAME"
                                value={newClientLName}
                                onChange={e => setNewClientLName(e.target.value)}
                                fullWidth
                                required
                            />
                            <div className="modal-options">
                                <button type="button" onClick={handleClose}>Cancel</button>
                                <button type="submit">Submit</button>
                            </div>
                        </ModalContent>
                    </form>
            </Modal>
        </>
    ); 
}
