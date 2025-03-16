import styled from 'styled-components';

const categoryFooterHeight = 50;

export const ClosetSettingsContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--white);
    position: relative;
    z-index: 250;

    .settings-tabs {
        width: 100%;
        min-height: var(--subheader-height);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 500;

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

    .settings-tab {
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

        & .settings-tab-text {
            font-family: 'Fashion';
            color: var(--black);
            font-size: 32px;
        }
    }

    .settings-container {
        display: flex;
        width: calc(100% - 4px);
        height: 100%;
        box-shadow: var(--top-shadow);
        overflow-y: hidden;

        & .category-settings,
        & .tag-settings {
            display: flex;
            width: 100%;
            height: 100%;
            position: relative;

            & .groups,
            & .tag-groups {
                width: 100%;
                height: 100%;
                max-height: calc(100% - ${categoryFooterHeight}px);
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow-y: auto;
                padding: 6px 0;

                & .category-group,
                & .tag-group-container {
                    display: flex;
                    flex-direction: column;
                }

                & .group,
                & .category,
                & .tag-group,
                & .tag {
                    font-family: 'Fashion';
                    font-size: 28px;
                    letter-spacing: 2px;
                    max-width: 100%;
                    word-break: break-word;
                    text-align: left;
                }

                & .group,
                & .tag-group {
                    font-weight: 700;
                    padding: 2px 12px;
                    align-self: start;
                }

                & .tag-group {
                    padding: 0;
                    align-self: center;
                }

                & .category-setting,
                & .tag-group-setting,
                & .tag-setting {
                    display: grid;
                    grid-template-columns: 1fr 50px 50px;
                    gap: 4px;
                    padding: 2px 12px;
                    margin-left: 20px;
                    justify-items: start;
                    align-items: center;
                }

                & .tag-group-setting,
                & .tag-setting {
                    grid-template-columns: 1fr 35px 35px 35px;
                }

                & .tag-group-setting {
                    margin: 0;
                }

                & .category,
                & .tag {
                    font-size: 24px;
                }

                & .tag-display {
                    display: flex;
                    align-items: center;
                    gap: 12px;

                    & .tag-color {
                        width: 16px;
                        height: 16px;
                        outline: 1px solid var(--black);
                        border-radius: 50%;
                    }
                }

                & .category-option-btn,
                & .tag-group-option-btn,
                & .tag-option-btn {
                    justify-self: center;
                    padding: 5px;
                    cursor: pointer;
                    font-size: 32px !important;
                    background: none;
                    transition: all 0.1s;
                    color: var(--material-btn);

                    &:hover {
                        color: var(--black);
                    }
                }

                & .tag-group-name {
                    display: flex;
                    gap: 4px;

                    & .tag-group-option-btn {
                        font-size: 24px !important;
                    }
                }
                
            }

            & .categories-footer,
            & .tag-groups-footer {
                width: 100%;
                height: ${categoryFooterHeight}px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                font-weight: bold;
                background-color: var(--grey);
                color: var(--black);
                box-shadow: var(--top-shadow);
                cursor: pointer; 
                overflow: hidden;

                & .footer-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;

                    & .footer-text{
                        font-family: 'Fashion';
                        font-size: 24px;
                        font-weight: 600;
                        letter-spacing: 4px;
                    }

                    & .add-category-icon,
                    & .add-tag-group-icon {
                        font-size: 36px !important;
                    }

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
            }
        }
    }
`;
