import { useState } from 'react';
import styled from 'styled-components';
import cuid from 'cuid';
import { Add, ChevronLeft } from '@mui/icons-material';

const categories = [
    'All',
    'Belts',
    'Blazers',
    'Boots',
    'Bracelets',
    'Coats',
    'Dresses',
    'Earrings',
    'Flats',
    'Handbags',
    'Hats',
    'Heels',
    'Jackets',
    'Jeans',
    'Leggings',
    'Long sleeve tops',
    'Necklaces',
    'Pants',
    'Rings',
    'Sandals',
    'Scarves',
    'Shorts',
    'Short sleeve tops',
    'Sleeveless tops',
    'Mens shoes',
    'Shirts',
    'Skirts',
    'Sneakers',
    'Suits',
    'Sunglasses',
    'Sweaters',
    'Ties'
];

const sidebarBottomPadding = 10;

const Sidebar = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: sticky;
    height: calc(100vh - var(--header-height));
    bottom: ${sidebarBottomPadding}px;
    background-color: var(--secondary-light);
    transition: 0.3s;

    #categories-title {
        position: sticky;
        width: 100%;
        font-size: 32px;
        font-weight: bold;
        background-color: var(--secondary);
        min-height: var(--subheader-height);
        text-decoration: underline;
        color: var(--white);
        box-shadow: var(--box-shadow);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-sidebar {
        position: absolute;
        right: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: rgba(0, 0, 0, 0.3);
        }
    }

    .categories-container {
        overflow-y: auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .add-category-footer {
        position: sticky;
        bottom: ${sidebarBottomPadding}px;
        z-index: 1;
        margin-top: auto;
        background-color: var(--white);
        padding: 20px 0;
        width: 200px;
        border-radius: 20px;
        margin-top: ${sidebarBottomPadding}px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 28px;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            transform: scale(1.03);
        }
    }
    `;

const CategoryButton = styled.button`
        background: none;
        border: none;
        width: 100%;
        padding: 8px;
        font-family: 'Fashion';
        font-size: 28px;
        transition: all 0.1s;
        cursor: pointer;

        &:hover, &.active {
            background-color: var(--secondary);
            color: var(--white);
        }
    `;

export default function CategoriesSidebar({ open, closeSidebar, selectCategory }) {
    const [activeCategory, setActiveCategory] = useState(0);

    return (
        <>
            <Sidebar style={{ minWidth: open ? '260px' : '0px', width: open ? '260px' : '0px' }}>
                <div id="categories-title">
                    CATEGORIES
                    <ChevronLeft onClick={closeSidebar} sx={{ fontSize: 45 }} className="close-sidebar" />
                </div>
                <div className="categories-container">
                    {
                        categories.map((category, index) => (
                            <CategoryButton
                                key={cuid()}
                                onClick={() => {
                                    setActiveCategory(index);
                                    selectCategory(category);
                                }}
                                className={index === activeCategory ? 'active' : ''}
                            >
                                {category.toUpperCase()}
                            </CategoryButton>
                        ))
                    }
                    <div className="add-category-footer">
                        <Add fontSize="large"/>
                        ADD CATEGORY
                    </div>
                </div>
            </Sidebar>
        </>
    );
}
