import { Routes, Route } from 'react-router-dom';
import VirtualCloset from './VirtualCloset';
import ManageClients from './ManageClients';

export default function Router() {
    return (
        <>
            <Routes>
                <Route index element={<ManageClients />} />
                <Route path=":client" element={<VirtualCloset />} />
            </Routes>
        </>
    );
}
