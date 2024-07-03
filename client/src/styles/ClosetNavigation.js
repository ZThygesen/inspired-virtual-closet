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
        min-height: var(--subheader-height);
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-light);
        position: sticky;
        z-index: 250;
    }

    .closet-title {
        padding: 12px 60px;
        text-align: center;
    }

    .closet-options {
        align-items: flex-end;
    }

    .closet-options.canvas-mode {
        z-index: 249;
        position: absolute;
        /* top: calc(var(--subheader-height)); */
        transform: translateY(-100%); 
        transition: transform 0.3s;

        & li {
            box-shadow: none;
        }
    }

    .closet-title:hover + .closet-options.canvas-mode,
    .closet-options.canvas-mode:hover {
        transform: translateY(0%);
    }

    .open-sidebar-icon,
    .clients-icon {
        position: absolute;
        left: 6px;
        padding: 6px;
        background: none;
        font-size: 38px !important;
        color: var(--black);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: var(--material-btn-bg);
        }
    }

    .clients-icon {
        left: unset;
        right: 6px;
    }

    .client-closet {
        font-family: 'Fashion';
        font-size: 36px;
        letter-spacing: 2px;
        font-weight: 600;
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

        & .closet-mode-text {
            font-family: 'Fashion';
            color: var(--black);
            font-size: 28px;
        }

        & .closet-mode-icon {
            font-size: 32px !important;
        }
    }

    .closet-container {
        width: 100%;
        flex: 1 1 auto;
        overflow-y: auto;
        height: 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
    }

    @media (min-width: 481px) {
        .client-closet {
            font-size: 40px;
        }
    }

    @media (min-width: 900px) {
        &.sidebar-open.user-non-admin:not(.canvas-mode-mobile) {
            margin-left: 320px;
        }
    }

    @media (min-width: 1050px) {
        &.sidebar-open.user-admin:not(.canvas-mode-mobile) {
            margin-left: 320px;
        }
    }
`;