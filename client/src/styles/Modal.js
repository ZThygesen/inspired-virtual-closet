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
            max-width: 80%;
            max-height: 80%;
            width: auto;
            height: auto;
            position: relative;
        }

        .on-canvas {
            color: var(--white);
            font-size: 32px;
            position: absolute;
            top: 36px;
        }

        .prev-card,
        .next-card,
        .send-to-canvas {
            background: none;
            border-radius: 50%;
            font-size: 88px !important;
            position: absolute;
            color: var(--grey);
            padding: 8px;
            transition: 0.1s;

            &:hover {
                cursor: pointer;
                background-color: var(--material-btn-bg);
            }
        }

        .prev-card {
            left: 12px;
        }

        .next-card {
            right: 12px;
        }

        .send-to-canvas {
            bottom: 12px;
            color: var(--primary);
        }
    }

    &:not(.image-modal) {
        width: min(90%, 524px);
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
        font-size: 36px;
        font-family: 'Prata';
        text-align: center;

        &.warning {
            color: red;
        }
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

    .modal-content .left {
        text-align: left;
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

    .modal-content .x-small {
        font-size: 16px;
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

    .add-outfit-img, .delete-img, .edit-img {
        width: 150px;
        height: auto;
    }

    .add-outfit-img {
        width: 200px;
    }

    .modal-content .category-name {
        color: var(--primary);
        text-decoration: underline;
    }

    button:not(.material-icons) {
        font-size: 20px;
        font-family: 'Prata';
        background: none;
        border: 1px solid var(--black);
        border-radius: 56px;
        padding: 12px 18px;
        transition: all 0.1s;
        cursor: pointer;

        &:hover {
            background-color: var(--primary);
            border-color: var(--primary);
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
