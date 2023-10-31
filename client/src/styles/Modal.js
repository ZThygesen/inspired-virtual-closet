import styled from 'styled-components';

export const ModalContentContainer = styled.div`
    width: min(90%, 500px);
    max-height: 80%;
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

    .close-modal {
        position: absolute;
        top: 8px;
        right: 8px;
        color: var(--material-btn);
        font-size: 36px !important;
        background: none;
        transition: all 0.1s;
        cursor: pointer;

        &:hover {
            color: var(--black);
        }
    }

    .modal-title {
        font-size: 40px;
        font-weight: 600;
        font-family: 'Fashion', sans-serif;
        letter-spacing: 4px;
        text-align: center;
    }

    .modal-content {
        width: 100%;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 8px 0;
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

    button:not(.material-icons) {
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
