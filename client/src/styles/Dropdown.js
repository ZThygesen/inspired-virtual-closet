import styled from 'styled-components';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

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

export const SwapDropdown = styled(Dropdown)`
    width: 100%;
    
    & .Dropdown-control {
        display: flex;
        align-items: center;
        font-size: 20px;
        color: var(--black);
        border: 1px solid var(--black);
        padding: 16.5px 14px;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
            border-color: var(--primary)
        }

        & .Dropdown-placeholder {
            font-size: 16px;
            color: var(--black);
        }

        & .Dropdown-arrow {
            border-color: var(--black) transparent transparent;
            top: unset;
        }
    }

    & .Dropdown-menu {
        max-height: 400px;
        border: 1.5px solid var(--primary);
        border-radius: 4px;
        overflow-y: auto;

        & .Dropdown-group {

        }

        & .Dropdown-title {
            font-size: 20px;
        }

        & .Dropdown-option {
            font-size: 16px;
            color: var(--black);
            transition: all 0.1s;
        

            &.is-selected,
            &:hover {
                background-color: var(--grey);
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