import styled from 'styled-components';

export const ShoppingContainer = styled.div`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    position: relative;

    .shopping-title {
        font-family: 'Prata';
        font-size: 32px;
        margin-bottom: 12px;
    }

    .shopping-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 12px;
        margin-bottom: 12px;
        border-bottom: 1px solid var(--black);
    }

    .shopping-guide,
    .shop-guide-emphasis,
    .review-emphasis,
    .scam-detector,
    .scam-emphasis {
        margin: 0 !important;
        font-size: 20px;
        text-align: center;
        margin-bottom: 20px;

        & .shop-guide-emphasis,
        & .scam-emphasis {
            color: var(--primary);
            font-weight: 600;
        }

        &.shop-guide-emphasis:hover,
        &.scam-emphasis:hover {
            text-decoration: underline;
        }

        & .review-emphasis {
            color: var(--primary);
            font-weight: 600;
        }
    }

    .review-notes,
    .review-emphasis {
        font-size: 20px;

        & span {
            color: var(--primary);
        }
    }

    .shopping-items-container {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        align-items: center;
    }

    .shopping-subtitle {
        display: flex;
        align-items: center;
        gap: 8px; 
        font-size: 28px;
        font-weight: 500;
        

        &.purchased {
            color: var(--primary);
        }

        &.not-purchased {
            color: var(--primary);
        }

        .purchased-icon {
            font-size: 32px !important;
            color: var(--primary);
        }
    }

    .shopping-items {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
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
        position: fixed;
        top: 224px;
        right: 24px;
        cursor: pointer;
        transition: 0.1s;

        &:hover {
            background-color: var(--primary);
        }
    }
`;

export const ShoppingCardContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: var(--box-shadow);
    padding: 20px;
    border-radius: 25px;
    width: 300px;
    max-width: 300px;
    margin: 12px;
    position: relative;

    .shopping-item-name {
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

    a.shopping-card-img {
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
        margin: 12px 0;
        border-radius: 25px;
    }

    .shopping-item-notes-container {
        position: relative;
        width: 100%;
        height: 50px;
        background-color: var(--white);

        .shopping-item-notes {
            width: 100%;
            display: flex;
            flex-direction: column;
            margin: 0 10px;
            padding: 8px 0;
            transition: 0.3s;
        }

        &.expanded .shopping-item-notes {
            border-radius: 12px;
            box-shadow: var(--box-shadow);
            background-color: var(--white);
        }

        .shopping-item-notes-title {
            width: 100%;
            font-size: 20px;
            padding: 8px;
            cursor: pointer;

            &.no-notes {
                cursor: auto;
                color: var(--material-btn);
            }
        }

        .shopping-item-notes-details {
            width: 100%;
            padding: 0 8px 12px 8px;
            line-height: 1.5;
            word-wrap: break-word;
            position: absolute;

            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
        }

        &.expanded .shopping-item-notes-details {
            animation: showDropdown 0.3s forwards;
        }

        &.not-expanded .shopping-item-notes-details {
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
        color: var(--primary);
    }

    @keyframes showDropdown {
        0% {
            visibility: visible;
            opacity: 0;
            transform: translateY(0%);
        }

        100% {
            visibility: visible;
            opacity: 1;
            transform: translateY(0%);
        }
    }

    @keyframes hideDropdown {
        0% {
            visibility: visible;
            opacity: 1;
            transform: translateY(0%);
        }
        99% {
            visibility: visible;
            opacity: 0;
            transform: translateY(0%);
        }
        100% {
            visibility: hidden;
            opacity: 0;
            transform: translateY(-100%);
        }
    }
`;