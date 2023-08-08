import styled from 'styled-components';

export const ModalContentContainer = styled.div`
    width: min(90%, 500px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    background-color: var(--white);
    border: 2px solid var(--black);
    border-radius: 20px;
    padding: 20px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    .modal-title {
        font-size: 40px;
        font-weight: 600;
        font-family: 'Fashion', sans-serif;
        letter-spacing: 4px;
        text-align: center;
    }

    .modal-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    .modal-content p {
        text-align: center;
    }

    .modal-content p.large {
        font-size: 28px;
    }

    .modal-content p.medium {
        font-size: 24px;
    }

    .modal-content p.small {
        font-size: 20px;
    }

    .modal-content p.bold {
        font-weight: 700;
    }

    .modal-content p.underline {
        text-decoration: underline;
    }

    .modal-content p.warning {
        color: red;
    }

    .modal-options {
        display: flex;
        gap: 20px;
    }

    /* .delete-img, .edit-img {
        width: 150px;
        height: auto;
    } */

    button {
        font-size: 24px;
        font-family: 'Fashion', sans-serif;
        letter-spacing: 2px;
        background: none;
        border: 1px solid var(--black);
        border-radius: 56px;
        padding: 12px 18px;
        transition: all 0.1s;
        cursor: pointer;

        &:hover {
            background-color: var(--secondary);
            border-color: var(--secondary);
            color: var(--white);
        }
    }

    @media (min-width: 480px) {
        padding: 40px;

        .modal-options {
            display: flex;
            gap: 50px;
        }
    }
`;
