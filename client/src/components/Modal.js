import { useCallback, useEffect } from 'react';
import { Modal as MuiModal } from '@mui/material';
import { ModalContentContainer } from '../styles/Modal';

export default function Modal({ open, closeFn, isForm, submitFn, isImage, isLoading=false, children }) {
    const handleClick = useCallback((e) => {
        if (isImage && !isLoading && open && e.target.tagName !== 'IMG') {
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
            className='backdrop'
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
