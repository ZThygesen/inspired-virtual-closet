import styled from 'styled-components';

const sidebarBottomPadding = 20;

export const CategoriesSidebarContainer = styled.div`
    width: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: fixed;
    top: var(--header-height);
    bottom: 0;
    left: 0;
    background-color: var(--secondary-light);
    z-index: 50;
    transition: 0.5s;
    transform: translateX(-100%);

    &.open {
        transform: translateX(0%);
    }

    .categories-header {
        width: 100%;
        height: var(--subheader-height);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 12px;
        background-color: var(--secondary);
        box-shadow: var(--box-shadow);
        z-index: 49;
    }

    .categories-header button {
        font-size: 32px;
        color: var(--white);
        border-radius: 50%;
        background: transparent;
        padding: 4px;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: var(--material-btn-bg);
        }
    }

    .header-title {
        font-size: 36px;
        font-weight: 600;
        color: var(--white);
        font-family: 'Fashion', sans-serif;
        letter-spacing: 4px;
    }

    .categories-container {
        overflow-y: auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: var(--subheader-height);
    }

    .category-button {
        width: 100%;
        max-width: 100%;
        min-height: 45px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: 600;
        font-family: 'Fashion';
        letter-spacing: 2px;
        word-wrap: break-word;
        background: none;
        transition: all 0.1s;
        cursor: pointer;

        &:hover, &.active {
            background-color: var(--secondary);
            color: var(--white);
        }
    }

    .categories-footer {
        width: 100%;
        height: var(--subheader-height);
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        font-size: 32px;
        font-weight: bold;
        background-color: var(--grey);
        min-height: var(--subheader-height);
        color: var(--black);
        box-shadow: var(--top-shadow);
        cursor: pointer; 
        overflow: hidden;
        display: flex;
        align-items: center;
    }

    .footer-container {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-left: 15px;
        box-sizing: border-box;
        padding-right: 10px;
    }

    .footer-text {
        white-space: nowrap;

        &:after {
            content: '';
            position: absolute;
            width: 100%;
            transform: scaleX(0);
            height: 2px;
            bottom: 0;
            left: 0;
            background-color: var(--black);
            transform-origin: bottom right;
            transition: transform 0.15s ease-out;
        }

        &:hover:after {
            transform: scaleX(1);
            transform-origin: bottom left;
        }
    }
`;
