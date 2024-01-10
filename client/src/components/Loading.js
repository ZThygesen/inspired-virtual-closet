import { CircularProgress } from '@mui/material';
import styled from 'styled-components';
import Modal from './Modal';

const CircleProgress = styled(CircularProgress)`
    & * {
        color: #FFF;
    }
`;

export default function Loading({ open }) {
    return (
        <Modal
            open={open}
            isImage={true}
            isLoading={true}
        >
            <CircleProgress color="inherit" />
        </Modal>
    );
}
