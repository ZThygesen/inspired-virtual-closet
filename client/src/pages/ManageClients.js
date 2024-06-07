import { useCallback, useEffect, useState } from 'react';
import { useError } from '../components/ErrorContext';
import axios from 'axios';
import cuid from 'cuid';
import styled from 'styled-components';
import ClientCard from '../components/ClientCard';
import Loading from '../components/Loading';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { CircularProgress } from '@mui/material';
import { ManageClientsContainer } from '../styles/ManageClients';

const CircleProgress = styled(CircularProgress)`
    & * {
        color: #f47853;
    }
`;

function CircularProgressWithLabel(props) {
    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <CircleProgress variant='determinate' size="60px" {...props} />
            <div
                style={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <p className="x-small">{`${Math.round(props.value)}%`}</p>
            </div>
        </div>
    )
}

export default function ManageClients() {
    const { setError } = useError();

    const [clients, setClients] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [newClientFName, setNewClientFName] = useState('');
    const [newClientLName, setNewClientLName] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [newClientRole, setNewClientRole] = useState(false);
    const [loading, setLoading] = useState(false);

    const [deleteProgressOpen, setDeleteProgressOpen] = useState(false);
    const [deleteProgressMessage, setDeleteProgressMessage] = useState('');
    const [deleteProgressNumerator, setDeleteProgressNumerator] = useState(0)
    const [deleteProgressDenominator, setDeleteProgressDenominator] = useState(1);

    const getClients = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/clients');
            setClients(response.data.sort(function (a, b) {
                if (a.firstName < b.firstName) {
                    return -1;
                } 
                else if (a.firstName > b.firstName) {
                    return 1;
                }
                else {
                    return 0;
                }
            }));
        } catch (err) {
            setError({
                message: 'There was an error fetching clients.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }, [setError]);

    useEffect(() => {
        getClients();
    }, [getClients]);

    function handleClose() {
        setOpenModal(false);
        setNewClientFName('');
        setNewClientLName('');
        setNewClientEmail('');
        setNewClientRole(false);
    }

    async function addClient(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post('/api/clients', {
                firstName: newClientFName,
                lastName: newClientLName,
                email: newClientEmail,
                isAdmin: newClientRole
            });
            handleClose();
            await getClients();
        } catch(err) {
            setError({
                message: 'There was an error adding the client.',
                status: err.response.status
            });
        } finally {
           setLoading(false);
        }
    }

    async function editClient(client, newFirstName, newLastName, newEmail, newIsAdmin) {
        setLoading(true);
        if (client.firstName === newFirstName && 
            client.lastName === newLastName &&
            client.email === newEmail &&
            client.isAdmin === newIsAdmin
        ) {
            setLoading(false);
            return;
        }
        try {
            await axios.patch(`/api/clients/${client._id}`, { 
                newFirstName: newFirstName, 
                newLastName: newLastName,
                newEmail: newEmail,
                newIsAdmin: newIsAdmin
            });  
            await getClients();
        } catch (err) {
            setError({
                message: 'There was an error editing the client.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

    function handleDeleteProgressClose() {
        setDeleteProgressOpen(false);
        setDeleteProgressDenominator(1);
        setDeleteProgressNumerator(0);
        setDeleteProgressMessage('');
    }

    async function deleteClient(client) {
        // get client items and outfits
        setLoading(true);
        const items = await getClientItems(client);
        const outfits = await getClientOutfits(client);
        setLoading(false);

        if (!items || !outfits) {
            return;
        }
        
        setDeleteProgressOpen(true);

        // delete client items
        if (items.length > 1) {
            setDeleteProgressDenominator(items.length);
            setDeleteProgressMessage('Deleting client items...');

            const finished = await deleteClientItems(items);
            if (!finished) {
                handleDeleteProgressClose();
                return;
            }
            await pause(750);
        }
        

        // delete client outfits
        if (outfits.length > 0) {
            setDeleteProgressDenominator(outfits.length);
            setDeleteProgressNumerator(0);
            setDeleteProgressMessage('Deleting client outfits...');

            const finished = await deleteClientOutfits(outfits);
            if (!finished) {
                handleDeleteProgressClose();
                return;
            }
            await pause(750);
        }
        
        // delete client
        setLoading(true);
        handleDeleteProgressClose();

        try {
            await axios.delete(`/api/clients/${client._id}`);
            
            // update
            await getClients();
        } catch (err) {
            setError({
                message: 'There was an error deleting the client.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }   
    }

    async function getClientItems(client) {
        const items = []
        try {
           const response = await axios.get(`/files/${client._id}`);
           const categories = response.data;
            for (const category of categories) {
                for (const item of category.items) {
                    item.categoryId = category._id;
                    items.push(item);
                }
            }
        } catch (err) {
            setError({
                message: 'There was an error fetching client items.',
                status: err.response.status
            });
            return;
        }

        return items;
    }

    async function getClientOutfits(client) {
        let outfits = [];
        try {
            const response = await axios.get(`/outfits/${client._id}`);
            outfits = response.data;
        } catch (err) {
            setError({
                message: 'There was an error fetching client outfits.',
                status: err.response.status
            });
            return;
        }
        
        return outfits;
    }       

    async function deleteClientItems(items) {
        try {
            for (const item of items) {
                await axios.delete(`/files/${item.categoryId}/${item.gcsId}`);
                setDeleteProgressNumerator(current => current + 1);
            }
        } catch (err) {
            setError({
                message: 'There was an error deleting client items.',
                status: err.response.status
            });
            return;
        }
        
        return true;
    }

    async function deleteClientOutfits(outfits) {
        try {
            for (const outfit of outfits) {
                await axios.delete(`/outfits/${outfit._id}`);
                setDeleteProgressNumerator(current => current + 1);
            }
        } catch (err) {
            setError({
                message: 'There was an error deleting client outfits.',
                status: err.response.status
            });
            return;
        }
        
        return true;
    }

    function pause(time) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(time);
            }, time);
        });
    }

    return (
        <>
            <ManageClientsContainer>
                <h1 className="title">CLIENTS</h1>
                <div className="clients">
                    {
                        clients.map(client => (
                            <ClientCard client={client} editClient={editClient} deleteClient={deleteClient} key={cuid()} />
                        ))
                    }
                </div>
                <div className="footer">
                    <ActionButton variant={'secondary'} onClick={() => setOpenModal(true)}>ADD CLIENT</ActionButton>
                </div>
            </ManageClientsContainer>
            <Loading open={loading} />
            <Modal
                open={openModal}
                closeFn={handleClose}
                isForm={true}
                submitFn={addClient}
            >
                <>
                    <h2 className="modal-title">ADD CLIENT</h2>
                    <div className="modal-content">
                        <Input
                            type="text"
                            id="first-name"
                            label="First Name"
                            value={newClientFName}
                            onChange={e => setNewClientFName(e.target.value)}
                        />
                        <Input 
                            type="text"
                            id="last-name"
                            label="Last Name"
                            value={newClientLName}
                            onChange={e => setNewClientLName(e.target.value)}
                        />
                        <Input 
                            type="text"
                            id="email"
                            label="Email"
                            value={newClientEmail}
                            onChange={e => setNewClientEmail(e.target.value)}
                        />
                        <Input 
                            type="checkbox"
                            id="role"
                            label="Admin"
                            value={newClientRole}
                            onChange={e => setNewClientRole(e.target.checked)}
                        />
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleClose}>Cancel</button>
                        <button type="submit">Submit</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={deleteProgressOpen}
            >
                <div className="modal-title">DELETING CLIENT</div>
                <div className="modal-content">
                    <p className="large">{deleteProgressMessage}</p>
                    <p className="medium">{deleteProgressNumerator}/{deleteProgressDenominator} deleted</p>
                    <CircularProgressWithLabel value={(deleteProgressNumerator / deleteProgressDenominator) * 100} />
                </div>

            </Modal>
        </>
    ); 
}
