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

    return (
        <>
            <OutfitCardContainer>
                <p className="outfit-name">{outfit.outfitName}</p>
                <div className="outfit-card-img">
                    <img
                        src={outfit.outfitUrl}
                        alt={outfit.outfitName}
                        onClick={() => { setModalOutfit(outfit); setImageModalOpen(true); }}
                    />
                </div>
                <div className="outfit-options">
                    { user?.isAdmin &&
                    <>
                        <Tooltip title="Edit Outfit on Canvas">
                            <button 
                                className='material-icons outfit-option important'
                                onClick={() => { setModalOutfit(outfit); setCanvasEditModalOpen(true); }}
                            >
                                shortcut
                            </button>
                        </Tooltip>
                        <Tooltip title="Edit Outfit Name">
                            <button
                                className='material-icons outfit-option'
                                onClick={() => { setModalOutfit(outfit); setEditModalOpen(true); }}
                            >
                                edit
                            </button>
                        </Tooltip>
                        <Tooltip title="Delete Outfit">
                            <button
                                className='material-icons outfit-option'
                                onClick={() => { setModalOutfit(outfit); setDeleteModalOpen(true); }}
                            >
                                delete
                            </button>
                        </Tooltip>
                    </>
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