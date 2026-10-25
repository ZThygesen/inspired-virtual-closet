import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import { Tooltip } from '@mui/material';
import { ItemCardContainer } from './ItemsStyles';
import invalidImg from '../../images/invalid.png';

export default function ItemCard({ 
    item,
    canEdit,
    addCanvasItem,
    searchOutfitsByItem, 
    setImageModalOpen,
    setIframeModalOpen,
    setEditModalOpen,
    setEditLinkModalOpen,
    setCategoryModalOpen,
    setDeleteModalOpen,
    setModalItem,
    prevModalItem,
    nextModalItem,
    viewOnly,
    onSidebar,
    onModal,
    onCanvas,
}) {
    const { user } = useUser();
    const { outfits } = useData();

    const numOutfits = outfits.filter(outfit => outfit?.itemsUsed?.includes(item._id)).length;

    return (
        <>
            { item.type === 'link' ? 
                <ItemCardContainer className={`
                    link
                    ${viewOnly ? 'view-only' : ''}
                    ${onSidebar ? 'on-sidebar' : ''}
                    ${onModal ? 'on-modal' : ''}
                    ${onCanvas ? 'on-canvas' : ''} 
                `}>
                    <p className="file-name">{item.fileName}</p>
                    <div className="item-card-link">
                        { item.urlToDisplay ? 
                            <div className="iframe-container">
                                <iframe
                                    src={item.urlToDisplay + '/preview'}
                                    title={item.fileName}
                                />
                                {/* <div className="iframe-overlay"
                                    onClick={() => {
                                        if (viewOnly || onModal) {
                                            return;
                                        }
                                        setModalItem(item);
                                        setIframeModalOpen(true);
                                    }}
                                ></div> */}
                            </div>
                            :
                            <div className='invalid-link-container'>
                                <img
                                    src={invalidImg}
                                    alt='Invalid Link'
                                    className='invalid-link-img'
                                />
                                <p>Invalid Link</p>
                            </div>
                        }
                    </div>
                    { !viewOnly &&
                        <div className="item-options">
                            { onModal ?
                                <>
                                    <Tooltip title="Previous Item">
                                        <button
                                            className='material-icons item-option prev-card'
                                            onClick={prevModalItem}
                                        >
                                            chevron_left
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="View Item">
                                        <a
                                            className='material-icons item-option important'
                                            href={item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            open_in_new
                                        </a>
                                    </Tooltip>
                                    <Tooltip title="Next Item">
                                        <button
                                            className='material-icons item-option next-card'
                                            onClick={nextModalItem}
                                        >
                                            chevron_right
                                        </button>
                                    </Tooltip>
                                </> 
                                :
                                <>
                                    { item.urlToDisplay &&
                                        <Tooltip title="View Item">
                                            <a
                                                className='material-icons item-option important'
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                open_in_new
                                            </a>
                                        </Tooltip>
                                    }
                                    { !onSidebar && (user?.isAdmin || user?.isSuperAdmin) && canEdit &&
                                        <>
                                            <Tooltip title="Change Category">
                                                <button
                                                    className='material-icons item-option'
                                                    onClick={() => { setModalItem(item); setCategoryModalOpen(true); }}
                                                >
                                                    swap_vert
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <button
                                                    className='material-icons item-option'
                                                    onClick={() => { setModalItem(item); setEditLinkModalOpen(true); }}
                                                >
                                                    edit
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <button
                                                    className='material-icons item-option'
                                                    onClick={() => { setModalItem(item); setDeleteModalOpen(true); }}
                                                >
                                                    delete
                                                </button>
                                            </Tooltip>
                                        </>
                                    }
                                </>
                            }
                        </div>
                    }
                </ItemCardContainer>
                :
                <ItemCardContainer className={`
                    ${viewOnly ? 'view-only' : ''}
                    ${onSidebar ? 'on-sidebar' : ''}
                    ${onModal ? 'on-modal' : ''}
                    ${onCanvas ? 'on-canvas' : ''} 
                `}>
                    { numOutfits > 0 && !viewOnly &&
                    <>
                        <Tooltip title={`Used In ${numOutfits} Outfit${numOutfits > 1 ? 's' : ''}`}>
                            <div className='search-outfits-icon'>
                                <button
                                    className='material-icons item-option important'
                                    onClick={() => searchOutfitsByItem(item)}
                                >
                                    search
                                </button>
                                <div className='num-outfits'>{numOutfits}</div>
                            </div>
                        </Tooltip>
                    </>
                    }
                    { onCanvas && !viewOnly &&
                        <Tooltip title="On Canvas">
                            <span className="material-icons on-canvas-icon">swipe</span>
                        </Tooltip>
                    }
                    <p className="file-name">{item.tagNamesPrefix !== '' ? `${item.tagNamesPrefix} | ` : ''}{item.fileName}</p>
                    <div className="item-card-img">
                        <img
                            src={onModal ? item.fullFileUrl : item.smallFileUrl}
                            alt={item.fileName}
                            onClick={() => { 
                                if (viewOnly || onModal) {
                                    return;
                                }
                                setModalItem(item);
                                setImageModalOpen(true); 
                            }}
                        />
                    </div>
                    { !viewOnly &&
                        <div className="item-options">
                            { onModal ?
                                <>
                                    <Tooltip title="Previous Item">
                                        <button
                                            className='material-icons item-option prev-card'
                                            onClick={prevModalItem}
                                        >
                                            chevron_left
                                        </button>
                                    </Tooltip>
                                    { user?.isAdmin &&
                                        <Tooltip title="Send to Canvas">
                                            <button 
                                                className="material-icons item-option send-to-canvas important"
                                                onClick={() => addCanvasItem(item, "image")}
                                            >
                                                shortcut
                                            </button>
                                        </Tooltip>
                                    }
                                    <Tooltip title="Next Item">
                                        <button
                                            className='material-icons item-option next-card'
                                            onClick={nextModalItem}
                                        >
                                            chevron_right
                                        </button>
                                    </Tooltip>
                                </> 
                                :
                                <>
                                    { user?.isAdmin &&
                                        <Tooltip title="Send to Canvas">
                                            <button 
                                                className="material-icons item-option send-to-canvas important"
                                                onClick={() => addCanvasItem(item, "image")}
                                            >
                                                shortcut
                                            </button>
                                        </Tooltip>
                                    }
                                    { !onSidebar && canEdit &&
                                        <>
                                            <Tooltip title="Change Category">
                                                <button
                                                    className='material-icons item-option'
                                                    onClick={() => { setModalItem(item); setCategoryModalOpen(true); }}
                                                >
                                                    swap_vert
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <button
                                                    className='material-icons item-option'
                                                    onClick={() => { setModalItem(item); setEditModalOpen(true); }}
                                                >
                                                    edit
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <button
                                                    className='material-icons item-option'
                                                    onClick={() => { setModalItem(item); setDeleteModalOpen(true); }}
                                                >
                                                    delete
                                                </button>
                                            </Tooltip>
                                        </>
                                    }
                                </>
                            }
                        </div>
                    }
                </ItemCardContainer>
            }
        </>
    );
}
