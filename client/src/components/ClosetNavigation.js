import styled from 'styled-components';
import { Menu } from '@mui/icons-material';

const Container = styled.div`
    background-color: var(--primary);
    width: 100%;
    transition: 0.3s;
`;

export default function ClosetNavigation({ open, openSidebar }) {
    return (
        <>
            <Container >
                {!open && <Menu onClick={openSidebar} />}
            </Container>
        </>
    );
}
