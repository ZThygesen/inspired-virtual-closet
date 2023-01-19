import { Link } from 'react-router-dom';

export default function ManageClients() {
    const client = 'Lizette';

    return (
        <>
            Manage Clients
            <Link to={`${client.toLowerCase()}`} state={{ clientName: client }}>Digital Closet</Link>
        </>
    ); 
}
