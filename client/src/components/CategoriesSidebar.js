import { useEffect, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import cuid from 'cuid';
import { CategoriesSidebarContainer } from './styles/CategoriesSidebar';
import { Tooltip } from '@mui/material';
import Clothes from './Items/Clothes';

export default function CategoriesSidebar({ sidebarRef, addCanvasItem, searchOutfitsByItem, canvasItems, setClothesClosetMode }) {
    const { categories, items, currentCategory, setCurrentCategory } = useData();
    const { sidebarOpen, setSidebarOpen, mobileMode, setCurrCategoryClicked } = useSidebar();

    const [categoryGroups, setCategoryGroups] = useState([]);
    const [stickyCategory, setStickyCategory] = useState(null);

    const ref = useRef();
    const toggleRef = useRef();

    useEffect(() => {
        const theseCategories = categories.filter(category => category._id !== 0);
        const categoriesWithGroups = theseCategories.filter(category => category.group);
        const categoriesWithoutGroups = theseCategories.filter(category => !category.group);

        const groupMap = {};
        for (const category of categoriesWithGroups) {
            if (!groupMap[category.group]) {
                groupMap[category.group] = [];
            }
            const numItems = items.filter(file => file.categoryId === category._id).length;
            groupMap[category.group].push({ ...category, numItems: numItems });
        }
        for (const category of categoriesWithoutGroups) {
            if (!groupMap[0]) {
                groupMap[0] = [];
            }
            const numItems = items.filter(file => file.categoryId === category._id).length;
            groupMap[0].push({ ...category, numItems: numItems });
        }

        const categoriesByGroup = [];
        const groups = Object.keys(groupMap).sort((a, b) => {
            if (a === 0 && b === 0) {
                return 0;
            }
            else if (a === 0 || b === 0) {
                return 1;
            }
            else if (a < b) { 
                return -1; 
            }
            else if (a > b) { 
                return 1; 
            }
            else { 
                return 0; 
            }
        });
        for (const group of groups) {
            const groupCategories = groupMap[group];
            categoriesByGroup.push({ group: group, categories: groupCategories });
        }

        const allCategory = { _id: -1, name: 'All', numItems: items.length };
        let otherCategory = categories.filter(category => category._id === 0)[0];
        const numOtherItems = items.filter(file => file.categoryId === 0).length;
        otherCategory = { ...otherCategory, numItems: numOtherItems };
        categoriesByGroup.unshift({ group: -1, categories: [allCategory, otherCategory] });

        setCategoryGroups(categoriesByGroup);
    }, [categories, items]);
    
    function toggleStickyCategory(category) {
        if (category === stickyCategory) {
            setStickyCategory(null);
        } 
        else {
            setStickyCategory(category);
        }
    }

    return (
        <>
            <CategoriesSidebarContainer id="sidebar" className={`${sidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
                <div className="categories-header">
                    <h2 className="header-title">Categories</h2>
                    <Tooltip title="Close Sidebar">
                        <button className="material-icons close-sidebar-icon" onClick={() => setSidebarOpen(false)}>chevron_left</button>
                    </Tooltip>
                </div>
                <div className="categories-container" ref={ref}>
                    {
                        categoryGroups.map(categoryGroup => (
                            <div className="category-group" key={cuid()}>
                                { (categoryGroup.group !== -1 && categoryGroup.group !== 0) && 
                                    <p className="group">{categoryGroup.group}</p> 
                                }
                                <div className="categories">
                                    {
                                        categoryGroup?.categories?.map(category => (
                                            <div className={
                                                `
                                                    category-container 
                                                    ${(category._id === stickyCategory?._id && category?._id === currentCategory?._id) ? 'expanded' : ''}
                                                    ${category?._id === currentCategory?._id ? 'active' : ''}
                                                `
                                                } 
                                                key={cuid()}
                                            >
                                                <button
                                                    onClick={(e) => {                                                 
                                                        const toggleSelected = toggleRef?.current?.contains(e.target) && category.numItems > 0;
                                                        if (mobileMode && !toggleSelected) {
                                                            setSidebarOpen(false);
                                                        }
                                                        if (toggleSelected) {
                                                            toggleStickyCategory(category);
                                                        }
                                                        else if (category?._id !== currentCategory?._id) {
                                                            setStickyCategory(null);
                                                        }

                                                        if (category?._id === currentCategory?._id) {
                                                            setCurrCategoryClicked(true);
                                                        }
                                                        else {
                                                            setCurrentCategory(category);
                                                        }

                                                        if (!toggleSelected) {
                                                            setClothesClosetMode();
                                                        }
                                                        toggleRef.current = null;
                                                    }}
                                                    className="category-button"
                                                >
                                                    <p className={`category-name ${(categoryGroup.group === -1 || categoryGroup.group === 0) ? 'prominent' : ''}`}>{category.name}</p>
                                                    <div
                                                        className={`num-items ${category.numItems > 0 ? 'can-hover': ''}`}
                                                        onClick={(e) => {
                                                            toggleRef.current = e.target;
                                                        }}
                                                    >
                                                        { category.numItems > 0 &&
                                                            <>
                                                                <span className="material-icons cat-expand">expand_more</span>
                                                                <span className="material-icons cat-collapse">expand_less</span>
                                                            </>
                                                        }
                                                        <span className="cat-count">{category.numItems}</span>
                                                    </div>
                                                </button>
                                                { stickyCategory === category &&
                                                    <Clothes
                                                        display={true}
                                                        addCanvasItem={addCanvasItem}
                                                        canvasItems={canvasItems}
                                                        searchOutfitsByItem={searchOutfitsByItem}
                                                        onSidebar={true}
                                                    />
                                                }
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        ))
                    }
                </div>
            </CategoriesSidebarContainer>
        </>
    );
}
