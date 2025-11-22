import styled from 'styled-components';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

export const ClothesContainer = styled.div`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;

    & .title-search {
        width: 100%;
        display: flex;
        flex-direction: column;
        /* align-items: flex-start; */
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 12px;

        & .MuiFormControl-root {
            max-width: 500px;

            & input {
                padding-right: 32px;
            }
        }

        & .search-box {
            width: 100%;
            max-width: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;

            & .clear-search-button {
                font-size: 24px !important;
                background: none;
                position: absolute;
                right: 4px;
                cursor: pointer;
                transition: 0.1s;
                border-radius: 50%;
                padding: 4px;
                &:hover {
                    background-color: var(--material-btn-bg);
                }
            }
        }
    }

    .category-title {
        font-family: 'Prata';
        font-size: 32px;
    }

    .items {
        /* width: 100%; */
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        justify-content: center;

        &.on-sidebar {
            gap: 12px;
            padding: 12px 0;
        }
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
        color: var(--primary) !important;
        position: absolute;
        top: 6px;
        left: 12px;
    }

    .search-outfits-icon {
        font-size: 36px !important;
        color: var(--primary) !important;
        position: absolute;
        top: 6px;
        right: 12px;

        & .num-outfits {
            color: var(--primary);
            position: absolute;
            top: 0;
            right: 0;
        }
    }

    .file-name {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: var(--black);
        font-family: 'Prata';
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
    }

    :not(.view-only) img {
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
        color: var(--primary);
    }

    .item-option.sent-to-canvas {
        color: var(--primary);
    }

    &.on-sidebar {
        padding: 48px 4px 4px 4px;
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

    &.on-modal {
        width: unset;
        height: 100%;
        max-width: 90%;
        max-height: 90%;
        margin: 0;
        padding: 4px 48px;
        background-color: var(--white);

        .file-name {
            padding: 4px;
        }

        .clothing-card-img {
            height: 100%;
            min-height: 0;
            /* max-height: 80%; */
        }

        img {
            max-height: 90%;
            max-width: 90%;
            cursor: default;
        }

        .item-options {
            gap: 24px;
            margin: 0;
            padding: 4px;

            .item-option {
                font-size: 54px !important;
            }
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
            color: var(--primary);
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
            border-color: var(--primary)
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
        border: 1.5px solid var(--primary);
        overflow-y: auto;

        & .Dropdown-option {
            font-size: 20px;
            color: var(--black);
            transition: all 0.1s;
        

            &.is-selected,
            &:hover {
                background-color: var(--primary-light);
            }
        }
    }

    &.is-open {
        & .Dropdown-control {
            border-color: var(--primary);

            & .Dropdown-arrow {
                border-color: transparent transparent var(--black);
            }
        }
    }
`;