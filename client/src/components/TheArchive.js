import { useCallback, useEffect, useState } from 'react';
import { useError } from '../components/ErrorContext';
import api from '../api'
import cuid from 'cuid';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { Tooltip } from '@mui/material';
import { TheArchiveContainer } from '../styles/TheArchive';

export default function TheArchive() {
    const { setError } = useError();

    const [activeArchiveTab, setActiveArchiveTab] = useState(0);
    const archiveTabs = [
        { name: 'Tags' },
    ];

    const [tagGroups, setTagGroups] = useState([]);

    const [owningTagGroup, setOwningTagGroup] = useState({});
    const [tagToUnarchive, setTagToUnarchive] = useState({});
    const [tagToDelete, setTagToDelete] = useState({});
    const [unarchiveTagOpen, setUnarchiveTagOpen] = useState(false);
    const [deleteTagOpen, setDeleteTagOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    // Tag management
    const getTagGroups = useCallback(async () => {
        setLoading(true);

        try {
            const response = await api.get('/tags/archived');
            const tagData = response.data;

            tagData.forEach(tagGroup => {
                tagGroup.tags.sort(function(a, b) {
                    if (a.tagName < b.tagName) {
                        return -1;
                    }
                    else if (a.tagName > b.tagName) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            });

            tagData.sort(function(a, b) {
                if (a?.sortOrder === undefined) return 1;
                if (b?.sortOrder === undefined) return -1;

                return a.sortOrder - b.sortOrder;
            });

            setTagGroups(tagData);
        } catch (err) {
            setError({
                message: 'There was an error fetching tags.',
                status: err?.response?.status || 'N/A'
            });
            setLoading(false);
        }

        setLoading(false);
    }, [setError]);

    useEffect(() => {
        getTagGroups();
    }, [getTagGroups]);

    // unarchiving tags
    async function unarchiveTag() {
        setLoading(true);
        try {
            await api.patch(`/tags/recover-tag/${owningTagGroup._id}/${tagToUnarchive.tagId}`);
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error unarchiving the tag.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseUnarchiveTag();
    }
    function handleOpenUnarchiveTag(tagGroup, tag) {
        setOwningTagGroup(tagGroup);
        setTagToUnarchive(tag);
        setUnarchiveTagOpen(true);
    }

    function handleCloseUnarchiveTag() {
        setOwningTagGroup({});
        setTagToUnarchive({});
        setUnarchiveTagOpen(false);
    }

    // deleting tags
    async function deleteTag() {
        setLoading(true);
        try {
            await api.delete(`/tags/tag/${owningTagGroup._id}/${tagToDelete.tagId}`);
            await getTagGroups();
        } catch (err) {
            setError({
                message: 'There was an error deleting the tag.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }

        handleCloseDeleteTag();
    }

    function handleOpenDeleteTag(tagGroup, tag) {
        setOwningTagGroup(tagGroup);
        setTagToDelete(tag);
        setDeleteTagOpen(true);
    }

    function handleCloseDeleteTag() {
        setOwningTagGroup({});
        setTagToDelete({});
        setDeleteTagOpen(false);
    }

    return (
        <>
            <TheArchiveContainer>
                <div className="archive-tabs">
                    <ul>
                        {
                            archiveTabs.map((tab, index) => (
                                <li key={cuid()} className={ index === activeArchiveTab ? 'active' : '' }>
                                    <button
                                        className={ index === activeArchiveTab ? 'archive-tab active' : 'archive-tab' }
                                        onClick={() => setActiveArchiveTab(index)}
                                    >
                                        <p className="archive-tab-text">{tab.name}</p>
                                    </button>
                                </li>
                            ))
                        }
                    </ul>
                </div>
                <div className="archive-container">
                    <div className="archived-tags" style={{ display: activeArchiveTab === 0 ? 'flex' : 'none' }}>
                        <div className="tag-groups">
                            { tagGroups.length > 0 ?
                                tagGroups.map((tagGroup, index) => (
                                    <div className="tag-group-container" key={index}>
                                        <div className="tag-group-setting">
                                            <div className="tag-group-name">
                                                <p className="tag-group">{tagGroup.tagGroupName}</p>
                                            </div>
                                        </div>
                                        <div className="tags">
                                            {
                                                tagGroup?.tags?.map(tag => (
                                                    <div className="tag-setting" key={cuid()}>
                                                        <div className="tag-display">
                                                            <div className="tag-color" style={{ backgroundColor: `${tag.tagColor}` }}></div>
                                                            <p className="tag">{tag.tagName}</p>
                                                        </div>
                                                        <Tooltip title="Unarchive" placement="left">
                                                            <button className="material-icons tag-option-btn" onClick={() => handleOpenUnarchiveTag(tagGroup, tag)}>unarchive</button>
                                                        </Tooltip>
                                                        <Tooltip title="Delete" placement="right">
                                                            <button className="material-icons tag-option-btn" onClick={() => handleOpenDeleteTag(tagGroup, tag)}>delete</button>
                                                        </Tooltip>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                ))
                                :
                                <p className="no-archived">There are no archived tags!</p>
                            }
                        </div>
                    </div>
                </div>
            </TheArchiveContainer>
            <Loading open={loading} />
            <Modal
                open={unarchiveTagOpen}
                closeFn={handleCloseUnarchiveTag}
            >
                <>
                    <h2 className="modal-title">Unarchive Tag</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to unarchive this tag?</p>
                        <p className="large bold underline">{tagToUnarchive?.tagName}</p>
                        {/* <p className="small bold warning">The tags in this group will stay active in this group. You can change their group after archiving this group.</p> */}
                    </div>
                    <div className="modal-options">
                        <button onClick={handleCloseUnarchiveTag}>Cancel</button>
                        <button onClick={unarchiveTag}>Unarchive</button>
                    </div>
                </>
            </Modal>
            <Modal
                open={deleteTagOpen}
                closeFn={handleCloseDeleteTag}
            >
                <>
                    <h2 className="modal-title">Delete Tag</h2>
                    <div className="modal-content">
                        <p className="medium">Are you sure you want to delete this tag?</p>
                        <p className="large bold underline">{tagToDelete?.tagName}</p>
                        <p className="small bold warning">This will permanently delete the tag from all items it has been added to!</p>
                    </div>
                    <div className="modal-options">
                        <button onClick={handleCloseDeleteTag}>Cancel</button>
                        <button onClick={deleteTag}>Delete</button>
                    </div>
                </>
            </Modal>
        </>
    );
}