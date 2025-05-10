import styled from 'styled-components';

export const ProfileContainer = styled.div`
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    position: relative;

    .profile-title {
        font-family: 'Fashion';
        font-size: 36px;
        font-weight: 600;
        letter-spacing: 2px;
        margin-bottom: 12px;
    }

    .profile-options {
        width: 100%;
        min-height: var(--subheader-height);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        position: sticky;
        z-index: 250;

        & ul {
            display: flex;
            list-style: none;
        }

        & li {
            padding: 15px;
            transition: all 0.3s;

            &.active {
                background-color: var(--white);
                box-shadow: var(--tab-shadow);
            }
        }
    }

    .profile-button {
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

        & .profile-mode-text {
            font-family: 'Fashion';
            color: var(--black);
            font-size: 24px;
        }

        & .profile-mode-icon {
            font-size: 32px !important;
        }
    }

    .profile-container {
        width: 100%;
        flex: 1 1 auto;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        box-shadow: var(--top-shadow);
    }
`;