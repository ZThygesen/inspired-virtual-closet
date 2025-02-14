import { useCallback, useEffect } from 'react';
import { Modal as MuiModal } from '@mui/material';
import { ModalContentContainer } from '../styles/Modal';

export default function Modal({ open, closeFn, isForm, submitFn, isImage, isLoading=false, children }) {
    const handleClick = useCallback((e) => {
        const classList = Array.from(e.target.classList);
        if (isImage && 
            !isLoading && 
            open && 
            e.target.tagName !== 'IMG' && 
            !classList.includes('send-to-canvas') &&
            !classList.includes('prev-card') &&
            !classList.includes('next-card')
        ) {
            closeFn();
        }
        
    }, [open, isImage, isLoading, closeFn]);

    useEffect(() => {
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        }
    }, [handleClick]);

    

    return (
        <MuiModal
            open={open}
            onClose={closeFn}
            className="backdrop"
        >
            {isForm ?
                <form onSubmit={submitFn}>
                    <ModalContentContainer>{children}</ModalContentContainer>
                </form>
                :
                <ModalContentContainer className={isImage ? 'image-modal' : ''}>{children}</ModalContentContainer>
            }
        </MuiModal>
    );
}
