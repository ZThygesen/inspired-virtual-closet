import styled from "styled-components";
import { Link } from "react-router-dom";

const ActionButton = styled.button`
    font-size: 24px;
    font-weight: 600;
    font-family: 'Fashion';
    color: var(--white);
    letter-spacing: 4px;
    white-space: nowrap;
    background-color: var(--secondary);
    border: 2px solid var(--black);
    border-radius: 56px;
    padding: 12px 20px;
    cursor: pointer;
    transition: all 0.1s;

    &.small {
        font-size: 20px;
    }

    &:hover {
            color: var(--black);
            background-color: var(--secondary-light);
        }

    &.secondary {
        color: var(--black);
        background-color: var(--white);

        &:hover {
            color: var(--white);
            background-color: var(--secondary); 
        }
    }

    &.tertiary {
        color: var(--black);
        background-color: var(--primary-light);

        &:hover {
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


