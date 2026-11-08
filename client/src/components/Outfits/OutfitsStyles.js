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
        align-items: flex-start;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 12px;

        & .MuiFormControl-root {
            max-width: 500px;

            & input {
                padding-right: 32px;
            }
        }

        & .search-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        & .search-box {
            width: 100%;
            max-width: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;

            & .clear-search-button {
                font-size: 24px !important;
                background: none;
                position: absolute;
                right: 4px;
                cursor: pointer;
                transition: 0.1s;
                border-radius: 50%;
                padding: 4px;
                &:hover {
                    background-color: var(--material-btn-bg);
                }
            }
        }

        & .item-search-container {
            display: flex;
            align-items: center;
            gap: 20px;

            & .item-to-search-text {
                display: flex;
                align-items: center;
                gap: 4px;
                position: relative;
                border-radius: 24px;
                box-shadow: var(--box-shadow);
                padding: 8px 16px;

                span {
                    font-weight: 600;
                    color: var(--primary);
                }
            }

            & .clear-search-by-item {
                background: none;
                cursor: pointer;
                transition: 0.1s;
                border-radius: 50%;
                font-size: 24px !important;
                padding: 4px;

                &:hover {
                    background-color: var(--material-btn-bg);
                }
            }
        }

        & .item-to-search {
            img {
                height: 100px;
                width: auto;
            }
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
    padding: 48px 20px 20px 20px;
    border-radius: 25px;
    width: 300px;
    max-width: 300px;
    margin: 12px;
    position: relative;

    .like-btn {
        font-size: 38px !important;
        color: var(--primary) !important;
        position: absolute;
        top: 6px;
        right: 6px;
        background: none;

        padding: 6px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: rgba(0, 0, 0, 0.1);
        }
    }

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

    .outfit-notes-container {
        position: relative;
        width: 100%;
        height: 50px;
        background-color: var(--white);

        .outfit-notes {
            width: 100%;
            display: flex;
            flex-direction: column;
            margin: 0 10px;
            padding: 8px 0;
            transition: 0.3s;
            position: relative;
            z-index: 1;
        }

        &.expanded .outfit-notes {
            border-radius: 12px;
            box-shadow: var(--box-shadow);
            background-color: var(--white);
        }

        .outfit-notes-title {
            width: 100%;
            font-size: 20px;
            padding: 8px;
            cursor: pointer;

            &.no-notes {
                cursor: auto;
                color: var(--material-btn);
            }
        }

        .outfit-notes-details {
            width: 100%;
            padding: 0 8px 12px 8px;
            line-height: 1.5;
            word-wrap: break-word;
            position: absolute;

            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
        }

        &.expanded .outfit-notes-details {
            animation: showDropdown 0.3s forwards;
        }

        &.not-expanded .outfit-notes-details {
            animation: hideDropdown 0.3s forwards;
        }

        .notes-dropdown-btn {
            position: absolute;
            left: -17px;
            top: 14px;
            background: none;
            border-radius: 50%;
            cursor: pointer;
            transition: 0.3s;

            &:hover {
                background-color: var(--material-btn-bg)
            }
        }

        &.expanded .notes-dropdown-btn {
            transform: rotate(180deg);
        }
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

    &.on-modal {
        width: unset;
        height: 100%;
        max-width: 90%;
        max-height: 90%;
        margin: 0;
        padding: 4px 48px;
        background-color: var(--white);

        .outfit-name {
            padding: 4px;
        }

        .outfit-card-img {
            height: 100%;
            min-height: 0;
        }

        img {
            max-height: 90%;
            max-width: 90%;
            cursor: default;
        }

        .outfit-options {
            gap: 24px;
            margin: 0;
            padding: 4px;

            .outfit-option {
                font-size: 54px !important;
            }
        }
    }
`;