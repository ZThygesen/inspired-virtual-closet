import styled from "styled-components";

const AddItemsContainer = styled.div`
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;
    overflow-y: hidden;

    & .add-items-title {
        font-size: 32px;
        font-family: 'Prata';
        margin-bottom: 12px;
    }

    & .add-action-area {
        width: 100%;
        display: flex;
        flex-direction: column-reverse;
        gap: 20px;
    }

    .mass-options-btn,
    .add-items-btn {
        font-size: 40px !important;
        background-color: var(--white);
        border-radius: 50%;
        padding: 4px;
        position: absolute;
        top: 0px;
        right: 0px;
        cursor: pointer;
        transition: 0.1s;

        &:hover {
            background-color: var(--material-btn-bg);
        }
    }

    .mass-options-btn {
        right: unset;
        left: 0px;
    }

    .upload-credits {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 24px;
    }

    @media (min-width: 769px) {
        & .add-action-area {
            flex-direction: row;
        }
    }
`;

const FileOptionsContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    & .file-options {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;

        & .options-prompt {
            font-size: 20px;
            font-weight: 600;
        }

        & .category-selection,
        & .rmbg-selection,
        & .crop-selection {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        & .crop-selection.disabled {
            opacity: 0.3;
            pointer-events: none;
        }

        & .prompt {
            text-align: left;
        }
    }
`;

const FileContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    margin-top: 20px;
    width: 100%;
    overflow-y: scroll;
    /* border-radius: 20px;
    box-shadow: var(--box-shadow); */

    .file-preview-container {
        width: 100%;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 20px;
    }

    .file-error-message {
        color: #cc2d2d;
        margin: -20px 0 20px 0;
        font-size: 24px;
        font-weight: bold;
        text-decoration: underline;
        text-align: center;
    }
`;

const FileCardContainer = styled.div`
    width: 100%;
    max-width: 500px;
    border-radius: 25px;
    margin: 12px;
    box-shadow: var(--file-card-shadow);

    &.error {
        box-shadow: var(--file-card-shadow-error);
    }

    & form {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 12px 12px 12px;
        position: relative;
        width: 100%;
    }

    .file-remove {
        background: none;
        position: absolute;
        top: 7px;
        right: 7px;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            transform: scale(1.075);
        }
    }

    & .feedback {

    }

    & .file-action-area {
        width: 100%;
        display: flex;
        gap: 12px;
    }

    & .file-info {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;

        & .info-prompt {
            font-size: 20px;
            font-weight: 600;
        }
    }

    & .tags-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        margin-bottom: 12px;
    }

    & .tags-prompt {
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
        cursor: pointer;

        &:hover {
            color: var(--white);
            background-color: var(--primary);
        }
    }

    & .upload-file-button {
        max-height: 40px;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 20px;
        font-weight: 600;
        border: 1px solid var(--black);
        background-color: var(--primary-light);
        margin-top: auto;
        flex: 1;
        transition: 0.1s;
        cursor: pointer;

        &:disabled {
            background-color: var(--light-grey);
            cursor: default;
        }

        &:hover:not(:disabled) {
            color: var(--white);
            background-color: var(--primary);
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

    & .file-img.invalid {
        border: none;
    }

    & .file-size {
        font-size: 16px;
        text-align: center;
    }

    & .file-error-message {
        margin-top: 0;
    }
`;

export { AddItemsContainer, FileOptionsContainer, FileContainer, FileCardContainer }; 