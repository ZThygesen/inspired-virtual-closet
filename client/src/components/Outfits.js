import { useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import OutfitCard from './OutfitCard';
import { OutfitsContainer } from '../styles/Outfits';
import Loading from './Loading';
import { useClient } from './ClientContext'; 

export default function Outfits({ display, outfits, updateOutfits, sendOutfitToCanvas }) {
    const { setError } = useError();

    const { client } = useClient();

    const [currOpenIndex, setCurrOpenIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    function prevOutfitModal() {
        if (currOpenIndex > 0) {
            setCurrOpenIndex(current => current - 1);
        }
    }

    function nextOutfitModal() {
        if (currOpenIndex < outfits.length - 1) {
            setCurrOpenIndex(current => current + 1);
        }
    }

    function openOutfitModal(index) {
        setCurrOpenIndex(index);
    }

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
            await api.patch(`/outfits/name/${client._id}/${outfit._id}`, { newName: newName });
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
            await api.delete(`/outfits/${client._id}/${outfit._id}`);
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
                        outfits?.map((outfit, index) => (
                            <OutfitCard
                                outfit={outfit}
                                editOutfit={editOutfit}
                                editOutfitName={editOutfitName}
                                deleteOutfit={deleteOutfit}
                                prevOutfitModal={prevOutfitModal}
                                nextOutfitModal={nextOutfitModal}
                                openOutfitModal={() => openOutfitModal(index)}
                                isOpen={currOpenIndex === index}
                                key={index}
                            />
                        ))
                    }
                </div>
            </OutfitsContainer>
            <Loading open={loading} />
        </>
    );
}
