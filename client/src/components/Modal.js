import { Modal as MuiModal } from '@mui/material';
import { ModalContentContainer } from '../styles/Modal';

export default function Modal({ open, closeFn, isForm, submitFn, children }) {
    
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
                <ModalContentContainer>{children}   </ModalContentContainer>
            }
        </MuiModal>
    );
}
