import { useEffect, useRef, useState } from 'react';
import { Button } from '@mui/material';
import { Close } from '@mui/icons-material';
import styled from 'styled-components';
import axios from 'axios'
import cuid from 'cuid';
import Loading from './Loading';
import ImageModal from './ImageModal';
import uploadImg from '../images/upload.svg';
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

    .upload-icon {
        width: 80px;
        height: 80px;
        background: url(${uploadImg}) no-repeat center center;
        background-size: 100%;
        padding-bottom: 20px;
    }

    p {
        text-align: center;
        margin-bottom: 10px;
        font-size: 28px;
    }

    button {
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
    }

    .file-input {
        display: none;
    }
`;

const FileContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    width: 100%;
    box-sizing: border-box;

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
        top: 3px;
        right: 3px;
        cursor: pointer;
        color: var(--black);
        border-radius: 50%;
        transition: all 0.1s;

        &:hover {
            transform: scale(1.12);
        }
    }
`;

export default function Dropzone() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [invalidFiles, setInvalidFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [borderColor, setBorderColor] = useState('#231f20');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModal, setImageModal] = useState({});
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
        closeUploadModal();
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

    function closeUploadModal() {
        setUploadModalOpen(false);
    }

    /* function testDelete() {
        axios.delete('/delete-files');
    } */

    return (
        <>
            {/* <Button onClick={testDelete}>Test Delete</Button> */}
            {invalidFiles.length === 0 && filteredFiles.length ? <Button onClick={handleSubmit} variant="contained">Submit File(s)</Button> : ''}
            <DropContainer style={{ border: `4px dashed ${borderColor}` }}
                onDragOver={dragOver}
                onDragEnter={dragEnter}
                onDragLeave={dragLeave}
                onDrop={fileDrop}
            >
                <div className="upload-icon"></div>
                <p>Drag & drop file(s) here</p>
                <p>or</p>
                <button onClick={fileInputClicked} variant="contained">
                    <input
                        ref={fileInputRef}
                        className="file-input"
                        type="file"
                        multiple
                        onChange={fileSelected}
                    />
                    Click to Upload
                </button>
            </DropContainer>
            <FileContainer>
                <p>Files</p>
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
            <ImageModal open={imageModalOpen} image={imageModal} closeModal={closeModal} />
            <Loading open={uploadModalOpen} />
        </>
    );
}
