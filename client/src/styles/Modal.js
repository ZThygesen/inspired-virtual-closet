import styled from 'styled-components';

export const ModalContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &.image-modal {
        width: 100%;
        height: 100%;
        
        & img {
            width: 450px;
            height: auto;
        }
    }

    &:not(.image-modal) {
        width: min(90%, 500px);
        max-height: 80%;
        gap: 24px;
        background-color: var(--white);
        border: 2px solid var(--black);
        border-radius: 20px;
        padding: 20px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

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

    .modal-content .large {
        font-size: 28px;
    }

    .modal-content .medium {
        font-size: 24px;
    }

    .modal-content .small {
        font-size: 20px;
    }

    .modal-content .bold {
        font-weight: 700;
    }

    .modal-content .underline {
        text-decoration: underline;
    }

    .modal-content .warning {
        color: red;
    }

    .modal-options {
        display: flex;
        gap: 20px;
    }

    .delete-img, .edit-img {
        width: 150px;
        height: auto;
    }

    .modal-content .category-name {
        color: var(--secondary);
        text-decoration: underline;
    }

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
        &:not(.image-modal) {
            padding: 40px;
        }

        .modal-options {
            display: flex;
            gap: 50px;
        }
    }
`;
