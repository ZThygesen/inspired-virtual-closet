import styled from 'styled-components';

export const OutfitsContainer = styled.div`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;

    & .title-search {
        width: 100%;
        display: flex;
        flex-direction: column;
        /* align-items: flex-start; */
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 12px;

        & .MuiFormControl-root {
            max-width: 500px;
        }
    }

    .outfits-title {
        font-family: 'Prata';
        font-size: 32px;
    }

    .outfits {
        /* width: 100%; */
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
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
    width: 300px;
    max-width: 300px;
    margin: 12px;

    .outfit-name {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: var(--black);
        font-family: 'Prata';
        text-align: center;
        word-break: break-word;
        flex-grow: 1;
    }

    .outfit-card-img {
        width: 100%;
        height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    img {
        max-width: 250px;
        max-height: 250px;
        width: auto;
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
        color: var(--primary);
        transform: scaleX(-1);
    }
`;