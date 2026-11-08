import { useEffect, useRef, useState } from 'react';
import { useError } from '../../contexts/ErrorContext';
import { Tooltip } from '@mui/material';
import { OutfitCardContainer } from './OutfitsStyles';
import { useUser } from '../../contexts/UserContext';

export default function OutfitCard({ 
    outfit,
    setImageModalOpen,
    setEditModalOpen,
    setCanvasEditModalOpen,
    setDeleteModalOpen,
    setModalOutfit,
    toggleLiked,
}) {
    const { setError } = useError();
    const { user } = useUser();

    async function downloadOutfit() {
        try {
            const image = await fetch(outfit.outfitUrl).then(res => res.blob());
            const imageURL = URL.createObjectURL(image);
            const link = document.createElement('a');
            link.href = imageURL;
            link.download = outfit.outfitName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } 
        catch (err) {
            setError({
                message: 'There was an error downloading the outfit.',
                status: err?.response?.status,
            });
        } 
    }

    const [notesExpanded, setNotesExpanded] = useState(false);
    const [firstExpand, setFirstExpand] = useState(true);
    const notesContainerRef = useRef();
    const notesRef = useRef();
    useEffect(() => {
        const notesCurr = notesRef.current;
        function handleAnimationStart() {
            if (notesCurr) {
                notesCurr.style.position = 'unset';
            }
        }
        function handleAnimationEnd() {
            if (notesCurr && !notesExpanded) {
                notesCurr.style.position = 'absolute';
            }
            
        }
        if (notesCurr) {
            notesCurr.addEventListener('animationstart', handleAnimationStart);
            notesCurr.addEventListener('animationend', handleAnimationEnd);
        }
        return () => {
            if (notesCurr) {
                notesCurr.removeEventListener('animationstart', handleAnimationStart);
                notesCurr.removeEventListener('animationend', handleAnimationEnd);
            }
        }
    }, [notesExpanded])

    function toggleNotes() {
        setFirstExpand(false);
        setNotesExpanded(current => !current);
    }

    return (
        <>
            <OutfitCardContainer>
                <Tooltip title={outfit.liked ? 'Unlike Outfit' : 'Like Outfit'}>
                    <button
                        className="material-icons like-btn"
                        onClick={() => toggleLiked(outfit)}
                    >
                    {outfit.liked ? 'favorite' : 'favorite_border'}
                    </button>
                </Tooltip>
                <p className="outfit-name">{outfit.outfitName}</p>
                <div className="outfit-card-img">
                    <img
                        src={outfit.outfitUrl}
                        alt={outfit.outfitName}
                        onClick={() => { setModalOutfit(outfit); setImageModalOpen(true); }}
                    />
                </div>
                <div className={`outfit-notes-container ${firstExpand ? '' : notesExpanded ? 'expanded' : 'not-expanded'}`} ref={notesContainerRef}>
                    { outfit.outfitNotes ?
                        <>
                            <Tooltip title="Expand Notes" placement="top">
                                <button 
                                    className="material-icons notes-dropdown-btn" 
                                    onClick={toggleNotes}
                                >
                                    keyboard_arrow_down
                                </button>
                            </Tooltip>
                            <div className="outfit-notes">
                                <p className="outfit-notes-title" onClick={toggleNotes}>Notes</p>
                                <p className="outfit-notes-details" ref={notesRef}>{outfit.outfitNotes}</p>
                            </div>
                        </>
                        :
                        <>
                            <div className="outfit-notes">
                                <p className="outfit-notes-title no-notes">No notes</p>
                            </div>
                        </>
                    }
                </div>
                <div className="outfit-options">
                    { user?.isAdmin &&
                        <Tooltip title="Edit Outfit on Canvas">
                            <button 
                                className='material-icons outfit-option important'
                                onClick={() => { setModalOutfit(outfit); setCanvasEditModalOpen(true); }}
                            >
                                shortcut
                            </button>
                        </Tooltip>
                    }
                        <Tooltip title="Edit Outfit">
                            <button
                                className='material-icons outfit-option'
                                onClick={() => { setModalOutfit(outfit); setEditModalOpen(true); }}
                            >
                                edit
                            </button>
                        </Tooltip>
                    { user?.isAdmin &&
                        <Tooltip title="Delete Outfit">
                            <button
                                className='material-icons outfit-option'
                                onClick={() => { setModalOutfit(outfit); setDeleteModalOpen(true); }}
                            >
                                delete
                            </button>
                        </Tooltip>
                    }
                    <Tooltip title="Download Outfit">
                        <button
                            className='material-icons outfit-option important'
                            onClick={downloadOutfit}
                        >
                            download
                        </button>
                    </Tooltip>
                </div>
            </OutfitCardContainer>
        </>
    );
}
