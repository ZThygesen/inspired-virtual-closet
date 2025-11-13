import { useEffect, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useSidebar } from '../contexts/SidebarContext';
import cuid from 'cuid';
import { CategoriesSidebarContainer } from '../styles/CategoriesSidebar';
import { Tooltip } from '@mui/material';
import ClothingCard from './ClothingCard';

export default function CategoriesSidebar({ sidebarRef, addCanvasItem, searchOutfitsByItem, canvasItems }) {
    const { categories, files, currentCategory, setCurrentCategory } = useData();
    const { sidebarOpen, setSidebarOpen, mobileMode, setCurrCategoryClicked } = useSidebar();

    const [categoryGroups, setCategoryGroups] = useState([]);
    const [stickyCategory, setStickyCategory] = useState(null);
    const [currOpenIndex, setCurrOpenIndex] = useState(null);

    const ref = useRef();
    const expandRef = useRef();
    const collapseRef = useRef();

    useEffect(() => {
        const theseCategories = categories.filter(category => category._id !== 0);
        const categoriesWithGroups = theseCategories.filter(category => category.group);
        const categoriesWithoutGroups = theseCategories.filter(category => !category.group);

        const groupMap = {};
        for (const category of categoriesWithGroups) {
            if (!groupMap[category.group]) {
                groupMap[category.group] = [];
            }
            const numItems = files.filter(file => file.categoryId === category._id).length;
            groupMap[category.group].push({ ...category, numItems: numItems });
        }

        for (const category of categoriesWithoutGroups) {
            if (!groupMap[0]) {
                groupMap[0] = [];
            }
            const numItems = files.filter(file => file.categoryId === category._id).length;
            groupMap[0].push({ ...category, numItems: numItems });
        }

        const categoriesByGroup = [];
        for (const group of Object.keys(groupMap)) {
            const groupCategories = groupMap[group];
            categoriesByGroup.push({ group: group, categories: groupCategories });
        }

        const allCategory = { _id: -1, name: 'All', numItems: files.length };
        let otherCategory = categories.filter(category => category._id === 0)[0];
        const numOtherItems = files.filter(file => file.categoryId === 0).length;
        otherCategory = { ...otherCategory, numItems: numOtherItems };
        categoriesByGroup.unshift({ group: -1, categories: [allCategory, otherCategory] });

        setCategoryGroups(categoriesByGroup);
    }, [categories, files]);
    
    function toggleStickyCategory(category) {
        if (category === stickyCategory) {
            setStickyCategory(null);
        } 
        else {
            setStickyCategory(category);
        }
    }

    // clothing modal functionality
    function prevClothingModal() {
        if (currOpenIndex > 0) {
            setCurrOpenIndex(current => current - 1);
        }
    }

    function nextClothingModal() {
        if (stickyCategory && (currOpenIndex < stickyCategory?.items?.length - 1)) {
            setCurrOpenIndex(current => current + 1);
        }
    }

    function openClothingModal(index) {
        setCurrOpenIndex(index);
    }

    function closeClothingModal() {
        setCurrOpenIndex(null);
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
                                                        const target = e.target.className;
                                                        const expand = expandRef.current.className;
                                                        const collapse = collapseRef.current.className;
                                                        if (mobileMode && !(target === expand || target === collapse)) {
                                                            setSidebarOpen(false);
                                                        }
                                                        if (target === expand || target === collapse) {
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
                                                    }}
                                                    className="category-button"
                                                >
                                                    <p className={`category-name ${(categoryGroup.group === -1 || categoryGroup.group === 0) ? 'prominent' : ''}`}>{category.name}</p>
                                                    <p 
                                                        className="num-items" 
                                                        onClick={() => {
                                                            toggleStickyCategory(category);
                                                        }}
                                                    >
                                                        <span className="cat-count">{category.numItems}</span>
                                                        <span className="material-icons cat-expand" ref={expandRef}>expand_more</span>
                                                        <span className="material-icons cat-collapse" ref={collapseRef}>expand_less</span>
                                                    </p>
                                                </button>
                                                { stickyCategory === category &&
                                                <>
                                                    <div className="category-items-container">
                                                    {
                                                        files
                                                            .filter(file => file?.categoryId === category?._id || currentCategory._id === -1)
                                                            .map((item, index) => (
                                                            <ClothingCard
                                                                item={item}
                                                                onCanvas={canvasItems.some(canvasItem => canvasItem.itemId === item.gcsId)}
                                                                addCanvasItem={() => addCanvasItem(item, "image")}
                                                                searchOutfitsByItem={() => searchOutfitsByItem(item)}
                                                                prevClothingModal={prevClothingModal}
                                                                nextClothingModal={nextClothingModal}
                                                                openClothingModal={() => openClothingModal(index)}
                                                                closeClothingModal={closeClothingModal}
                                                                isOpen={currOpenIndex === index}
                                                                fromSidebar={true}
                                                                key={cuid()}
                                                            />
                                                        ))
                                                    }
                                                    </div>
                                                </>
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
