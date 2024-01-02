import styled from 'styled-components';

export const OutfitsContainer = styled.div`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;

    .outfits-title {
        font-family: 'Fashion';
        font-size: 36px;
        font-weight: 600;
        letter-spacing: 2px;
    }

    .outfits {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
    }
`;

export const OutfitCardContainer = styled.div`
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
        font-size: 28px;
        color: var(--black);
        font-family: 'Fashion';
        font-weight: 600;
        letter-spacing: 2px;
        text-align: center;
    }

    img {
        width: 250px;
        height: auto;
        cursor: pointer;
    }

    .outfit-options {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 5px 0 15px 0;
    }

    .outfit-option {
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

    .outfit-option.important {
        color: var(--secondary);
        transform: scaleX(-1);
    }
`;