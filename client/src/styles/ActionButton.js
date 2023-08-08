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
    padding: 20px 30px;
    cursor: pointer;
    transition: all 0.1s;

    &.secondary {
        color: var(--black);
        background-color: var(--white); 
    }

    &:hover {
        color: var(--black);
        background-color: var(--secondary-light);
    }

    &.secondary:hover {
        color: var(--white);
        background-color: var(--secondary); 
    }

    @media (min-width: 500px) {   
        font-size: 28px;
    }

    @media (min-width: 768px) {
        font-size: 36px;
    }
`;

const ActionButtonLink = styled(ActionButton).attrs({ as: Link })``;

export { ActionButton, ActionButtonLink };


