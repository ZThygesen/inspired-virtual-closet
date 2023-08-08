import { useEffect, useState } from 'react';
import axios from 'axios';
import cuid from 'cuid';
import ClientCard from '../components/ClientCard';
import Loading from '../components/Loading';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import { ManageClientsContainer } from '../styles/ManageClients';
import Input from '../components/Input';

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
                <h1 className="title">MANAGE CLIENTS</h1>
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
                onClose={handleClose}
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
        </>
    ); 
}
