import { useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import OutfitCard from './OutfitCard';
import { OutfitsContainer } from '../styles/Outfits';
import Loading from './Loading';

export default function Outfits({ display, outfits, updateOutfits, sendOutfitToCanvas }) {
    const { setError } = useError();

    const [loading, setLoading] = useState(false);

    function editOutfit(outfit) {
        sendOutfitToCanvas(outfit);
    }

    async function editOutfitName(outfit, newName) {
        setLoading(true);
        if (outfit.outfitName === newName) {
            setLoading(false);
            return;
        }

        try {
            await api.patch(`/outfits/name/${outfit._id}`, { newName: newName });
            await updateOutfits();
        } catch (err) {
            setError({
                message: 'There was an error editing the outfit name.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }        
    }

    async function deleteOutfit(outfit) {
        setLoading(true);

        try {
            await api.delete(`/outfits/${outfit._id}`);
            await updateOutfits();
        } catch (err) {
            setError({
                message: 'There was an error deleting the outfit.',
                status: err.response.status
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <OutfitsContainer style={{ display: display ? 'flex' : 'none' }}>
                <h2 className="outfits-title">Outfits</h2>
                <div className="outfits">
                    {
                        outfits?.map(outfit => (
                            <OutfitCard
                                outfit={outfit}
                                editOutfit={editOutfit}
                                editOutfitName={editOutfitName}
                                deleteOutfit={deleteOutfit}
                                key={outfit._id}
                            />
                        ))
                    }
                </div>
            </OutfitsContainer>
            <Loading open={loading} />
        </>
    );
}
