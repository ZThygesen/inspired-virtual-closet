import { useEffect, useRef, useState } from 'react';
import cuid from 'cuid';
import { CategoriesSidebarContainer } from '../styles/CategoriesSidebar';
import { Tooltip } from '@mui/material';
import { useSidebar } from './SidebarContext';
import ClothingCard from './ClothingCard';

export default function CategoriesSidebar({ sidebarRef, categories, categoryGroups, activeCategory, setCategory, sendToCanvas, canvasItems }) {
    const [stickyCategory, setStickyCategory] = useState(null);

    const { sidebarOpen, setSidebarOpen, mobileMode, setCurrCategoryClicked } = useSidebar();

    const ref = useRef();
    const expandRef = useRef();
    const collapseRef = useRef();

    function toggleStickyCategory(category) {
        if (category === stickyCategory) {
            setStickyCategory(null);
        } else {
            setStickyCategory(category);
        }
    }

    // set category to 'All' on first render
    useEffect(() => {
        if (JSON.stringify(activeCategory) === '{}' && categories.length > 0) {
            setCategory(categories[0]);
        }
    }, [activeCategory, categories, setCategory]);

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
                                { categoryGroup.group !== -1 && <p className="group">{categoryGroup.group}</p> }
                                <div className="categories">
                                    {
                                        categoryGroup?.categories?.map(category => (
                                            <div className={
                                                `
                                                    category-container 
                                                    ${(category._id === stickyCategory?._id && category._id === activeCategory?._id) ? 'expanded' : ''}
                                                    ${category._id === activeCategory?._id ? 'active' : ''}
                                                `
                                                } 
                                                key={cuid()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        setCategory(category);
                                    
                                                        const target = e.target.className;
                                                        const expand = expandRef.current.className;
                                                        const collapse = collapseRef.current.className;
                                                        if (mobileMode && !(target === expand || target === collapse)) {
                                                            setSidebarOpen(false);
                                                        }

                                                        if (category._id === activeCategory?._id) {
                                                            setCurrCategoryClicked(true);
                                                        }
                                                    }}
                                                    className="category-button"
                                                >
                                                    <p className={`category-name ${categoryGroup.group === -1 ? 'prominent' : ''}`}>{category.name}</p>
                                                    <p 
                                                        className="num-items" 
                                                        onClick={() => {
                                                            toggleStickyCategory(category);
                                                        }}
                                                    >
                                                        <span className="cat-count">{category.items.length}</span>
                                                        <span className="material-icons cat-expand" ref={expandRef}>expand_more</span>
                                                        <span className="material-icons cat-collapse" ref={collapseRef}>expand_less</span>
                                                    </p>
                                                </button>
                                                <div className="category-items-container">
                                                {
                                                    category.items.map(item => (
                                                        <ClothingCard
                                                            item={item}
                                                            editable={false}
                                                            onCanvas={canvasItems.some(canvasItem => canvasItem.itemId === item.gcsId)}
                                                            sendToCanvas={() => sendToCanvas.current(item, "image")}
                                                            openClothingModal={() => {}}
                                                            isOpen={false}
                                                            fromSidebar={true}
                                                            key={cuid()}
                                                        />
                                                    ))
                                                }
                                                </div>
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
