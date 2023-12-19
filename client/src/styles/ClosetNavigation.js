import styled from 'styled-components';

export const ClosetNavigationContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--white);
    transition: all 0.5s;
    position: relative;
    z-index: 500;

    .closet-title,
    .closet-options {
        width: 100%;
        height: var(--subheader-height);
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-light);
        position: sticky;
        z-index: 250;
    }

    .open-sidebar-icon {
        position: absolute;
        left: 4px;
        padding: 4px;
        background: none;
        font-size: 32px !important;
        color: var(--black);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: var(--material-btn-bg);
        }
    }

    .client-closet {
        font-family: 'Fashion';
        font-size: 40px;
        letter-spacing: 2px;
        font-weight: 600;
    }

    .closet-options {
        align-items: flex-end;
    }

    ul {
        display: flex;
        list-style: none;
    }

    li {
        padding: 15px;
        transition: all 0.3s;

        &.active {
            background-color: var(--white);
            box-shadow: var(--tab-shadow);
        }
    }

    .closet-button {
        background: none;
        width: 100%;
        font-family: 'Fashion';
        color: var(--black);
        font-size: 28px;
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
            background-color: var(--black);
            transform-origin: bottom right;
            transition: transform 0.15s ease-out;
        }

        &.active {
            &:after {
                transform: scaleX(1);
            }

        }

        &:not(.active):hover:after {
            transform: scaleX(1);
            transform-origin: bottom left;
        }
    }

    .closet-container {
        width: 100%;
        height: calc(100vh - var(--header-height) - (2 * var(--subheader-height)));
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        overflow-y: auto;
    }

    @media (min-width: 768px) {
        &.sidebar-open {
            margin-left: 320px;
        }
    }
`;