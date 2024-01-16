import { useEffect, useState } from 'react';
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
    const [clients, setClients] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [newClientFName, setNewClientFName] = useState('');
    const [newClientLName, setNewClientLName] = useState('');
    const [loading, setLoading] = useState(false);

    const [deleteProgressOpen, setDeleteProgressOpen] = useState(false);
    const [deleteProgressMessage, setDeleteProgressMessage] = useState('');
    const [deleteProgressNumerator, setDeleteProgressNumerator] = useState(0)
    const [deleteProgressDenominator, setDeleteProgressDenominator] = useState(1);

    useEffect(() => {
        getClients();
    }, []);

    async function getClients() {
        setLoading(true);
        const response = await axios.get('/api/clients')
            .catch(err => console.log(err));
        
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
        await axios.post('/api/clients', {
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

        await axios.patch(`/api/clients/${client._id}`, { newFirstName: newFirstName, newLastName: newLastName })
            .catch(err => console.log(err));
        
        await getClients();
        setLoading(false);
    }

    async function deleteClient(client) {
        // get client items and outfits
        setLoading(true);
        const items = await getClientItems(client);
        const outfits = await getClientOutfits(client);
        setLoading(false);

        setDeleteProgressOpen(true);

        // delete client items
        if (items.length > 1) {
            setDeleteProgressDenominator(items.length);
            setDeleteProgressMessage('Deleting client items...');

            await deleteClientItems(items);
            await pause(750);
        }
        

        // delete client outfits
        if (outfits.length > 0) {
            setDeleteProgressDenominator(outfits.length);
            setDeleteProgressNumerator(0);
            setDeleteProgressMessage('Deleting client outfits...');

            await deleteClientOutfits(outfits);
            await pause(750);
        }
        
        // delete client
        setDeleteProgressOpen(false);
        setLoading(true);

        setDeleteProgressDenominator(0);
        setDeleteProgressNumerator(0);
        setDeleteProgressMessage('');


        await axios.delete(`/api/clients/${client._id}`)
            .catch(err => console.log(err));

        // update
        await getClients();
        setLoading(false);
    }

    async function getClientItems(client) {
        const response = await axios.get(`/files/${client._id}`)
            .catch(err => console.log(err));

        const categories = response.data;

        const items = []
        for (const category of categories) {
            for (const item of category.items) {
                item.categoryId = category._id;
                items.push(item);
            }
        }

        return items
    }

    async function getClientOutfits(client) {
        const response = await axios.get(`/outfits/${client._id}`)
            .catch(err => console.log(err));

        const outfits = response.data;

        return outfits;
    }       

    async function deleteClientItems(items) {
        for (const item of items) {
            await axios.delete(`/files/${item.categoryId}/${item.gcsId}`)
                .catch(err => console.log(err));

            setDeleteProgressNumerator(current => current + 1);
        }

        setTimeout(() => {

        }, 750);
    }

    async function deleteClientOutfits(outfits) {
        for (const outfit of outfits) {
            await axios.delete(`/outfits/${outfit._id}`)
                .catch(err => console.log(err));
            
            setDeleteProgressNumerator(current => current + 1);
        }
    }

    function pause(time) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(time);
            }, time)
        })
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
