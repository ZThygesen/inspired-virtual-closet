import { useEffect, useState } from 'react';
import axios from 'axios';
import cuid from 'cuid';
import { Modal, TextField } from '@mui/material';
import styled from 'styled-components';
import ClientCard from '../components/ClientCard';

const subHeaderHeight = 100;
const footer = 100;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    background-color: var(--white);
    height: calc(100vh - var(--header-height));

    .title {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: ${subHeaderHeight}px;
        background-color: var(--primary-light);
        font-family: 'Mallows';
        font-size: 70px;
        color: var(--black);
        position: sticky;
        z-index: 1;
        box-shadow: var(--box-shadow);
    }

    .clients {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-content: flex-start;
        gap: 40px;
        flex-wrap: wrap;
        max-width: 1400px;
        padding: 20px;
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
    }

    .footer {
        width: 100%;
        background-color: var(--primary-light);
        min-height: ${footer}px;
        position: sticky;
        box-shadow: var(--top-shadow);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    button {
        border: 2px solid var(--black);
        border-radius: 40px;
        padding: 15px 30px;
        font-family: 'Fashion';
        font-size: 40px;
        letter-spacing: 1px;
        background-color: var(--white);
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: var(--secondary);
            color: var(--white);
        }
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

    useEffect(() => {
        getClients();
    }, []);

    async function getClients() {
        const response = await axios.get('/clients')
            .catch(err => console.log(err));
        
        setClients(response.data);
    }

    function handleClose() {
        setOpenModal(false);
        setNewClientFName('');
        setNewClientLName('');
    }

    async function addClient(e) {
        e.preventDefault();

        await axios.post('/clients', {
            firstName: newClientFName,
            lastName: newClientLName
        })
            .catch(err => console.log(err));

        handleClose();
        getClients();
    }

    function editClient(client) {
        alert(`Edit client: ${client.firstName} ${client.lastName}`);
    }

    function deleteClient(client) {
        alert(`Delete client: ${client.firstName} ${client.lastName}`);
    }

    return (
        <>
            <Container>
                <p className="title">Manage Clients</p>
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
            </Container>
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
