import { Backdrop } from '@mui/material';

export default function ImageModal({ open, image, closeModal }) {
    return (
        <div>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={open}
                onClick={closeModal}
            >
                <span className="close" onClick={closeModal}>X</span>
                <img
                    style={{
                        width: 'auto',
                        height: '500px'
                    }}
                    className="modal-image"
                    src={image.src}
                    alt={image.alt}
                />
            </Backdrop>
        </div>
    );
}
