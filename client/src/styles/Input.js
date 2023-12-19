import styled from 'styled-components';
import { TextField } from '@mui/material';

export const TextInput = styled(TextField)`
    * {
        font-size: unset;
    }

    legend > span {
        padding: 0;
    }

    label {
        color: var(--black);
    }

    .MuiInput-underline:before {
        border-bottom: 2px solid var(--black);
    }

    .MuiInput-underline:hover:before {
        border-bottom: 2px solid var(--secondary);
    }

    label.Mui-focused {
        color: var(--secondary);
    }

    .MuiInput-underline:after {
        border-bottom-color: var(--secondary);
    }

    .MuiOutlinedInput-root {
        & fieldset {
            border-color: var(--black);
        }

        &:hover fieldset {
            border-color: var(--secondary);
        }

        &.Mui-focused fieldset {
            border-color: var(--secondary);
        }
    }
`;
