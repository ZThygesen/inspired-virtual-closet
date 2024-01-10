import { useState } from 'react';
import axios from 'axios';
import OutfitCard from './OutfitCard';
import { OutfitsContainer } from '../styles/Outfits';
import Loading from './Loading';

export default function Outfits({ display, outfits, updateOutfits, sendOutfitToCanvas }) {
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

        await axios.patch(`/outfits/name/${outfit._id}`, { newName: newName })
            .catch(err => console.log(err));
        await updateOutfits();
        setLoading(false);
    }

    async function deleteOutfit(outfit) {
        setLoading(true);
        await axios.delete(`/outfits/${outfit._id}`)
            .catch(err => console.log(err));
        
        await updateOutfits();
        setLoading(false);
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
