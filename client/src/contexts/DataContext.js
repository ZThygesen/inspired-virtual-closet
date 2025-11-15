import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useError } from './ErrorContext';
import { useUser } from './UserContext';
import { useClient } from './ClientContext';
import api from '../api';
import Loading from '../components/Loading';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { setError } = useError();
    const { user } = useUser();
    const { client } = useClient();

    // high level data
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    // client data
    const [files, setFiles] = useState([]);
    const [outfits, setOutfits] = useState([]);
    const [shopping, setShopping] = useState([]);
    const [profile, setProfile] = useState([]);

    // closet states
    const [currentCategory, setCurrentCategory] = useState({ _id: -1, name: 'All' });
    const [currentFiles, setCurrentFiles] = useState([]);

    const [loading, setLoading] = useState(false);

    const resetData = useCallback(() => {
        setFiles([]);
        setOutfits([]);
        setShopping([]);
        setProfile([]);
        setCurrentCategory({ _id: -1, name: 'All' });
        setCurrentFiles([]);
        setLoading(false);
    }, []);

    const updateCategories = useCallback(async () => {
        try {
            const response = await api.get('/categories');
            const categories = response.data.sort((a, b) => a.name - b.name);
            setCategories(categories);
        }
        catch (err) {
            setError({
                message: 'There was an error fetching categories.',
                status: err?.response?.status,
            });
        }
    }, [setError]);

    const updateTags = useCallback(async () => {
        try {
            const response = await api.get('/tags/active');
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
        
            setTags(tagData);
        } 
        catch (err) {
            setError({
                message: 'There was an error fetching tags.',
                status: err?.response?.status,
            });
        }
    }, [setError]);

    const resolveTagIds = useCallback((tagIds) => {
        const tagsUsed = [];
        tags.forEach(group => {
            group.tags.forEach(tag => {
                if (tagIds?.includes(tag.tagId)) {
                    tagsUsed.push(tag);
                }
            });
        });
        return tagsUsed;

    }, [tags]);

    const updateFiles = useCallback(async () => {
        if (client) {
            try {
                const response = await api.get(`/files/${client._id}`);
                const files = [];
                for (const category of response.data) {
                    const items = category.items;
                    for (const item of items) {
                        item.categoryId = category._id;
                        const tags = resolveTagIds(item.tags).map(tag => tag.tagName);
                        item.tagNamesPrefix = tags.join(' | ');
                    }
                    files.push(...items);
                }
                files.sort((a, b) => a.fileName - b.fileName);
                setFiles(files);
            }
            catch (err) {
                setError({
                    message: 'There was an error fetching the client\'s items.',
                    status: err?.response?.status,
                });
            }
        }
    }, [client, resolveTagIds, setError]);

    const updateOutfits = useCallback(async () => {
        if (client) {
            try {
                const response = await api.get(`/outfits/${client._id}`);

                // reverse outfits to show recently created first
                setOutfits(response?.data?.reverse());
            }
            catch (err) {
                setError({
                    message: 'There was an error fetching the client\'s outfits.',
                    status: err?.response?.status,
                });
            }
        }
    }, [client, setError]);

    const updateShopping = useCallback(async () => {
        if (client) {
            try {
                const response = await api.get(`/shopping/${client._id}`);
                setShopping(response.data);
            } 
            catch (err) {
                setError({
                    message: 'There was an error fetching client shopping items.',
                    status: err.response.status
                });
            }
        }
    }, [client, setError]);

    const updateProfile = useCallback(async () => {
        
    }, []);

    useEffect(() => {
        if (currentCategory._id === -1) {
            setCurrentFiles(files);
        }
        else {
            setCurrentFiles(files.filter(file => file.categoryId === currentCategory._id));
        }
    }, [files, currentCategory]);

    useEffect(() => {
        if (user) {
            updateCategories();
            updateTags();
        }
    }, [user, updateCategories, updateTags]);

    const updateAll = useCallback(async () => {
        await updateFiles();
        await updateOutfits();
        await updateShopping();
        await updateProfile();
    }, [updateFiles, updateOutfits, updateShopping, updateProfile]);

    useEffect(() => {
        if (user) {
            updateAll();
        }
    }, [user, updateAll]);

    return (
        <DataContext.Provider value={{  
            categories, 
            updateCategories,
            tags,
            updateTags,
            resolveTagIds,

            updateAll, 
            files,
            updateFiles,
            outfits,
            updateOutfits,
            shopping,
            updateShopping,
            profile, 
            updateProfile,

            currentCategory,
            setCurrentCategory,
            currentFiles,
            setCurrentFiles,
            
            loading,
            setLoading,

            resetData,
        }}>
            {children}
            <Loading open={loading} />
        </DataContext.Provider>
    );
};

export const useData = () => {
    return useContext(DataContext);
}