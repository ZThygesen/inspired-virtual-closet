import styled from 'styled-components';
import uploadImg from '../images/upload.png';

const DropContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: 100%;
    padding: 30px;

    & .upload-icon {
        width: 80px;
        height: 80px;
        background: url(${uploadImg}) no-repeat center center;
        background-size: 100%;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            transform: scale(1.05);
        }
    }

    & p,
    & p > * {
        text-align: center;
        margin-bottom: 10px;
        font-size: 24px;
    }

    .click-upload {
        color: var(--secondary);
        font-weight: 600;
        background: none;
        border: none;
        width: 100%;
        cursor: pointer;
        position: relative;

        &:after {
            content: '';
            position: absolute;
            width: 100%;
            transform: scaleX(0);
            height: 2px;
            bottom: 0;
            left: 0;
            background-color: var(--secondary);
            transform-origin: bottom right;
            transition: transform 0.15s ease-out;
        }

        &:hover:after {
            transform: scaleX(1);
            transform-origin: bottom left;
        }
    }

    .file-input {
        display: none;
    }

    .upload-credits {
        font-size: 24px;
    }
`;

const UploadOptionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 12px;

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
    border: 2px solid var(--black);
    border-radius: 20px;

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

const FileCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 20px 20px 20px;
    border-radius: 25px;
    position: relative;
    width: 250px;
    max-width: 250px;
    margin: 12px;
    box-shadow: var(--file-card-shadow);
    
    .file-card-img {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .file-img {
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

    .file-img.invalid {
        border: none;
    }

    .file-name {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 600;
        word-wrap: break-word;
        text-align: center;
        flex-grow: 1;
    }

    .file-size {
        font-size: 16px;
        text-align: center;
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

    & .file-error-message {
        margin-top: 0;
    }
`;

export { DropContainer, UploadOptionsContainer, FileContainer, FileCard };
