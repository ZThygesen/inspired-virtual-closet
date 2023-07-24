import styled from 'styled-components';
import uploadImg from '../images/upload.png';

const DropContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 800px;
    box-sizing: border-box;
    padding: 30px;
    margin-bottom: 15px;

    .upload-icon {
        width: 80px;
        height: 80px;
        background: url(${uploadImg}) no-repeat center center;
        background-size: 100%;
        padding-bottom: 20px;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            transform: scale(1.05);
        }
    }

    p {
        text-align: center;
        margin-bottom: 10px;
        font-size: 28px;
    }

    .click-upload {
        color: var(--secondary);
        font-weight: bold;
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
`;

const Button = styled.button`
    background: none;
    border: 2px solid var(--black);
    border-radius: 25px;
    font-family: 'Fashion';
    font-size: 28px;
    background-color: var(--primary-light);
    color: var(--black);
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.1s;

    &:hover {
        background-color: var(--primary);
    }

    &:disabled, &:disabled:hover {
        background-color: var(--grey);
        color: var(--black);
        cursor: default;
    }
`;

const FileContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px;
    margin-top: 15px;
    width: 100%;
    box-sizing: border-box;
    background-color: var(--grey);
    border: 2px solid var(--black);
    border-radius: 25px;

    .title {
        text-decoration: underline;
        font-weight: bold;
    }

    p {
        text-align: center;
        margin-bottom: 10px;
        font-size: 28px;
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
        margin: 15px 0;
        font-size: 20px;
        font-weight: bold;
        text-decoration: underline;
    }
`;

const FileCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--primary-light);
    padding: 15px;
    border-radius: 25px;
    position: relative;
    width: 230px;
    box-sizing: border-box;
    box-shadow: var(--file-card-shadow);
    
    .file-img {
        background: transparent;
        width: 150px;
        height: auto;
        border: 1px solid var(--black);
        border-radius: 25px;
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
        color: var(--black);
        font-size: 24px;
        font-weight: bold;
        margin-top: 10px;
        max-width: 200px;
        word-wrap: break-word;
    }

    .file-size {
        color: var(--black);
        font-size: 20px;

    }

    .file-remove {
        position: absolute;
        top: 7px;
        right: 7px;
        cursor: pointer;
        color: var(--black);
        border-radius: 50%;
        transition: all 0.1s;

        &:hover {
            transform: scale(1.12);
        }
    }
`;

const ModalContent = styled.div`
    font-family: 'Fashion';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background-color: var(--white);
    border: 2px solid var(--black);
    border-radius: 20px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40px;

    p {
        font-size: 32px;
        font-weight: bold;
        text-align: center;
    }

    .category {
        color: var(--secondary);
        text-decoration: underline;
    }

    .modal-options {
        display: flex;
        gap: 50px;
    }

    button {
        background: none;
        border: 1px solid var(--black);
        width: 100%;
        border-radius: 8px;
        padding: 12px;
        font-family: 'Fashion';
        font-size: 24px;
        transition: all 0.1s;
        cursor: pointer;

        &:hover {
            background-color: var(--secondary);
            border-color: var(--secondary);
            color: var(--white);
        }
    }
`;

export { DropContainer, Button, FileContainer, FileCard, ModalContent };
