import { useEffect, useRef, useState } from 'react';
import { Modal } from '@mui/material';
import { Close } from '@mui/icons-material';
import styled from 'styled-components';
import axios from 'axios'
import cuid from 'cuid';
import Loading from './Loading';
import ImageModal from './ImageModal';
import uploadImg from '../images/upload.png';
import invalidImg from '../images/invalid.png';

const DropContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 800px;
    box-sizing: border-box;
    padding: 30px;
    margin-bottom: 15px;

    .upload-icon {
        width: 80px;
        height: 80px;
        background: url(${uploadImg}) no-repeat center center;
        background-size: 100%;
        padding-bottom: 20px;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            transform: scale(1.05);
        }
    }

    p {
        text-align: center;
        margin-bottom: 10px;
        font-size: 28px;
    }

    .click-upload {
        color: var(--secondary);
        font-weight: bold;
        background: none;
        border: none;
        width: 100%;
        cursor: pointer;
        position: relative;

        &:after {
            content: '';
            position: absolute;
            width: 100%;
            transform: scaleX(0);
            height: 2px;
            bottom: 0;
            left: 0;
            background-color: var(--secondary);
            transform-origin: bottom right;
            transition: transform 0.15s ease-out;
        }

        &.active {
            &:after {
                transform: scaleX(1);
            }

        }

        &:not(.active):hover:after {
            transform: scaleX(1);
            transform-origin: bottom left;
        }
    }

    .file-input {
        display: none;
    }
`;

const Button = styled.button`
    background: none;
    border: 2px solid var(--black);
    border-radius: 25px;
    font-family: 'Fashion';
    font-size: 28px;
    background-color: var(--primary-light);
    color: var(--black);
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.1s;

    &:hover {
        background-color: var(--primary);
    }

    &:disabled, &:disabled:hover {
        background-color: var(--grey);
        color: var(--black);
        cursor: default;
    }
`;

const FileContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px;
    margin-top: 15px;
    width: 100%;
    box-sizing: border-box;
    background-color: var(--grey);
    border: 2px solid var(--black);
    border-radius: 25px;

    .title {
        text-decoration: underline;
        font-weight: bold;
    }

    p {
        text-align: center;
        margin-bottom: 10px;
        font-size: 28px;
    }

    .file-preview-container {
        width: 100%;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 20px;
    }

    .file-error-message {
        color: #cc2d2d;
        margin: 15px 0;
        font-size: 20px;
        font-weight: bold;
        text-decoration: underline;
    }
`;

const FileCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--primary-light);
    padding: 15px;
    border-radius: 25px;
    position: relative;
    width: 230px;
    box-sizing: border-box;
    box-shadow: var(--file-card-shadow);
    
    .file-img {
        background: transparent;
        width: 150px;
        height: auto;
        border: 1px solid var(--black);
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.1s;

        &:not(.invalid):hover {
            border-color: var(--primary);
        }
    }

    .file-img.invalid {
        border: none;
    }

    .file-name {
        color: var(--black);
        font-size: 24px;
        font-weight: bold;
        margin-top: 10px;
        max-width: 200px;
        word-wrap: break-word;
    }

    .file-size {
        color: var(--black);
        font-size: 20px;

    }

    .file-remove {
        position: absolute;
        top: 7px;
        right: 7px;
        cursor: pointer;
        color: var(--black);
        border-radius: 50%;
        transition: all 0.1s;

        &:hover {
            transform: scale(1.12);
        }
    }
`;

const ModalContent = styled.div`
    font-family: 'Fashion';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background-color: var(--white);
    border: 2px solid var(--black);
    border-radius: 20px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40px;

    p {
        font-size: 32px;
        font-weight: bold;
        text-align: center;
    }

    .category {
        color: var(--secondary);
        text-decoration: underline;
    }

    .modal-options {
        display: flex;
        gap: 50px;
    }

    button {
        background: none;
        border: 1px solid var(--black);
        width: 100%;
        border-radius: 8px;
        padding: 12px;
        font-family: 'Fashion';
        font-size: 24px;
        transition: all 0.1s;
        cursor: pointer;

        &:hover {
            background-color: var(--secondary);
            border-color: var(--secondary);
            color: var(--white);
        }
    }
`;

export default function Dropzone({ category }) {
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
    //const [submitError, setSubmitError] = useState(false);
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
        const res = await axios.post('/upload-files', { files: files });
        console.log(res);
        setUploadModalOpen(false);
        setResultModalOpen(true);
    }

    // TODO: Functionality to upload/send files to backend
    async function uploadFiles() {
        const files = [];
        for (let i = 0; i < filteredFiles.length; i++) {
            const formData = new FormData();
            formData.append('image', filteredFiles[i]);
            formData.append('key', process.env.REACT_APP_IMGBB_API_KEY);
            const res = await axios.post('https://api.imgbb.com/1/upload', formData);
            console.log(res.data.data)
            files.push({
                clientId: 'clientId',
                categoryId: 'categoryId',
                fileName: res.data.data.title,
                fileUrl: res.data.data.url,
                fileId: res.data.data.id,
                delete_url: res.data.data.delete_url
            });
        }
        
        return files;
    }

    function openImageModal(file) {
        setImageModalOpen(current => !current);
        setImageModal({ src: file.src, alt: file.name });
    }

    function closeModal() {
        setImageModalOpen(false);
        setImageModal({});
    }

    /* function testDelete() {
        axios.delete('/delete-files');
    } */

    return (
        <>
            {/* <Button onClick={testDelete}>Test Delete</Button> */}
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
            </DropContainer>
            <Button
                    className="submit"
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={!(invalidFiles.length === 0 && filteredFiles.length)}
                >
                    Submit File(s)
            </Button>
            {filteredFiles.length > 0 &&
                <FileContainer>
                    <p className="title">Current Files</p>
                    {invalidFiles.length ?
                        <p
                            className="file-error-message"
                            style={{ margin: '0 0 15px' }}
                        >
                            Please remove all unsupported files.
                        </p> : ''
                    }
                    <div className="file-preview-container">
                        {
                            filteredFiles.map(file => (
                                <FileCard key={file.id}>
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
                                    <div className="file-remove" onClick={() => removeFile(file)}><Close /></div>
                                </FileCard>
                            ))
                        }
                    </div>
                </FileContainer>
            }
            <ImageModal open={imageModalOpen} image={imageModal} closeModal={closeModal} />
            <Loading open={uploadModalOpen} />
            <Modal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
            >
                <ModalContent>
                    <p>Are you sure you want to add these items to <span className="category">{category}</span>?</p>
                    <div className="modal-options">
                        <button onClick={() => setConfirmModalOpen(false)}>Cancel</button>
                        <button onClick={() => { setConfirmModalOpen(false); handleSubmit(); }}>Submit</button>
                    </div>
                </ModalContent>
            </Modal>
            <Modal
                open={resultModalOpen}
                onClose={() => setResultModalOpen(false)}
            >
                <ModalContent>
                    <p>Items added successfully to {category}!</p>
                    <div className="modal-options">
                        <button onClick={() => setResultModalOpen(false)}>OK</button>
                    </div>
                </ModalContent>
            </Modal>
        </>
    );
}
