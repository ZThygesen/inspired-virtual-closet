import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useClient } from '../contexts/ClientContext';
import { FileCardContainer } from '../styles/AddItems';
import Modal from './Modal';
import Input from './Input';
import { DropdownContainer, SwapDropdown } from '../styles/Dropdown';
import invalidImg from '../images/invalid.png';

export default function FileCard({ 
    file, 
    uploadFile, 
    removeFile, 
    profileCategories, 
    clothesCategories, 
    allTags, 
    massOption, 
    activateMassOption, 
    setActivateMassOption, 
    updateItems 
}) {
    const { user } = useUser();
    const { client } = useClient();

    const [tab, setTab] = useState('clothes');
    const [category, setCategory] = useState('');
    const [name, setName] = useState(file.name);
    const [tags, setTags] = useState([]);
    const [activeTagObjects, setActiveTagObjects] = useState([]);
    const [rmbg, setRmbg] = useState(file.rmbg);
    const [crop, setCrop] = useState(file.crop);

    const [incompleteMessage, setIncompleteMessage] = useState('');
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [tagModalOpen, setTagModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    useEffect(() => {
        if (activateMassOption) {
            switch (massOption.name) {
                case 'tab':
                    setTab(massOption.option);
                    file.tab = massOption.option;
                    break;
                case 'category':
                    setCategory(massOption.option);
                    file.category = massOption.option;
                    break;
                case 'rmbg':
                    setRmbg(massOption.option);
                    file.rmbg = massOption.option;
                    break;
                case 'crop':
                    setCrop(massOption.option);
                    file.crop = massOption.option;
                    break;
                default:
                    break;
            }
            setActivateMassOption(0);
        }
    }, [massOption, activateMassOption, setActivateMassOption, file]);

    function changeTab(tab) {
        setTab(tab);
        file.tab = tab;
    }

    function changeCategory(category) {
        setCategory(category);
        file.category = category;
    }

    function changeTags(checkbox) {
        let updatedTags = [];
        const tagId = checkbox.id;
        if (tags.includes(tagId)) {
            updatedTags = tags.filter(tag => tag !== tagId);
        }
        else {
            updatedTags = [...tags, tagId];
        }

        setTags(updatedTags);
        file.tags = updatedTags;
    }

    function changeName(name) {
        setName(name);
        file.name = name;
    }

    function toggleRmbg() {
        const checked = rmbg;
        setRmbg(!checked);
        file.rmbg = !checked;
    }

    function toggleCrop() {
        const checked = crop;
        setCrop(!checked);
        file.crop = !checked;
    }

    function openImageModal() {
        setImageModalOpen(true);
    }

    function closeImageModal() {
        setImageModalOpen(false);
    }

    function openTagModal() {
        setTagModalOpen(true);
    }

    function closeTagModal() {
        setTagModalOpen(false);
    }

    useEffect(() => {
        const activeTagObjects = [];
        allTags.forEach(tagGroup => {
            const activeTags = tagGroup.tags.filter(tag => tags.includes(tag.tagId));
            if (activeTags.length > 0) {
                activeTagObjects.push(...activeTags);
            }
        });
        setActiveTagObjects(activeTagObjects);
    }, [tags, allTags]);

    function handleUploadFile(e) {
        e.preventDefault();
        if (!file.invalid && !file.incomplete) {
            setConfirmModalOpen(true);
        }
    }

    useEffect(() => {
        if (file.tab !== 'clothes' && file.tab !== 'profile') {
            file.incomplete = true;
            setIncompleteMessage('A tab must be selected');
        }
        else if (file.category === '') {
            file.incomplete = true;
            setIncompleteMessage('A category must be selected');
        }
        else if (file.name === '') {
            file.incomplete = true;
            setIncompleteMessage('The item must have a name');
        }
        else {
            file.incomplete = false;
            setIncompleteMessage('');
        }
        updateItems(current => !current);
    }, [file, tab, category, name, updateItems]);

    return (
        <>
            <FileCardContainer className={`${file.invalid || file.incomplete ? 'error' : ''}`}>
                <form onSubmit={handleUploadFile}>
                    <button type="button" className="material-icons file-remove" onClick={() => removeFile(file)}>close</button>
                    <div className="feedback">
                        {file.invalid && <div className="file-error-message">File type not permitted</div>}
                        {file.incomplete && <div className="file-error-message">{incompleteMessage}</div>}
                    </div>
                    <div className="file-action-area">
                        <div className="file-options">
                            <p className="options-prompt">Options</p>
                            <div className="tab-selection">
                                <p className="tab-prompt">Item Tab</p>
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
                            <DropdownContainer>
                                <p className="prompt">Item Category</p>
                                <SwapDropdown options={clothesCategories} onChange={changeCategory} value={category} />
                            </DropdownContainer>
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
                        </div>
                        <div className="file-info">
                            <p className="info-prompt">Item Info</p>
                            <Input
                                type="text"
                                id={file.id}
                                label="Name"
                                value={name ?? ''}
                                onChange={e => changeName(e.target.value)}
                            />
                            <div className="file-card-img">
                                <img
                                    src={file.invalid ? invalidImg : file.src}
                                    alt={file.name}
                                    id={file.id}
                                    className={`file-img ${file.invalid ? 'invalid' : ''}`}
                                    onClick={!file.invalid ? () => openImageModal() : () => removeFile(file)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="tags-container">
                        <p className="tags-prompt">Tags</p>
                        <div className="tags">
                            {
                                activeTagObjects.map(tag => (
                                    <div className="tag" key={tag.tagId}>
                                        <p className="tag-name">{tag.tagName}</p>
                                        <div className="tag-color" style={{ backgroundColor: tag.tagColor }}></div>
                                    </div>
                                ))
                            }
                        </div>
                        <button className="add-tags-button" type="button" onClick={openTagModal}>Edit Tags</button>
                    </div>
                    <button 
                        type="submit" 
                        className="upload-file-button"
                        disabled={file.invalid || file.incomplete}
                    >
                        Upload File
                    </button>
                </form>
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
            <Modal
                open={tagModalOpen}
                closeFn={closeTagModal}
            >
                <>
                    <h2 className="modal-title">ADD TAGS</h2>
                    <div className="modal-content">
                        <div className="file-card-img">
                            <img
                                src={file.invalid ? invalidImg : file.src}
                                alt={file.name}
                                id={file.id}
                                className={`file-img ${file.invalid ? 'invalid' : ''}`}
                                onClick={!file.invalid ? () => openImageModal() : () => removeFile(file)}
                            />
                        </div>
                        <div className="tag-checkboxes">
                            <div className="tag-groups">
                                {
                                    allTags.map(group => (
                                        (
                                            group.tags.length > 0 && 
                                            <div className="tag-group" key={group._id}>
                                                <p className="tag-group-name">{group.tagGroupName}</p>
                                                <div className="tags">
                                                    {
                                                        group.tags.map(tag => (
                                                            <div className={`tag ${tags.includes(String(tag.tagId)) ? 'checked' : ''}`} key={tag.tagId}>
                                                                <Input
                                                                    type="checkbox"
                                                                    id={`${tag.tagId}`}
                                                                    label={tag.tagName}
                                                                    value={tags.includes(String(tag.tagId))}
                                                                    onChange={e => changeTags(e.target)}
                                                                />
                                                                <div className="tag-color" style={{ backgroundColor: tag.tagColor }}></div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <div className="modal-options">
                        <button onClick={closeTagModal}>Done</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={confirmModalOpen}
                closeFn={() => setConfirmModalOpen(false)}
            >
                <div className="modal-content">
                    <p className="large bold">Are you sure you want to upload this file?</p>
                    { !client?.isSuperAdmin && 
                        <p className="medium warning">You have {client?.credits} credits left.</p> 
                    }
                </div>
                <div className="modal-options">
                    <button onClick={() => setConfirmModalOpen(false)}>Cancel</button>
                    <button onClick={() => { setConfirmModalOpen(false); uploadFile(file); }}>Upload</button>
                </div>
            </Modal>
        </>
    );
}