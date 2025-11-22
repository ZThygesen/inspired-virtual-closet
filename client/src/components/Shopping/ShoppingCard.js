import { useEffect, useRef, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Tooltip } from '@mui/material';
import { ShoppingCardContainer } from './ShoppingStyles';

export default function ShoppingCard({ 
    shoppingItem,
    togglePurchased,
    setEditModalOpen,
    setDeleteModalOpen,
    setModalShoppingItem,
}) {
    const { user } = useUser();

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
    }, [notesExpanded]);

    useEffect(() => {
        function handleClick(e) {
            if (!notesContainerRef.current.contains(e.target)) {
                setNotesExpanded(false);
            }
        }

        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        }
    }, []);

    function toggleNotes() {
        setFirstExpand(false);
        setNotesExpanded(current => !current);
    }

    return (
        <>
            <ShoppingCardContainer>
                <p className="shopping-item-name">{shoppingItem.itemName}</p>
                <a className="shopping-card-img" href={shoppingItem.itemLink} target="_blank" rel="noreferrer">
                    <img
                        src={shoppingItem.imageLink}
                        alt={shoppingItem.itemName}
                    />
                </a>
                <div className={`shopping-item-notes-container ${firstExpand ? '' : notesExpanded ? 'expanded' : 'not-expanded'}`} ref={notesContainerRef}>
                    { shoppingItem.notes ?
                        <>
                            <Tooltip title="Expand Notes" placement="top">
                                <button 
                                    className="material-icons notes-dropdown-btn" 
                                    onClick={toggleNotes}
                                >
                                    keyboard_arrow_down
                                </button>
                            </Tooltip>
                            <div className="shopping-item-notes">
                                <p className="shopping-item-notes-title" onClick={toggleNotes}>Notes</p>
                                <p className="shopping-item-notes-details" ref={notesRef}>{shoppingItem.notes}</p>
                            </div>
                        </>
                        :
                        <>
                            <div className="shopping-item-notes">
                                <p className="shopping-item-notes-title no-notes">No notes</p>
                            </div>
                        </>
                    }
                </div>
                <div className="shopping-item-options">
                    { shoppingItem.purchased ?
                        <Tooltip title="Not Purchased?">
                            <button
                                className='material-icons shopping-item-option'
                                onClick={() => togglePurchased(shoppingItem)}
                            >
                                close
                            </button>
                        </Tooltip>
                        :
                        <Tooltip title="Purchased?">
                            <button
                                className='material-icons shopping-item-option important'
                                onClick={() => togglePurchased(shoppingItem)}
                            >
                                check
                            </button>
                        </Tooltip>
                    }
                    { user?.isAdmin &&
                        <>
                        <Tooltip title="Edit">
                            <button 
                                className='material-icons shopping-item-option'
                                onClick={() => { setModalShoppingItem(shoppingItem); setEditModalOpen(true); }}
                            >
                                edit
                            </button>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <button
                                className='material-icons shopping-item-option'
                                onClick={() => { setModalShoppingItem(shoppingItem); setDeleteModalOpen(true); }}
                            >
                                delete
                            </button>
                        </Tooltip>
                        </>
                    }
                    <Tooltip title="View Item">
                        <a
                            className='material-icons shopping-item-option important'
                            href={shoppingItem.itemLink}
                            target="_blank"
                            rel="noreferrer"
                        >
                            shortcut
                        </a>
                    </Tooltip>
                </div>
            </ShoppingCardContainer>
        </>
    );
}
