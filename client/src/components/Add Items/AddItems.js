import { useEffect, useState } from 'react';
import api from '../../api';
import { useError } from '../../contexts/ErrorContext';
import { useUser } from '../../contexts/UserContext';
import { useClient } from '../../contexts/ClientContext';
import { useData } from '../../contexts/DataContext';
import { AddItemsContainer, FileOptionsContainer, FileContainer } from './AddItemsStyles';
import { SwapDropdown } from '../styles/Dropdown';
import Dropzone from './Dropzone';
import FileCard from './FileCard';
import Modal from '../Modal';
import Input from '../Input';
import { ActionButton } from '../styles/ActionButton';
import styled from 'styled-components';
import { CircularProgress } from '@mui/material';
import { Tooltip } from '@mui/material';

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

export default function AddItems({ display }) {
    const { setError } = useError();
    const { user } = useUser();
    const { client, updateClient } = useClient();
    const { clothesOptions, profileOptions, getCategoryPermissions, tags, updateItems } = useData();

    const [allFiles, setAllFiles] = useState([]);
    const [invalidFiles, setInvalidFiles] = useState([]);
    const [incompleteFiles, setIncompleteFiles] = useState([]);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [uploadOneModalOpen, setUploadOneModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [numFilesUploaded, setNumFilesUploaded] = useState(0);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [hasCredits, setHasCredits] = useState(false);
    const [updateFiles, setUpdateFiles] = useState(false);

    const [addItemsModalOpen, setAddItemsModalOpen] = useState(false);
    const [massOptionsModalOpen, setMassOptionsModalOpen] = useState(false);
    const [activateMassOptions, setActivateMassOptions] = useState(0);

    useEffect(() => {
        let badFiles = allFiles.filter(file => file.invalid);
        setInvalidFiles([...badFiles]);

        badFiles = allFiles.filter(file => file.incomplete && !file.invalid);
        setIncompleteFiles([...badFiles]);
    }, [allFiles, updateFiles, activateMassOptions]);

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
            } 
            catch (err) {
                setError({
                    message: 'There was an error uploading the files.',
                    status: err?.response?.status,
                });
                setUploadModalOpen(false);
                setNumFilesUploaded(0);
                await updateItems();
                removeFile(file);
                return;
            }
            
            setNumFilesUploaded(current => current + 1);
        }

        setTimeout(async () => {
            setUploadModalOpen(false);
            setNumFilesUploaded(0);
            setResultModalOpen(true);
            await updateItems();
            setAllFiles([]);
        }, 750);
    }

    async function uploadOneFile(file) {
        setUploadOneModalOpen(true);
        try {
            await uploadFile(file);
        } 
        catch (err) {
            setError({
                message: 'There was an error uploading the file.',
                status: err?.response?.status,
            });
            setUploadOneModalOpen(false);
            setNumFilesUploaded(0);
            await updateItems();
            removeFile(file);
            return;
        }
        
        setNumFilesUploaded(current => current + 1);

        setTimeout(async () => {
            setUploadOneModalOpen(false);
            setNumFilesUploaded(0);
            setResultModalOpen(true);
            await updateItems();
            removeFile(file);
        }, 750);
    }

    async function uploadFile(file) {
        return new Promise(async (resolve, reject) => {
            try {
                const formData = new FormData();
                formData.append('categoryId', file.category.value);
                formData.append('fileSrc', file.src);
                formData.append('fullFileName', file.name);
                formData.append('tags', JSON.stringify(file.tags));
                formData.append('rmbg', file.rmbg);
                formData.append('crop', file.crop && file.rmbg);
                await api.post(`/items/${client._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } 
            catch (err) {
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

            setHasCredits(true);
        }

        checkCredits();
    }, [allFiles, client, numFilesUploaded]);

    // mass options
    const [categoriesToShow, setCategoriesToShow] = useState([]);
    const [categoryType, setCategoryType] = useState('clothes');
    const [category, setCategory] = useState('');
    const [rmbg, setRmbg] = useState(false);
    const [crop, setCrop] = useState(false);
    const [massOptions, setMassOptions] = useState({
        categoryType: 'clothes',
        category: '',
        rmbg: false,
        crop: false,
    });

    function changeCategoryType(type) {
        changeCategory('');
        setCategoryType(type);
        setMassOptions(current => ({ ...current, categoryType: type === 'profile' ? 'profile' : 'clothes' }));
    }

    function changeCategory(category) {
        setCategory(category);
        setMassOptions(current => ({ ...current, category: category }));
    }

    function changeRmbg(rmbg) {
        setRmbg(rmbg);
        setMassOptions(current => ({ ...current, rmbg: rmbg }));
    }

    function changeCrop(crop) {
        setCrop(crop);
        setMassOptions(current => ({ ...current, crop: crop }));
    }

    function applyMassOptions() {
        setActivateMassOptions(1);
    }

    useEffect(() => {
        if (!activateMassOptions) {
            closeMassOptionsModal();
        }
    }, [activateMassOptions]);

    useEffect(() => {
        if (categoryType === 'profile') {
            setCategoriesToShow(profileOptions);
        }
        else {
            setCategoriesToShow(clothesOptions);
        }
    }, [categoryType, clothesOptions, profileOptions]);

    useEffect(() => {
        const { rmbgItems } = getCategoryPermissions(category?.value);
        if (rmbgItems) {
            changeRmbg(true);
            changeCrop(true);
        }
        else {
            changeRmbg(false);
            changeCrop(false);
        }
    }, [category, getCategoryPermissions]);

    function closeMassOptionsModal() {
        setMassOptionsModalOpen(false);
        setCategoryType('clothes');
        setCategory('');
        setRmbg(false);
        setCrop(false);
        setMassOptions({
            categoryType: 'clothes',
            category: '',
            rmbg: false,
            crop: false,
        });
    }
    return (
        <>
            <AddItemsContainer style={{ display: display ? 'flex' : 'none' }}>
                <Tooltip title="Mass Options">
                    <button className="material-icons mass-options-btn" onClick={() => setMassOptionsModalOpen(true)}>settings</button>
                </Tooltip>
                <Tooltip title="Add Items">
                    <button className="material-icons add-items-btn" onClick={() => setAddItemsModalOpen(true)}>add_circle</button>
                </Tooltip>
                <h2 className="add-items-title">Add Items ({allFiles.length})</h2>
                <div className="add-action-area">
                </div>
                { !client?.isSuperAdmin &&
                    <p className="upload-credits">Upload Credits Left: {client?.credits}</p>
                }
                <ActionButton
                    className="tertiary small"
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={!(invalidFiles.length === 0 && incompleteFiles.length === 0 && allFiles.length && hasCredits)}
                    style={{ fontFamily: 'unset', letterSpacing: 'unset', fontSize: '20px', fontWeight: 600 }}
                >
                    Upload All Files
                </ActionButton>
                { allFiles.length > 0 &&
                    <FileContainer>
                        { (!hasCredits) ?
                            <p className="file-error-message">
                                You do not have enough credits to upload these files.
                            </p>
                            :
                            invalidFiles.length ?
                            <p className="file-error-message">
                                Please remove all unsupported files.
                            </p>
                            :
                            incompleteFiles.length ?
                            <p className="file-error-message">
                                There are some files with incomplete information.
                            </p>
                            :
                            ''
                        }
                        <div className="file-preview-container">
                            {
                                allFiles.map(file => (
                                    <FileCard
                                        key={file.id}
                                        file={file}
                                        uploadFile={uploadOneFile}
                                        removeFile={removeFile}
                                        clothesCategories={clothesOptions}
                                        profileCategories={profileOptions}
                                        allTags={tags}
                                        massOptions={massOptions}
                                        activateMassOptions={activateMassOptions}
                                        setActivateMassOptions={setActivateMassOptions}
                                        updateFiles={setUpdateFiles}
                                    />
                                ))
                            }
                        </div>
                    </FileContainer>
                }
            </AddItemsContainer>
            <Modal
                open={massOptionsModalOpen}
                closeFn={closeMassOptionsModal}
            >
                <h2 className="modal-title">Mass Options</h2>
                <div className="modal-content" style={{ overflowY: 'unset' }}>
                    <FileOptionsContainer>
                        <div className="file-options">
                            <div className="category-selection">
                                <p className="prompt">What category would you like to add all the items to?</p>
                                <Input
                                    type="radio"
                                    value={categoryType}
                                    radioOptions={[
                                        { value: 'clothes', label: 'Clothes' },
                                        { value: 'profile', label: 'Profile' },
                                    ]}
                                    onChange={e => changeCategoryType(e.target.value)}
                                />
                                <SwapDropdown options={categoriesToShow} onChange={changeCategory} value={category} />
                            </div>
                            { (user?.isAdmin || user?.isSuperAdmin) &&
                                <div className="rmbg-selection">
                                    <Input
                                        type="checkbox"
                                        id="remove-background"
                                        label="Remove Background"
                                        onChange={() => {
                                            if (rmbg) {
                                                changeCrop(false);
                                            }
                                            changeRmbg(!rmbg);
                                        }}
                                        value={rmbg}
                                    />
                                </div>
                            }
                            { (user?.isAdmin || user?.isSuperAdmin) &&
                                <div className={`crop-selection ${rmbg ? '' : 'disabled'}`}>
                                    <Input
                                        type="checkbox"
                                        id="crop-image"
                                        label="Crop Image"
                                        onChange={() => {
                                            if (!rmbg) {
                                                changeCrop(false);
                                            }
                                            else {
                                                changeCrop(!crop);
                                            }
                                        }}
                                        value={crop}
                                    />
                                </div>
                            }
                        </div>
                    </FileOptionsContainer>
                </div>
                <div className="modal-options">
                    <button onClick={applyMassOptions}>Apply</button>
                </div>
            </Modal>
            <Modal
                open={addItemsModalOpen}
                closeFn={() => setAddItemsModalOpen(false)}
            >
                <h2 className="modal-title">Add Items</h2>
                <div className="modal-content">
                    <Dropzone 
                        setFiles={setAllFiles}
                        closeAddItemsModal={() => setAddItemsModalOpen(false)}
                    />
                </div>
                <div className="modal-options">
                    <button onClick={() => setAddItemsModalOpen(false)}>Done</button>
                </div>
            </Modal>
            <Modal
                open={confirmModalOpen}
                closeFn={() => setConfirmModalOpen(false)}
            >
                <div className="modal-content">
                    <p className="large bold">Are you sure you want to upload {allFiles.length === 1 ? "this file" : `these ${allFiles.length} files`}?</p>
                    { !client?.isSuperAdmin && 
                        <p className="medium warning">You have {client?.credits} credits left.</p> 
                    }
                </div>
                <div className="modal-options">
                    <button onClick={() => setConfirmModalOpen(false)}>Cancel</button>
                    <button onClick={() => { setConfirmModalOpen(false); handleSubmit(); }}>Upload</button>
                </div>
            </Modal>
            <Modal
                open={uploadOneModalOpen}
            >
                <h2 className="modal-title">Uploading File</h2>
                <div className="modal-content">
                    <p className="medium">{numFilesUploaded}/1 file uploaded...</p>
                    <CircularProgressWithLabel value={(numFilesUploaded / 1) * 100} />
                    { !client?.isSuperAdmin &&
                        <p className="medium">{client?.credits} Credits Left</p>
                    }
                </div>
            </Modal>
            <Modal
                open={uploadModalOpen}
            >
                <h2 className="modal-title">Uploading Files</h2>
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
                    <p className="large bold">Items added successfully!</p>
                </div>
                <div className="modal-options">
                        <button onClick={() => setResultModalOpen(false)}>OK</button>
                </div>
            </Modal>
        </>
    );
}
