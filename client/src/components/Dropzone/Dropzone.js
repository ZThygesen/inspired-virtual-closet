import { useEffect, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import cuid from 'cuid';
import './Dropzone.css';

export default function Dropzone() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [invalidFiles, setInvalidFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [borderColor, setBorderColor] = useState('#4aa1f3');
    const fileInputRef = useRef();
    const imageModalRef = useRef();
    const modalRef = useRef();

    useEffect(() => {
        const filteredArray = [...new Map(selectedFiles.map(file => [file.name, file])).values()];
        setFilteredFiles([...filteredArray]);
    }, [selectedFiles]);


    function dragOver(e) {
        e.preventDefault();
        setBorderColor('green')
    }

    function dragEnter(e) {
        e.preventDefault();
    }

    function dragLeave(e) {
        e.preventDefault();
        setBorderColor('#4aa1f3');
    }

    function fileDrop(e) {
        e.preventDefault();
        setBorderColor('#4aa1f3');
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

    // TODO: Functionality to upload/send files to backend
    function uploadFiles() {

    }

    function openImageModal(file) {
        modalRef.current.style.display = 'block';
        imageModalRef.current.style.backgroundImage = `url(${file.src})`;
    }

    function closeModal() {
        modalRef.current.style.display = 'none';
        imageModalRef.current.style.backgroundImage = 'none';
    }

    return (
        <>
            {invalidFiles.length === 0 && filteredFiles.length ? <Button onClick={uploadFiles} variant="contained">Submit File(s)</Button> : ''}
            {invalidFiles.length ? <p>Please remove all unsupported files.</p> : ''}
            <div className="drop-container" style={{ border: `4px dashed ${borderColor}` }}
                onDragOver={dragOver}
                onDragEnter={dragEnter}
                onDragLeave={dragLeave}
                onDrop={fileDrop}
            >
                <div className="drop-message">
                    <div className="upload-icon"></div>
                    <p>Drag & drop file(s) here or click to upload</p>
                    <Button onClick={fileInputClicked} variant="contained">
                        <input
                            ref={fileInputRef}
                            className="file-input"
                            type="file"
                            multiple
                            onChange={fileSelected}
                        />
                        Click to Upload
                    </Button>
                </div>
            </div>
            <div className="file-display-container">
                {
                    filteredFiles.map(file => (
                        <Box key={file.id}>
                            <img
                                src={file.src}
                                alt={file.name}
                                className="file-img"
                                id={file.id}
                                onClick={!file.invalid ? () => openImageModal(file) : () => removeFile(file)}
                            />
                            <div>
                                <span className={`file-name ${file.invalid ? 'file-error' : ''}`}>{file.name}</span>
                                <span className="file-size">({file.fileSize})</span> {file.invalid && <span className="file-error-message">{errorMessage}</span>}
                            </div>
                            <div className="file-remove" onClick={() => removeFile(file)}>X</div>
                        </Box>
                    ))
                }
            </div>
            <div className="modal" ref={modalRef}>
                <div className="overlay"></div>
                <span className="close" onClick={closeModal}>X</span>
                <div className="modal-image" ref={imageModalRef}></div>
            </div>
        </>
    );
}
