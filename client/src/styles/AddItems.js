import styled from "styled-components";

const AddItemsContainer = styled.div`
    flex-direction: column;
    align-items: center;
    width: 100%;

    & .add-items-title {
        font-size: 36px;
        font-family: 'Fashion';
        font-weight: 600;
        letter-spacing: 2px;
        margin-bottom: 12px;
    }

    & .add-action-area {
        width: 100%;
        display: flex;
        flex-direction: column-reverse;
        gap: 20px;
    }

    @media (min-width: 769px) {
        & .add-action-area {
            flex-direction: row;
        }
    }
`;

const UploadOptionsContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 12px;
    box-shadow: var(--box-shadow);
    padding: 20px;

    & .mass-options {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;

        & .mass-options-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        & .tab-selection,
        & .category-selection,
        & .rmbg-selection,
        & .crop-selection {
            display: grid;
            grid-template-columns: 1fr 100px;
            justify-items: start;
            align-items: center;
        }

        & .apply-mass-option {
            display: flex;
            padding: 12px 16px;
            justify-self: end;
            background-color: var(--white);
            box-shadow: var(--box-shadow);
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.1s;

            &:hover {
                background-color: var(--primary-light);
            }
        }
    }

    .separator {
        width: 100%;
        height: 1px;
        background-color: var(--black);
        margin: 20px 0;
    }

    .upload-credits {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 24px;
    }
`;

const FileContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    margin-top: 20px;
    width: 100%;
    border-radius: 20px;
    box-shadow: var(--box-shadow);

    h2 {
        font-family: 'Fashion';
        font-size: 36px;
        font-weight: 600;
        letter-spacing: 2px;
        margin-bottom: 20px;
    }

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

    & .file-options {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;

        & .options-prompt {
            font-size: 20px;
            font-weight: 600;
        }
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
            background-color: var(--primary-light);
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

export { AddItemsContainer, UploadOptionsContainer, FileContainer, FileCardContainer }; 