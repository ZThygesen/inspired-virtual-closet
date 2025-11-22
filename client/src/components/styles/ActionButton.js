import styled from "styled-components";
import { Link } from "react-router-dom";

const ActionButton = styled.button`
    font-size: 24px;
    font-family: 'Prata';
    color: var(--black);
    white-space: nowrap;
    background-color: var(--grey);
    border: 2px solid var(--black);
    border-radius: 20px;
    padding: 20px 30px;
    cursor: pointer;
    transition: all 0.1s;

    &.small {
        font-size: 20px;
    }

    &.less-vertical-padding {
        padding: 10px 30px;
    }

    &:hover {
            color: var(--white);
            background-color: var(--primary);
        }

    &.secondary {
        color: var(--black);
        background-color: var(--white);

        &:hover {
            color: var(--white);
            background-color: var(--primary); 
        }
    }

    &.tertiary {
        color: var(--black);
        background-color: var(--primary-light);

        &:hover {
            color: var(--white);
            background-color: var(--primary);
        }
    }

    &:disabled,
    &:disabled:hover {
        color: var(--black);
        background-color: var(--light-grey);
        cursor: default;
    }

    @media (min-width: 500px) {   
        font-size: 28px;

        &.small {
            font-size: 24px;
        }
    }

    @media (min-width: 768px) {
        font-size: 36px;

        &.small {
            font-size: 28px;
        }
    }
`;

const ActionButtonLink = styled(ActionButton).attrs({ as: Link })``;

export { ActionButton, ActionButtonLink };


