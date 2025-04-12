import { useState } from 'react';
import { FileCardContainer } from '../styles/AddItems';
import Modal from './Modal';
import invalidImg from '../images/invalid.png';

export default function FileCard({ file, removeFile }) {
    const [imageModalOpen, setImageModalOpen] = useState(false);

    function openImageModal() {
        setImageModalOpen(true);
    }

    function closeImageModal() {
        setImageModalOpen(false);
    }

    return (
        <>
            <FileCardContainer>
                <button className="material-icons file-remove" onClick={() => removeFile(file)}>close</button>
                {file.invalid && <div className="file-error-message">File type not permitted</div>}
                <p className="file-name">{file.name}</p>
                <div className="file-card-img">
                    <img
                        src={file.invalid ? invalidImg : file.src}
                        alt={file.name}
                        id={file.id}
                        className={`file-img ${file.invalid ? 'invalid' : ''}`}
                        onClick={!file.invalid ? () => openImageModal() : () => removeFile(file)}
                    />
                </div>
            </FileCardContainer>
            <Modal
                open={imageModalOpen}
                closeFn={closeImageModal}
                isImage={true}
            >
                <>
                    <button className="material-icons close-modal" onClick={closeImageModal}>close</button>
                    <img src={file.src} alt={file.name} className="image-modal" />
                </>
            </Modal>
        </>
    );
}