import styled from 'styled-components';
import { TextField, Checkbox as CB } from '@mui/material';

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
        border-bottom: 2px solid var(--primary);
    }

    label.Mui-focused {
        color: var(--primary);
    }

    .MuiInput-underline:after {
        border-bottom-color: var(--primary);
    }

    .MuiOutlinedInput-root {
        & fieldset {
            border-color: var(--black);
        }

        &:hover fieldset {
            border-color: var(--primary);
        }

        &.Mui-focused fieldset {
            border-color: var(--primary);
        }
    }
`;

export const Checkbox = styled(CB)`
`;