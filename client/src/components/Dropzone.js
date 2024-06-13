import { useEffect, useRef, useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import cuid from 'cuid';
import styled from 'styled-components';
import { DropContainer, FileContainer, FileCard } from '../styles/Dropzone';
import { ActionButton } from '../styles/ActionButton';
import Modal from './Modal';
import invalidImg from '../images/invalid.png';
import { CircularProgress } from '@mui/material';
import { resizeImage } from '../resizeImage';

const CircleProgress = styled(CircularProgress)`
    & * {
        color: #f47853;
    }
`;

function CircularProgressWithLabel(props) {
    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <CircleProgress variant='determinate' size="60px" {...props} />
            <div
                style={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <p className="x-small">{`${Math.round(props.value)}%`}</p>
            </div>
        </div>
    )
}

export default function Dropzone({ client, category, disabled, updateItems }) {
    const { setError } = useError();

    const [rmbg, setRmbg] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [invalidFiles, setInvalidFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [borderColor, setBorderColor] = useState('#231f20');
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModal, setImageModal] = useState({});
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [processModalOpen, setProcessModelOpen] = useState(false);
    const [numFilesProcessed, setNumFilesProcessed] = useState(0);
    const [numProcessFiles, setNumProcessFiles] = useState(0);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [numFilesUploaded, setNumFilesUploaded] = useState(0);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const fileInputRef = useRef();

    useEffect(() => {
        const filteredArray = [...selectedFiles];
        setFilteredFiles([...filteredArray]);
        fileInputRef.current.value = null;
    }, [selectedFiles]);

    function toggleRmbg() {
        setRmbg(current => !current);
    }

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

    async function handleFiles(files) {
        setNumProcessFiles(files.length);
        setProcessModelOpen(true);

        const badFiles = [];
        const allFiles = [];
        for (let i = 0; i < files.length; i++) {
            files[i]['id'] = cuid();
            files[i]['fileSize'] = getFileSize(files[i].size);

            if (validateFile(files[i])) {
                try {
                   const file = await convertToImage(files[i]);
                   allFiles.push(file); 
                } catch (err) {
                    setError({
                        message: 'There was an error processing the files.',
                        status: 400
                    });
                }
            } else {
                files[i]['invalid'] = true;
                badFiles.push(files[i]);
                allFiles.push(files[i]);
            }

            setNumFilesProcessed(i + 1);
        }

        if (invalidFiles.length > 0) {
            setErrorMessage('File type not permitted');
        }

        setInvalidFiles(current => [...current, ...badFiles]);
        setSelectedFiles(current => [...current, ...allFiles]);

        setTimeout(() => {
            setProcessModelOpen(false);
            setNumProcessFiles(0);
            setNumFilesProcessed(0);
        }, 750);
        
    }

    function validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];

        if (validTypes.indexOf(file.type) === -1) {
            return false;
        }

        return true;
    }

    function convertToImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async function (e) {
                const fileType = file.type.split('/')[1].toUpperCase();
                try {
                    file['src'] = await resizeImage(e.target.result, fileType); 
                } catch (err) {
                    reject(err);
                }
                
                resolve(file);
            };

            reader.onerror = function (err) {
                reject(err);
            };
        });
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
        let fileIndex = filteredFiles.findIndex(item => item.id === file.id);
        let tmpFileArray = filteredFiles;
        tmpFileArray.splice(fileIndex, 1);
        setFilteredFiles([...tmpFileArray]);

        // remove file from invalid files array (if applicable)
        fileIndex = invalidFiles.findIndex(item => item.id === file.id);
        if (fileIndex !== -1) {
            tmpFileArray = invalidFiles;
            tmpFileArray.splice(fileIndex, 1);
            setInvalidFiles([...tmpFileArray]);
        }

        // remove all duplicates of file from main file array

        // get all indexes of file to remove
        const fileIndexes = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            if (selectedFiles[i].id === file.id) {
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
        setUploadModalOpen(true);

        for (const file of filteredFiles) {
            try {
                await uploadFile(file);
            } catch (err) {
                setError({
                    message: 'There was an error uploading the files.',
                    status: err.response.status
                });
                setUploadModalOpen(false);
                setNumFilesUploaded(0);
                return;
            }
            
            setNumFilesUploaded(current => current + 1);
        }

        setTimeout(() => {
            setUploadModalOpen(false);
            setNumFilesUploaded(0);
            setResultModalOpen(true);
            updateItems(true);
            setSelectedFiles([]);
            setFilteredFiles([]);
            setInvalidFiles([]);
        }, 750);
    }

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('fileSrc', file.src);
        formData.append('fullFileName', file.name);
        formData.append('clientId', client._id);
        formData.append('categoryId', category._id);
        formData.append('rmbg', rmbg);

        return new Promise(async (resolve, reject) => {
            try {
                await api.post('/files', formData, {
                    headers: { 'Content-Type': 'multipart/form-data'}
                }); 
            } catch (err) {
                reject(err);
            }

            resolve();
        });
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
            <ActionButton
                    className="tertiary small"
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={!(invalidFiles.length === 0 && filteredFiles.length) || disabled}
                >
                    Submit File(s)
            </ActionButton>
            <div className="remove-background-option">
                <label htmlFor="remove-background">
                    Remove Background
                    <input 
                        type="checkbox" 
                        id="remove-background" 
                        onChange={toggleRmbg}
                        // defaultChecked 
                    />
                </label>
            </div>
            {filteredFiles.length > 0 &&
                <FileContainer>
                    <h2 className="title">Current Files ({filteredFiles.length})</h2>
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
                                        {/* <p className="file-size">({file.fileSize})</p> */}
                                    </div>
                                </FileCard>
                            ))
                        }
                    </div>
                </FileContainer>
            }
            <Modal
                open={imageModalOpen}
                closeFn={closeImageModal}
                isImage={true}
            >
                <>
                    <button className="material-icons close-modal" onClick={closeImageModal}>close</button>
                    <img src={imageModal.src} alt={imageModal.alt} className="image-modal" />
                </>
            </Modal>
            <Modal
                open={confirmModalOpen}
                closeFn={() => setConfirmModalOpen(false)}
            >
                <div className="modal-content">
                    <p className="large bold">Are you sure you want to add these {filteredFiles.length} items to <span className="category-name large bold">{category.name}</span>?</p>
                </div>
                <div className="modal-options">
                    <button onClick={() => setConfirmModalOpen(false)}>Cancel</button>
                    <button onClick={() => { setConfirmModalOpen(false); handleSubmit(); }}>Submit</button>
                </div>
            </Modal>
            <Modal
                open={resultModalOpen}
                closeFn={() => setResultModalOpen(false)}
            >
                <div className="modal-content">
                    <p className="large bold">Items added successfully to <span className="category-name large bold">{category.name}</span>!</p>
                </div>
                <div className="modal-options">
                        <button onClick={() => setResultModalOpen(false)}>OK</button>
                </div>
            </Modal>
            <Modal
                open={processModalOpen}
            >
                <h2 className="modal-title">PROCESSING FILES</h2>
                <div className="modal-content">
                    <p className="medium">{numFilesProcessed}/{numProcessFiles} files processed...</p>
                    <CircularProgressWithLabel value={(numFilesProcessed / numProcessFiles) * 100} />
                </div>
            </Modal>
            <Modal
                open={uploadModalOpen}
            >
                <h2 className="modal-title">UPLOADING FILES</h2>
                <div className="modal-content">
                    <p className="medium">{numFilesUploaded}/{filteredFiles.length} files uploaded...</p>
                    <CircularProgressWithLabel value={(numFilesUploaded / filteredFiles.length) * 100} />
                </div>
            </Modal>
        </>
    );
}
