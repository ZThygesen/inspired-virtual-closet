import styled from 'styled-components';
import cuid from 'cuid';
import { Add } from '@mui/icons-material';

const categories = [
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
    width: 250px;
    height: calc(100vh - var(--header-height));
    overflow-y: auto;
    bottom: ${sidebarBottomPadding}px;
    background-color: var(--secondary-light);

    #categories-title {
        position: sticky;
        top: 0;
        box-sizing: border-box;
        width: 100%;
        text-align: center;
        font-size: 32px;
        font-weight: bold;
        background-color: var(--secondary);
        padding: 15px 0;
        text-decoration: underline;
        color: var(--white);
        box-shadow: var(--box-shadow);
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

        &:hover {
            background-color: var(--secondary);
            color: var(--white);
        }
    `;

export default function CategoriesSidebar() {

    return (
        <Sidebar>
            <div id="categories-title">CATEGORIES</div>
            {
                categories.map(category => (
                    <CategoryButton key={cuid()}>{category.toUpperCase()}</CategoryButton>
                ))
            }
            <div className="add-category-footer">
                <Add fontSize="large"/>
                ADD CATEGORY
            </div>
        </Sidebar>
    );
}
