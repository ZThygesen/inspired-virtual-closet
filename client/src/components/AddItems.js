import { useEffect, useState } from 'react';
import api from '../api';
import { useError } from '../contexts/ErrorContext';
import { useUser } from '../contexts/UserContext';
import { useClient } from '../contexts/ClientContext';
import { useData } from '../contexts/DataContext';
import { AddItemsContainer, UploadOptionsContainer, FileContainer } from '../styles/AddItems';
import { DropdownContainer, SwapDropdown } from '../styles/Dropdown';
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

export default function AddItems({ display }) {
    const { setError } = useError();
    const { user } = useUser();
    const { client, updateClient } = useClient();
    const { categories, tags, updateItems, profile } = useData();

    const [clothesOptions, setClothesOptions] = useState([]);

    useEffect(() => {
        const theseCategories = categories.filter(category => category._id !== 0);
        const categoriesWithGroups = theseCategories.filter(category => category.group);
        const categoriesWithoutGroups = theseCategories.filter(category => !category.group);

        const groupMap = {};
        for (const category of categoriesWithGroups) {
            if (!groupMap[category.group]) {
                groupMap[category.group] = [];
            }
            groupMap[category.group].push(category);
        }
        for (const category of categoriesWithoutGroups) {
            if (!groupMap['Other']) {
                groupMap['Other'] = [];
            }
            groupMap['Other'].push(category);
        }

        const options = [{ value: 0, label: 'Other' }];
        const groups = Object.keys(groupMap).sort((a, b) => {
            if (a === 'Other' && b === 'Other') {
                return 0;
            }
            else if (a === 'Other' || b === 'Other') {
                return 1;
            }
            else if (a < b) { 
                return -1; 
            }
            else if (a > b) { 
                return 1; 
            }
            else { 
                return 0; 
            }
        });
        for (const group of groups) {
            const categoryOptions = [];
            const groupCategories = groupMap[group];
            for (const category of groupCategories) {
                categoryOptions.push({
                    value: category._id,
                    label: category.name,
                });
            }
            options.push({
                type: 'group',
                name: group,
                items: categoryOptions,
            });
        }
        setClothesOptions(options);
    }, [categories]);

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
    const [activateMassOption, setActivateMassOption] = useState(0);

    useEffect(() => {
        let badFiles = allFiles.filter(file => file.invalid);
        setInvalidFiles([...badFiles]);

        badFiles = allFiles.filter(file => file.incomplete && !file.invalid);
        setIncompleteFiles([...badFiles]);
    }, [allFiles, updateFiles, activateMassOption]);

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
        if (file.tab === 'clothes' || file.tab === 'profile') {
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
        else if (file.tab === 'profile') {

        }
        else {

        }
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

    // mass options
    const [tab, setTab] = useState('clothes');
    const [category, setCategory] = useState('');
    const [rmbg, setRmbg] = useState(true);
    const [crop, setCrop] = useState(true);
    const [massOption, setMassOption] = useState({});

    function changeTab(tab) {
        setTab(tab);
    }

    function changeCategory(category) {
        setCategory(category);
    }

    function toggleRmbg() {
        setRmbg(current => !current);
    }

    function toggleCrop() {
        setCrop(current => !current);
    }

    function applyMassOption(option) {
        switch (option) {
            case 'tab':
                setMassOption({'name': 'tab', 'option': tab});
                break;
            case 'category':
                setMassOption({'name': 'category', 'option': category});
                break;
            case 'rmbg':
                setMassOption({'name': 'rmbg', 'option': rmbg});
                break;
            case 'crop':
                setMassOption({'name': 'crop', 'option': crop});
                break;
            default:
                break;
        }
        setActivateMassOption(1);
    }
    return (
        <>
            <AddItemsContainer style={{ display: display ? 'flex' : 'none' }}>
                <h2 className="add-items-title">Add Files</h2>
                <div className="add-action-area">
                    <UploadOptionsContainer>
                        <div className="mass-options">
                            <p className="mass-options-title">Mass Options</p>
                            <div className="tab-selection">
                                <div>
                                    <p className="tab-prompt">What tab do these items belong in?</p>
                                    <Input
                                        type="radio"
                                        value={tab}
                                        radioOptions={[
                                            { value: 'clothes', label: 'Clothes' },
                                            { value: 'profile', label: 'Profile' },
                                        ]}
                                        onChange={e => changeTab(e.target.value)}
                                    />
                                </div>
                                <button className="apply-mass-option" onClick={() => applyMassOption('tab')}>Apply</button>
                            </div>
                            <DropdownContainer className="category-selection">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p className="prompt">What category do these items belong in?</p>
                                    <SwapDropdown options={clothesOptions} onChange={changeCategory} value={category} />
                                </div>
                                <button className="apply-mass-option" onClick={() => applyMassOption('category')}>Apply</button>
                            </DropdownContainer>
                            { (user?.isAdmin || user?.isSuperAdmin) &&
                                <div className="rmbg-selection">
                                    <Input
                                        type="checkbox"
                                        id="remove-background"
                                        label="Remove Background"
                                        onChange={toggleRmbg}
                                        value={rmbg}
                                    />
                                    <button className="apply-mass-option" onClick={() => applyMassOption('rmbg')}>Apply</button>
                                </div>
                            }
                            { ((user?.isAdmin || user?.isSuperAdmin) && rmbg) &&
                                <div className="crop-selection">
                                    <Input
                                        type="checkbox"
                                        id="crop-image"
                                        label="Crop Image"
                                        onChange={toggleCrop}
                                        value={crop}
                                    />
                                    <button className="apply-mass-option" onClick={() => applyMassOption('crop')}>Apply</button>
                                </div>
                            }
                        </div>
                        <div className="separator"></div>
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
                    </UploadOptionsContainer>
                    <Dropzone 
                        category={category} 
                        disabled={category._id === -1} 
                        setFiles={setAllFiles}
                    />
                </div>
                { allFiles.length > 0 &&
                    <FileContainer>
                        <h2 className="title">Current Files ({allFiles.length})</h2>
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
                                        profileCategories={profile}
                                        clothesCategories={clothesOptions}
                                        allTags={tags}
                                        massOption={massOption}
                                        activateMassOption={activateMassOption}
                                        setActivateMassOption={setActivateMassOption}
                                        updateFiles={setUpdateFiles}
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
