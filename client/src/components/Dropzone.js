import { useEffect, useRef, useState } from 'react';
import axios from 'axios'
import cuid from 'cuid';
import { DropContainer, Button, FileContainer, FileCard } from '../styles/Dropzone';
import Modal from './Modal';
import Loading from './Loading';
import invalidImg from '../images/invalid.png';

export default function Dropzone({ client, category, disabled, updateItems }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [invalidFiles, setInvalidFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [borderColor, setBorderColor] = useState('#231f20');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModal, setImageModal] = useState({});
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const fileInputRef = useRef();

    useEffect(() => {
        const filteredArray = [...new Map(selectedFiles.map(file => [file.name, file])).values()];
        setFilteredFiles([...filteredArray]);
        fileInputRef.current.value = null;
    }, [selectedFiles]);

    function dragOver(e) {
        e.preventDefault();
        setBorderColor('#8cc640')
    }

    function dragEnter(e) {
        e.preventDefault();
    }

    function dragLeave(e) {
        e.preventDefault();
        setBorderColor('#231f20');
    }

    function fileDrop(e) {
        e.preventDefault();
        setBorderColor('#231f20');
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFiles(files);
        }
    }

    function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            files[i]['id'] = cuid();
            files[i]['fileSize'] = getFileSize(files[i].size);

            if (validateFile(files[i])) {
                convertToImage(files[i]);
            } else {
                files[i]['invalid'] = true;
                setSelectedFiles(current => [...current, files[i]]);
                setInvalidFiles(current => [...current, files[i]]);
                setErrorMessage('File type not permitted');
            }
        }
    }

    function validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/x-icon'];

        if (validTypes.indexOf(file.type) === -1) {
            return false;
        }

        return true;
    }

    function convertToImage(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function (e) {
            file['src'] = e.target.result;
            setSelectedFiles(current => [...current, file]);
        };
    }

    function getFileSize(size) {
        if (size === 0) {
            return '0 Bytes';
        }

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(size) / Math.log(k));

        return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function removeFile(file) {
        // remove image from DOM immediately to prevent delay
        document.getElementById(file.id).remove();

        // remove file from filtered array
        let fileIndex = filteredFiles.findIndex(item => item.name === file.name);
        let tmpFileArray = filteredFiles;
        tmpFileArray.splice(fileIndex, 1);
        setFilteredFiles([...tmpFileArray]);

        // remove file from invalid files array (if applicable)
        fileIndex = invalidFiles.findIndex(item => item.name === file.name);
        if (fileIndex !== -1) {
            tmpFileArray = invalidFiles;
            tmpFileArray.splice(fileIndex, 1);
            setInvalidFiles([...tmpFileArray]);
        }

        // remove all duplicates of file from main file array

        // get all indexes of file to remove
        const fileIndexes = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            if (selectedFiles[i].name === file.name) {
                fileIndexes.push(i);
            }
        }

        // set each index to -1 to mark for removal
        tmpFileArray = selectedFiles;
        fileIndexes.forEach(index => {
            tmpFileArray[index] = -1;
        });

        // add the elements that aren't marked to a new array
        const newArray = [];
        for (let i = 0; i < tmpFileArray.length; i++) {
            if (tmpFileArray[i] !== -1) {
                newArray.push(tmpFileArray[i]);
            }
        }
        setSelectedFiles([...newArray]);
    }

    function fileInputClicked() {
        fileInputRef.current.click();
    }

    function fileSelected() {
        if (fileInputRef.current.files.length) {
            handleFiles(fileInputRef.current.files);
        }
    }

    async function handleSubmit() {
        setUploadModalOpen(current => !current);
        const files = await uploadFiles();
        await axios.post('/files', {
            categoryId: category._id,
            files: files
        });

        setUploadModalOpen(false);
        setResultModalOpen(true);
        updateItems();
        setSelectedFiles([]);
        setFilteredFiles([]);
        setInvalidFiles([]);
    }

    // TODO: Remove background from images before storing
    async function uploadFiles() {
        const files = [];
        for (let i = 0; i < filteredFiles.length; i++) {
            const formData = new FormData();
            formData.append('image', filteredFiles[i]);
            formData.append('key', process.env.REACT_APP_IMGBB_API_KEY);
            const res = await axios.post('https://api.imgbb.com/1/upload', formData);
            console.log(res);
            files.push({
                clientId: client._id,
                fileName: res.data.data.title,
                fullFileUrl: res.data.data.url,
                mediumFileUrl: res.data.data.medium.url,
                smallFileUrl: res.data.data.thumb.url,
                fileId: res.data.data.id,
                deleteUrl: res.data.data.delete_url
            });
        }
        
        return files;
    }

    function openImageModal(file) {
        setImageModalOpen(current => !current);
        setImageModal({ src: file.src, alt: file.name });
    }

    function closeImageModal() {
        setImageModalOpen(false);
        setImageModal({});
    }

    return (
        <>
            <DropContainer style={{ border: `4px dashed ${borderColor}` }}
                onDragOver={dragOver}
                onDragEnter={dragEnter}
                onDragLeave={dragLeave}
                onDrop={fileDrop}
            >
                <div className="upload-icon" onClick={fileInputClicked}></div>
                <p>
                    <span
                        className="click-upload"
                        onClick={fileInputClicked}
                    >
                        <input
                            ref={fileInputRef}
                            className="file-input"
                            type="file"
                            onChange={fileSelected}
                            multiple
                        />
                        Choose file(s)
                    </span>
                    &nbsp;or drag & drop here
                </p>
            </ DropContainer>
            <Button
                    className="submit"
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={!(invalidFiles.length === 0 && filteredFiles.length) || disabled}
                >
                    Submit File(s)
            </Button>
            {filteredFiles.length > 0 &&
                <FileContainer>
                    <h2 className="title">Current Files</h2>
                    {invalidFiles.length ?
                        <p className="file-error-message">
                            Please remove all unsupported files.
                        </p> : ''
                    }
                    <div className="file-preview-container">
                        {
                            filteredFiles.map(file => (
                                <FileCard key={file.id}>
                                    <button className="material-icons file-remove" onClick={() => removeFile(file)}>close</button>
                                    {file.invalid && <div className="file-error-message">{errorMessage}</div>}
                                    <img
                                        src={file.invalid ? invalidImg : file.src}
                                        alt={file.name}
                                        id={file.id}
                                        className={`file-img ${file.invalid ? 'invalid' : ''}`}
                                        onClick={!file.invalid ? () => openImageModal(file) : () => removeFile(file)}
                                    />
                                    <div className="file-info">
                                        <p className="file-name">{file.name}</p>
                                        <p className="file-size">({file.fileSize})</p>
                                    </div>
                                </FileCard>
                            ))
                        }
                    </div>
                </FileContainer>
            }
            <Loading open={true} />
            <Modal
                open={imageModalOpen}
                closeModal={closeImageModal}
                isImage={true}
            >
                <>
                    <button className="material-icons close-modal" onClick={closeImageModal}>close</button>
                    <img src={imageModal.src} alt={imageModal.alt} className="image-modal" />
                </>
            </Modal>
            <Modal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
            >
                <div className="modal-content">
                    <p className="large bold">Are you sure you want to add these items to <span className="category large bold">{category.name}</span>?</p>
                </div>
                <div className="modal-options">
                    <button onClick={() => setConfirmModalOpen(false)}>Cancel</button>
                    <button onClick={() => { setConfirmModalOpen(false); handleSubmit(); }}>Submit</button>
                </div>
            </Modal>
            <Modal
                open={resultModalOpen}
                onClose={() => setResultModalOpen(false)}
            >
                <div className="modal-content">
                    <p className="large bold">Items added successfully to <span className="category large bold">{category.name}</span>!</p>
                </div>
                <div className="modal-options">
                        <button onClick={() => setResultModalOpen(false)}>OK</button>
                </div>
            </Modal>
        </>
    );
}
