import { useError } from './ErrorContext';
import Modal from './Modal';

export default function ErrorModal() {
    const { error, closeError } = useError();

    return (
        <Modal
            open={error !== null}
            closeFn={closeError}
        >
            <div className="modal-title">ERROR</div>
            <div className="modal-content">
                <p className="medium warning bold">{error?.message}</p>
                <p 
                    className="small warning" 
                    style={{ whiteSpace: 'pre-line' }}
                >
                    <span className="small bold warning">Status:</span> {error?.status}
                </p>
                <p className="small bold">Refresh the page and try again.</p>
                
            </div>
            <div className="modal-options">
                <button onClick={closeError}>OK</button>
            </div>
        </Modal>
    );
}

