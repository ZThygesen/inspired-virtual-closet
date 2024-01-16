import { useError } from './ErrorContext';
import Modal from './Modal';

export default function ErrorModal() {
    const { error, closeError } = useError();

    return (
        <Modal
            open={error !== null}
            closeFn={closeError}
        >
            <div className="modal-title warning">ERROR</div>
            <div className="modal-content">
                <p className="medium warning" style={{ whiteSpace: 'pre-line' }}>{error}</p>
                <p className="small">Refresh your page and try again.</p>
            </div>
            <div className="modal-options">
                <button onClick={closeError}>OK</button>
            </div>
        </Modal>
    );
}

