import styled from 'styled-components';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

export const SwapCategoryDropdown = styled(Dropdown)`
    width: 100%;
    /* overflow: hidden; */
    /* margin-bottom: 200px; */
    
    & .Dropdown-control {

    }

    & .Dropdown-placeholder {

    }

    & .Dropdown-menu {
        overflow-y: auto;
        z-index: 1400;
    }

    & .Dropdown-arrow {
        transition: all 0.1s
    }
`;