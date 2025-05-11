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
            color: var(--secondary);
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
        font-size: 40px;
        font-weight: 600;
        font-family: 'Fashion', sans-serif;
        letter-spacing: 4px;
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

        &.no-scroll {
            height: 100vh;
            overflow-y: hidden;
        }

        & .checkboxes {
            & .checkboxes-field-name {
                text-align: left;
                font-size: 20px;
                margin-bottom: 4px;
            }
            display: flex;
            flex-direction: column;
            align-self: flex-start;

            & label {
                margin-left: 0px;
            }
        }
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
        color: var(--secondary);
        text-decoration: underline;
    }

    & button:not(.material-icons, .settings-tab) {
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

    // For add tags modal
    & .tag-checkboxes {
        display: flex;
        width: 100%;
        padding: 4px;
    }

    & .tag-groups {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }

    & .tag-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        padding: 12px;
        border-radius: 12px;
        box-shadow: var(--box-shadow);
    }

    & .tag-group-name {
        text-align: left !important;
        font-size: 20px !important;
        font-weight: 600 !important;
    }

    & .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        width: 100%;
    }

    & .tag {
        display: flex;
        align-items: center;
        box-shadow: var(--box-shadow);
        padding: 0 8px;
        border-radius: 20px;

        &.checked {
            box-shadow: var(--box-shadow-orange);
        }
    }
                    
    & .tag-color {
        width: 16px;
        height: 16px;
        outline: 1px solid var(--black);
        border-radius: 50%;
    }

    // For viewing tags in modal
    & .tags-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        padding: 0 2px;

        & .tags-prompt {
            text-align: left !important;
            font-size: 20px;
            font-weight: 600;
        }

        & .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            width: 100%;
        }

        & .tag {
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: var(--box-shadow);
            padding: 12px 16px;
            border-radius: 20px;
        }

        & .tag-name {

        }
                        
        & .tag-color {
            width: 16px;
            height: 16px;
            outline: 1px solid var(--black);
            border-radius: 50%;
        }

        & .add-tags-button {
            width: 100%;
            background-color: var(--grey);
            padding: 4px 8px;
            border-radius: 6px;
            transition: 0.1s;
            border: none;
            font-family: unset;
            letter-spacing: unset;
            font-size: 16px;
            cursor: pointer;

            &:hover {
                background-color: var(--primary-light);
                color: unset;
            }
        }
    }

    & .file-card-img {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    & .file-img {
        background: transparent;
        max-width: 200px;
        max-height: 200px;
        height: auto;
        width: auto;
        cursor: pointer;
        transition: all 0.1s;

        &:not(.invalid):hover {
            border-color: var(--primary);
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
