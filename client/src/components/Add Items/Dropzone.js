import { useRef, useState } from 'react';
import { useError } from '../../contexts/ErrorContext';
import cuid from 'cuid';
import styled from 'styled-components';
import { DropContainer } from '../styles/Dropzone';
import Modal from '../Modal';
import { CircularProgress } from '@mui/material';
import { resizeImage } from '../../resizeImage';

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

export default function Dropzone({ setFiles }) {
    const { setError } = useError();

    const [borderColor, setBorderColor] = useState('#231f20');
    const [processModalOpen, setProcessModelOpen] = useState(false);
    const [numFilesProcessed, setNumFilesProcessed] = useState(0);
    const [numProcessFiles, setNumProcessFiles] = useState(0);
    const fileInputRef = useRef();

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

        const allFiles = [];
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let invalid = false;
            if (validateFile(file)) {
                try {
                   file = await convertToImage(file);
                } catch (err) {
                    setError({
                        message: 'There was an error processing the files.',
                        status: 400
                    });
                }
            } else {
                invalid = true;
            }

            allFiles.push({
                id: cuid(),
                tab: 'clothes',
                category: '',
                tags: [],
                rmbg: true,
                crop: true,
                name: file.name,
                src: file.src,
                type: file.type,
                fileSize: getFileSize(file.size),
                invalid: invalid,
                incomplete: true
            });

            setNumFilesProcessed(i + 1);
        }

        setFiles(current => [...current, ...allFiles]);
        fileInputRef.current.value = null;

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

    function fileInputClicked() {
        fileInputRef.current.click();
    }

    function fileSelected() {
        if (fileInputRef.current.files.length) {
            handleFiles(fileInputRef.current.files);
        }
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
            <Modal
                open={processModalOpen}
            >
                <h2 className="modal-title">Processing Files</h2>
                <div className="modal-content">
                    <p className="medium">{numFilesProcessed}/{numProcessFiles} files processed...</p>
                    <CircularProgressWithLabel value={(numFilesProcessed / numProcessFiles) * 100} />
                </div>
            </Modal>
        </>
    );
}
