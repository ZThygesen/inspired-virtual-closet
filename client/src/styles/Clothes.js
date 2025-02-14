import styled from 'styled-components';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

export const ClothesContainer = styled.div`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;

    .category-title {
        font-family: 'Fashion';
        font-size: 36px;
        font-weight: 600;
        letter-spacing: 2px;
    }

    .items {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        justify-content: center;
    }
`;

export const ClothingCardContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: var(--box-shadow);
    padding: 48px 20px 20px 20px;
    border-radius: 25px;
    width: 250px;
    max-width: 250px;
    margin: 12px;
    position: relative;

    &.on-canvas {
        box-shadow: var(--active-shadow);
    }

    .on-canvas-icon {
        font-size: 36px !important;
        color: var(--secondary) !important;
        position: absolute;
        top: 6px;
        right: 12px;
    }

    .file-name {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: var(--black);
        font-family: 'Fashion';
        font-weight: 600;
        letter-spacing: 2px;
        text-align: center;
        word-break: break-word;
        flex-grow: 1;
    }

    .clothing-card-img {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    img {
        max-width: 200px;
        max-height: 200px;
        width: auto;
        height: auto;
        cursor: pointer;
    }

    .item-options {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 5px 0 15px 0;
    }

    .item-option {
        font-size: 38px !important;
        padding: 6px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;
        color: #a7a7a7;
        background: none;

        &:hover {
            background-color: rgba(0, 0, 0, 0.1);
            color: var(--black);
        }
    }

    .item-option.important {
        color: var(--secondary);
    }

    .item-option.sent-to-canvas {
        color: var(--primary);
    }

    &.from-sidebar {
        padding: 16px;
        margin: 0;
        gap: 0;
        background-color: var(--white);

        & .item-options {
            margin: 0;
        }

        & .clothing-card-img {
            height: unset;
        }
    }
`;

export const DropdownContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    & .curr-category {
        font-size: 24px;
        margin-bottom: 12px;

        & .category-name {
            font-size: 24px;
            color: var(--secondary);
            text-decoration: underline;
        }
    }

    & .new-category {
        font-size: 20px;
    }
`;

export const SwapCategoryDropdown = styled(Dropdown)`
    width: 100%;
    
    & .Dropdown-control {
        display: flex;
        align-items: center;
        font-size: 20px;
        color: var(--black);
        border: 1px solid var(--black);
        cursor: pointer;

        &:hover {
            border-color: var(--secondary)
        }

        & .Dropdown-placeholder {
            font-size: 20px;
            color: var(--black);
        }

        & .Dropdown-arrow {
            border-color: var(--black) transparent transparent;
        }
    }

    & .Dropdown-menu {
        max-height: 200px;
        border: 1.5px solid var(--secondary);
        overflow-y: auto;

        & .Dropdown-option {
            font-size: 20px;
            color: var(--black);
            transition: all 0.1s;
        

            &.is-selected,
            &:hover {
                background-color: var(--secondary-light);
            }
        }
    }

    &.is-open {
        & .Dropdown-control {
            border-color: var(--secondary);

            & .Dropdown-arrow {
                border-color: transparent transparent var(--black);
            }
        }
    }
`;