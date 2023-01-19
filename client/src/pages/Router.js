import { Routes, Route } from 'react-router-dom';
import DigitalCloset from './DigitalCloset';
import ManageClients from './ManageClients';

export default function Router() {
    return (
        <>
            <Routes>
                <Route index element={<ManageClients />} />
                <Route path=":client" element={<DigitalCloset />} />
            </Routes>
        </>
    );
}
