import styled from 'styled-components';

export const ShoppingContainer = styled.div`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    position: relative;

    .shopping-title {
        font-family: 'Fashion';
        font-size: 36px;
        font-weight: 600;
        letter-spacing: 2px;
        margin-bottom: 16px;
    }

    .shopping-items-container {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        align-items: center;
        overflow-y: auto;
    }

    .shopping-subtitle {
        font-size: 28px;
        font-weight: 500;
    }

    .shopping-items {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
    }

    .shopping-divider {
        width: 100%;
        height: 2px;
        border: 1px dashed var(--black);
        margin: 16px 0;
    }

    .add-shopping-item {
        font-size: 36px !important;
        background-color: var(--white);
        border: 2px solid var(--black);
        border-radius: 50%;
        padding: 4px;
        position: absolute;
        top: 0;
        right: 0;
        cursor: pointer;
        transition: 0.1s;

        &:hover {
            background-color: var(--secondary);
            transform: scale(1.1);
        }
    }
`;

export const ShoppingCardContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: var(--box-shadow);
    padding: 20px;
    border-radius: 25px;
    max-width: 250px;
    margin: 12px;

    p:not(.shopping-item-notes) {
        font-size: 28px;
        color: var(--black);
        font-family: 'Fashion';
        font-weight: 600;
        letter-spacing: 2px;
        text-align: center;
    }

    .shopping-item-name {
        word-break: break-word;
    }

    img {
        width: 250px;
        height: auto;
        cursor: pointer;
    }

    .shopping-item-notes {
        
    }

    .shopping-item-options {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 5px 0 15px 0;
    }

    .shopping-item-option {
        font-size: 38px !important;
        padding: 6px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;
        color: #a7a7a7;
        background: none;

        &:hover {
            background-color: rgba(0, 0, 0, 0.1);
            color: var(--black);
        }
    }

    .shopping-item-option.important {
        color: var(--secondary);
    }
`;