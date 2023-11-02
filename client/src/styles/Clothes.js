import styled from 'styled-components';

export const ClothesContainer = styled.div`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;

    .category-title {
        font-family: 'Fashion';
        font-size: 36px;
        font-weight: 600;
        letter-spacing: 2px;
        margin-bottom: 8px;
    }

    .items {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
    }
`;

export const ClothingCardContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: var(--box-shadow);
    padding: 20px;
    border-radius: 25px;
    max-width: 250px;
    margin: 12px;
    word-wrap: break-word;

    p {
        font-size: 32px;
        color: var(--black);

    }

    img {
        width: 250px;
        height: auto;
        cursor: pointer;
    }

    .item-options {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 5px 0 15px 0;
    }

    .item-option {
        padding: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;
        color: #a7a7a7;

        &:hover {
            background-color: rgba(0, 0, 0, 0.1);
            color: var(--black);
        }
    }

    .item-option.important {
        color: var(--secondary);
    }
`;