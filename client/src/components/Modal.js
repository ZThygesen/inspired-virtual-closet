import { Modal as MuiModal } from '@mui/material';
import { ModalContentContainer } from '../styles/Modal';

export default function Modal({ open, closeFn, isForm, submitFn, isImage, children }) {
    
    return (
        <MuiModal
            open={open}
            onClose={closeFn}
        >
            {isForm ?
                <form onSubmit={submitFn}>
                    <ModalContentContainer>{children}</ModalContentContainer>
                </form>
                :
                <ModalContentContainer className={isImage ? 'image-modal' : ''}>{children}   </ModalContentContainer>
            }
        </MuiModal>
    );
}
