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
            color: var(--secondary);
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