import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useError } from './ErrorContext';
import axios from 'axios';
import api from '../api';

const DataContext = createContext();

export const DataProvider = ({ children, clientId }) => {
    const { setError } = useError();

    const [profileCategories, setProfileCategories] = useState([]);
    const [clothesCategories, setClothesCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    const updateProfileCategories = useCallback(async () => {
        
    }, []);

    const updateClothesCategories = useCallback(async () => {
        setLoading(true);

        try {
            const response = await api.get('/categories');

            const groupMap = {};
            response.data.forEach(category => {
                // don't add Other category
                if (category._id !== 0) {
                    if (!groupMap[category.group]) {
                        groupMap[category.group] = [];
                    }
                    groupMap[category.group].push(category);
                }
            });

            const categoriesByGroup = [];
            const groups = Object.keys(groupMap);
            groups.forEach(group => {
                const groupCategories = groupMap[group];
                
                // sort group's categories alphabetically
                categoriesByGroup.sort(function(a, b) {
                    if (a.name < b.name) {
                        return -1;
                    } 
                    else if (a.name > b.name) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });

                categoriesByGroup.push({ group: group, categories: groupCategories });
            });

            // sort group names alphabetically
            categoriesByGroup.sort(function(a, b) {
                if (a.group < b.group) {
                    return -1;
                }
                else if (a.group > b.group) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            setClothesCategories(categoriesByGroup); 
        } catch (err) {
            setError({
                message: 'There was an error fetching categories.',
                status: err?.response?.status || 'N/A'
            });
            setLoading(false);
        }

        setLoading(false);
    }, [setError]);

    const updateTags = useCallback(async () => {
        setLoading(true);

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

            // const options = [];
            // for (const tagGroup of tagData) {
            //     const option = {
            //         value: tagGroup._id,
            //         label: tagGroup.tagGroupName
            //     };

            //     options.push(option);
            // }

            setTags(tagData);
            // setTagGroupOptions(options);
        } catch (err) {
            setError({
                message: 'There was an error fetching tags.',
                status: err?.response?.status || 'N/A'
            });
            setLoading(false);
        }

        setLoading(false);
    }, [setError]);

    useEffect(() => {
        updateProfileCategories();
        updateClothesCategories();
        updateTags();
    }, [updateProfileCategories, updateClothesCategories, updateTags]);

    return (
        <DataContext.Provider value={{ profileCategories, updateProfileCategories, clothesCategories, updateClothesCategories, tags, updateTags, loading }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    return useContext(DataContext);
}