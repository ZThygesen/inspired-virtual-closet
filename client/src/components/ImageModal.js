import { Backdrop } from '@mui/material';
import { Close } from '@mui/icons-material';
import styled from 'styled-components';

const CloseModal = styled.div`
    position: absolute;
    top: 15px;
    right: 35px;
    color: #f1f1f1;
    font-size: 40px;
    font-weight: bold;
    transition: 0.1s;
    cursor: pointer;

    &:hover {
        transform: scale(1.05);
    }
`;

export default function ImageModal({ open, image, closeModal }) {
    return (
        <div>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={open}
                onClick={closeModal}
            >
                <CloseModal onClick={closeModal}>
                    <Close sx={{ fontSize: 45 }} />
                </CloseModal>
                <img
                    style={{
                        width: '450px',
                        height: 'auto'
                    }}
                    className="modal-image"
                    src={image.src}
                    alt={image.alt}
                />
            </Backdrop>
        </div>
    );
}
