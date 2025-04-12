import { useEffect, useState } from 'react';
import api from '../api';
import { useError } from './ErrorContext';
import { useUser } from './UserContext';
import { useClient } from './ClientContext';
import { useSidebar } from './SidebarContext';
import { AddItemsContainer, UploadOptionsContainer, FileContainer } from '../styles/AddItems';
import Dropzone from './Dropzone';
import FileCard from './FileCard';
import Modal from './Modal';
import Input from './Input';
import { ActionButton } from '../styles/ActionButton';
import styled from 'styled-components';
import { CircularProgress } from '@mui/material';

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

export default function AddItems({ display, category, updateItems }) {
    const { setError } = useError();
    const { user } = useUser();
    const { client, updateClient } = useClient();
    const { setSidebarOpen } = useSidebar();

    const [allFiles, setAllFiles] = useState([]);
    const [invalidFiles, setInvalidFiles] = useState([]);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [numFilesUploaded, setNumFilesUploaded] = useState(0);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [hasCredits, setHasCredits] = useState(false);

    const [rmbg, setRmbg] = useState(true);
    const [crop, setCrop] = useState(true);

    useEffect(() => {
        const badFiles = allFiles.filter(file => file.invalid);
        setInvalidFiles(current => [...current, ...badFiles]);
    }, [allFiles]);

    function removeFile(file) {
        // remove image from DOM immediately to prevent delay
        document.getElementById(file.id).remove();

        const filteredFiles = [];
        for (let i = 0; i < allFiles.length; i++) {
            if (allFiles[i].id !== file.id) {
                filteredFiles.push(allFiles[i]);
            }
        }
        setAllFiles([...filteredFiles]);
    }

    async function handleSubmit() {
        setUploadModalOpen(true);

        for (const file of allFiles) {
            try {
                await uploadFile(file);
            } catch (err) {
                setError({
                    message: 'There was an error uploading the files.',
                    status: err.response.status
                });
                setUploadModalOpen(false);
                setNumFilesUploaded(0);
                updateItems(true);
                setAllFiles([]);
                setInvalidFiles([]);
                return;
            }
            
            setNumFilesUploaded(current => current + 1);
        }

        setTimeout(() => {
            setUploadModalOpen(false);
            setNumFilesUploaded(0);
            setResultModalOpen(true);
            updateItems(true);
            setAllFiles([]);
            setInvalidFiles([]);
        }, 750);
    }

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('fileSrc', file.src);
        formData.append('fullFileName', file.name);
        formData.append('categoryId', category._id);
        formData.append('rmbg', rmbg);
        formData.append('crop', crop && rmbg);

        return new Promise(async (resolve, reject) => {
            try {
                await api.post(`/files/${client._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data'}
                }); 
            } catch (err) {
                reject(err);
            }

            await updateClient();
            resolve();
        });
    }

    useEffect(() => {
        function checkCredits() {
            if (client?.isSuperAdmin) {
                setHasCredits(true);
                return;
            }
            
            if (!client?.credits) {
                setHasCredits(false);
                return;
            }

            if (allFiles.length - numFilesUploaded > client?.credits) {
                setHasCredits(false);
                return;
            } 

            setHasCredits(true)
            
        }

        checkCredits();
    }, [allFiles, client, numFilesUploaded]);

    function toggleRmbg() {
        setRmbg(current => !current);
    }

    function toggleCrop() {
        setCrop(current => !current);
    }

    return (
        <>
            <AddItemsContainer style={{ display: display ? 'flex' : 'none' }}>
                <div className="category-select">
                    {
                        (category._id === -1) ?
                            <>
                                <h2 className="add-item-title error">Cannot add items to <span className="category error" onClick={() => setSidebarOpen(true)}>{category.name}</span></h2> 
                                <p className="help-info">(select a specific category you want to add items to)</p>
                            </>
                            :
                            <>
                                <h2 className="add-item-title">Add items to <span className="category" onClick={() => setSidebarOpen(true)}>{category.name}</span></h2>
                                <p className="help-info">(select the category you want to add items to from the sidebar)</p>
                            </>
                    }
                </div>
                <Dropzone 
                    category={category} 
                    disabled={category._id === -1} 
                    updateItems={updateItems} 
                    setFiles={setAllFiles}
                />
                <div className="mass-options">
                    <UploadOptionsContainer>
                        { !client?.isSuperAdmin &&
                            <p className="upload-credits">Upload Credits Left: {client?.credits}</p>
                        }
                        <ActionButton
                                className="tertiary small"
                                onClick={() => setConfirmModalOpen(true)}
                                disabled={!(invalidFiles.length === 0 && allFiles.length && hasCredits)}
                            >
                                Submit File(s)
                        </ActionButton>
                        { (user?.isAdmin || user?.isSuperAdmin) && 
                            <Input 
                                type="checkbox" 
                                id="remove-background"
                                label="Remove Background" 
                                onChange={toggleRmbg}
                                value={rmbg}
                            />   
                        }
                        { ((user?.isAdmin || user?.isSuperAdmin) && rmbg) && 
                            <Input 
                                type="checkbox" 
                                id="crop-image"
                                label="Crop Image" 
                                onChange={toggleCrop}
                                value={crop}
                            />   
                        }
                    </UploadOptionsContainer>
                </div>
                { allFiles.length > 0 &&
                    <FileContainer>
                        <h2 className="title">Current Files ({allFiles.length})</h2>
                        { (!hasCredits) ?
                            <p className="file-error-message">
                                You do not have enough credits to upload these files.
                            </p> : ''
                        }
                        { invalidFiles.length ?
                            <p className="file-error-message">
                                Please remove all unsupported files.
                            </p> : ''
                        }
                        <div className="file-preview-container">
                            {
                                allFiles.map(file => (
                                    <FileCard
                                        key={file.id}
                                        file={file}
                                        removeFile={removeFile}
                                    />
                                ))
                            }
                        </div>
                    </FileContainer>
                }
            </AddItemsContainer>
            <Modal
                open={confirmModalOpen}
                closeFn={() => setConfirmModalOpen(false)}
            >
                <div className="modal-content">
                    <p className="large bold">Are you sure you want to add these {allFiles.length} items to <span className="category-name large bold">{category.name}</span>?</p>
                    { (user?.isSuperAdmin || user?.isAdmin) &&
                    <>
                        <p className="medium">The background WILL {rmbg ? '' : 'NOT'} be removed.</p>
                        { rmbg &&
                            <p className="medium">The image WILL {crop ? '' : 'NOT'} be cropped.</p>

                        }
                        <Input 
                            type="checkbox" 
                            id="remove-background"
                            label="Remove Background" 
                            onChange={toggleRmbg}
                            value={rmbg}
                        />
                        { (rmbg) &&
                            <Input 
                                type="checkbox" 
                                id="crop-image"
                                label="Crop Image" 
                                onChange={toggleCrop}
                                value={crop}
                            />
                        }
                    </>
                    }
                    { !client?.isSuperAdmin && 
                        <p className="medium warning">You have {client?.credits} credits left.</p> 
                    }
                </div>
                <div className="modal-options">
                    <button onClick={() => setConfirmModalOpen(false)}>Cancel</button>
                    <button onClick={() => { setConfirmModalOpen(false); handleSubmit(); }}>Submit</button>
                </div>
            </Modal>
            <Modal
                open={uploadModalOpen}
            >
                <h2 className="modal-title">UPLOADING FILES</h2>
                <div className="modal-content">
                    <p className="medium">{numFilesUploaded}/{allFiles.length} files uploaded...</p>
                    <CircularProgressWithLabel value={(numFilesUploaded / allFiles.length) * 100} />
                    { !client?.isSuperAdmin &&
                        <p className="medium">{client?.credits} Credits Left</p>
                    }
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
        </>
    );
}
