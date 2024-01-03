import { useEffect, useState } from 'react';
import axios from 'axios';
import OutfitCard from './OutfitCard';
import { OutfitsContainer } from '../styles/Outfits';
import Loading from './Loading';

export default function Outfits({ display, outfits, updateOutfits, sendOutfitToCanvas }) {
    const [loading, setLoading] = useState(false);

    async function editOutfit() {
        await axios.patch('/outfits', { outfit: 1, newName: 2 })
            .catch(err => console.log(err));
    }

    async function editOutfitName(outfit, newName) {
        setLoading(true);
        if (outfit.outfitName === newName) {
            setLoading(false);
            return;
        }

        await axios.patch('/outfits/name', { outfitId: outfit._id, newName: newName })
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
                        outfits?.map((outfit, index) => (
                            <OutfitCard
                                outfit={outfit}
                                editOutfit={editOutfit}
                                editOutfitName={editOutfitName}
                                deleteOutfit={deleteOutfit}
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
