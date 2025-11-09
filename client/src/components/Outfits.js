import { useEffect, useState } from 'react';
import { useError } from './ErrorContext';
import api from '../api';
import OutfitCard from './OutfitCard';
import { OutfitsContainer } from '../styles/Outfits';
import Loading from './Loading';
import { useClient } from './ClientContext';
import Input from './Input';
import cuid from 'cuid'; 

export default function Outfits({ display, outfits, updateOutfits, sendOutfitToCanvas }) {
    const { setError } = useError();

    const { client } = useClient();

    const [currOpenIndex, setCurrOpenIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    const [searchResults, setSearchResults] = useState(outfits || []);
    const [searchString, setSearchString] = useState('');

    useEffect(() => {
        const words = searchString.toLowerCase().split(/\s+/).filter(Boolean);
        const results = outfits.filter(outfit =>
            words.every(word => outfit?.outfitName?.toLowerCase()?.includes(word))
        );
        setSearchResults(results);
    }, [searchString, outfits]);

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

    function closeOutfitModal() {
        setCurrOpenIndex(null);
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
            await api.patch(`/outfits/name/${client._id}/${outfit._id}`, { outfitName: newName });
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
                <div className="title-search">
                    <h2 className="outfits-title">Outfits ({searchResults.length})</h2>
                    <div className="search-box">
                        <Input
                            type="text"
                            id="fuzzy-search"
                            label="Search"
                            value={searchString}
                            onChange={e => setSearchString(e.target.value)}
                        />
                        <button className='material-icons clear-search-button' onClick={() => setSearchString('')}>
                            clear
                        </button>
                    </div>
                </div>
                
                <div className="outfits">
                    {
                        searchResults?.map((outfit, index) => (
                            <OutfitCard
                                outfit={outfit}
                                editOutfit={editOutfit}
                                editOutfitName={editOutfitName}
                                deleteOutfit={deleteOutfit}
                                prevOutfitModal={prevOutfitModal}
                                nextOutfitModal={nextOutfitModal}
                                openOutfitModal={() => openOutfitModal(index)}
                                closeOutfitModal={closeOutfitModal}
                                isOpen={currOpenIndex === index}
                                key={cuid()}
                            />
                        ))
                    }
                </div>
            </OutfitsContainer>
            <Loading open={loading} />
        </>
    );
}
