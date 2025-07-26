import { useCallback, useEffect, useState } from 'react';
import { useError } from '../components/ErrorContext';
import api from '../api'
import cuid from 'cuid';
import styled from 'styled-components';
import ClientCard from '../components/ClientCard';
import Loading from '../components/Loading';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import Input from '../components/Input';
import ClosetSettings from '../components/ClosetSettings';
import { CircularProgress, Tooltip } from '@mui/material';
import { ManageClientsContainer } from '../styles/ManageClients';
import { useUser } from '../components/UserContext';

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

    const [superAdmins, setSuperAdmins] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [clients, setClients] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [newClientFName, setNewClientFName] = useState('');
    const [newClientLName, setNewClientLName] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [newClientRole, setNewClientRole] = useState(false);
    const [newClientCredits, setNewClientCredits] = useState(350);

    const [settingsOpen, setSettingsOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const [deleteProgressOpen, setDeleteProgressOpen] = useState(false);
    const [deleteProgressMessage, setDeleteProgressMessage] = useState('');
    const [deleteProgressNumerator, setDeleteProgressNumerator] = useState(0)
    const [deleteProgressDenominator, setDeleteProgressDenominator] = useState(1);

    const { user } = useUser();

    const [searchResultsSuperAdmin, setSearchResultsSuperAdmin] = useState(superAdmins || []);
    const [searchResultsAdmin, setSearchResultsAdmin] = useState(admins || []);
    const [searchResultsClients, setSearchResultsClients] = useState(clients || []);
    const [searchString, setSearchString] = useState('');
    
    const filter = useCallback((clients, searchString) => {
        const words = searchString.toLowerCase().split(/\s+/).filter(Boolean);
        const results = clients.filter(client =>
            words.every(word => 
                client?.firstName?.toLowerCase()?.includes(word) ||
                client?.lastName?.toLowerCase()?.includes(word)
            )
        );
        return results;
    }, []);

    useEffect(() => {
        const superAdminResults = filter(superAdmins, searchString);
        const adminResults = filter(admins, searchString);
        const clientResults = filter(clients, searchString);

        setSearchResultsSuperAdmin(superAdminResults);
        setSearchResultsAdmin(adminResults);
        setSearchResultsClients(clientResults);
    }, [filter, searchString, superAdmins, admins, clients]);

    const getClients = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/clients');
            const allClients = response.data.sort(function (a, b) {
                const nameA = a.firstName.toLowerCase();
                const nameB = b.firstName.toLowerCase();
                if (nameA < nameB) {
                    return -1;
                } 
                else if (nameA > nameB) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            const superAdmins = allClients.filter(client => client?.isSuperAdmin);
            const admins = allClients.filter(client => client?.isAdmin && !client?.isSuperAdmin);
            const clients = allClients.filter(client => !client?.isSuperAdmin && !client?.isAdmin);
            
            setSuperAdmins(superAdmins);
            setAdmins(admins);
            setClients(clients);
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
        setNewClientCredits(350);
        setNewClientRole(false);
    }

    async function addClient(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/api/clients', {
                firstName: newClientFName,
                lastName: newClientLName,
                email: newClientEmail,
                credits: newClientCredits,
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

    async function editClient(client, newFirstName, newLastName, newEmail, newCredits, newIsAdmin) {
        setLoading(true);
        if (client.firstName === newFirstName && 
            client.lastName === newLastName &&
            client.email === newEmail &&
            client.credits === newCredits &&
            client.isAdmin === newIsAdmin
        ) {
            setLoading(false);
            return;
        }
        try {
            await api.patch(`/api/clients/${client._id}`, { 
                newFirstName: newFirstName, 
                newLastName: newLastName,
                newEmail: newEmail,
                newCredits: newCredits,
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

            const finished = await deleteClientItems(client, items);
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

            const finished = await deleteClientOutfits(client, outfits);
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
            await api.delete(`/api/clients/${client._id}`);
            
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
        const items = [];
        try {
           const response = await api.get(`/files/${client._id}`);
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
            const response = await api.get(`/outfits/${client._id}`);
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

    async function deleteClientItems(client, items) {
        try {
            for (const item of items) {
                await api.delete(`/files/${client._id}/${item.categoryId}/${item.gcsId}`);
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

    async function deleteClientOutfits(client, outfits) {
        try {
            for (const outfit of outfits) {
                await api.delete(`/outfits/${client._id}/${outfit._id}`);
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

    function handleOpenSettings() {
        setSettingsOpen(true);
    }

    function handleCloseSettings() {
        setSettingsOpen(false);
    }

    return (
        <>
            <ManageClientsContainer>
                <div className="clients-header">
                    <h1 className="title">Clients</h1>
                    <Tooltip title="Closet Settings">
                        <button className="material-icons closet-settings-button" onClick={handleOpenSettings}>settings</button>
                    </Tooltip>
                </div>
                <div className="title-search">
                    <Input 
                        type="text"
                        id="fuzzy-search"
                        label="Search"
                        value={searchString}
                        onChange={e => setSearchString(e.target.value)}
                    />
                </div>
                
                <div className="clients">
                    {
                        searchResultsSuperAdmin?.map(client => (
                            <ClientCard client={client} editClient={editClient} deleteClient={deleteClient} key={cuid()} />
                        ))
                    }
                    {
                        searchResultsAdmin?.map(client => (
                            <ClientCard client={client} editClient={editClient} deleteClient={deleteClient} key={cuid()} />
                        ))
                    }
                    { 
                        searchResultsClients?.map(client => (
                            <ClientCard client={client} editClient={editClient} deleteClient={deleteClient} key={cuid()} />
                        ))
                    }
                </div>
                { user?.isSuperAdmin &&
                    <div className="footer">
                        <ActionButton variant={'secondary'} onClick={() => setOpenModal(true)}>Add Client</ActionButton>
                    </div>
                }
            </ManageClientsContainer>
            <Loading open={loading} />
            { user?.isSuperAdmin &&
            <>
                <Modal
                    open={openModal}
                    closeFn={handleClose}
                    isForm={true}
                    submitFn={addClient}
                >
                    <>
                        <h2 className="modal-title">Add Client</h2>
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
                                type="number"
                                id="credits"
                                label="Credits"
                                value={newClientCredits}
                                onChange={e => setNewClientCredits(e.target.value)}
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
                    <div className="modal-title">Deleting Client</div>
                    <div className="modal-content">
                        <p className="large">{deleteProgressMessage}</p>
                        <p className="medium">{deleteProgressNumerator}/{deleteProgressDenominator} deleted</p>
                        <CircularProgressWithLabel value={(deleteProgressNumerator / deleteProgressDenominator) * 100} />
                    </div>
                </Modal>
                <Modal
                    open={settingsOpen}
                    closeFn={handleCloseSettings}
                >
                    <>
                        <button className="material-icons close-modal" onClick={handleCloseSettings}>close</button>
                        <h2 className="modal-title">Closet Settings</h2>
                        <div className="modal-content no-scroll">
                            <ClosetSettings 
                                handleOpenSettings={handleOpenSettings}
                                handleCloseSettings={handleCloseSettings}
                            />
                        </div>
                    </>
                </Modal>
            </>
            }
        </>
    ); 
}
