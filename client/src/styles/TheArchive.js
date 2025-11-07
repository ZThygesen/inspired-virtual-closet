import styled from 'styled-components';

export const TheArchiveContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--white);
    position: relative;
    z-index: 250;

    .archive-tabs {
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

    .archive-tab {
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

        & .archive-tab-text {
            font-family: 'Prata';
            color: var(--black);
            font-size: 28px;
        }
    }

    .archive-container {
        display: flex;
        width: calc(100% - 4px);
        height: 100%;
        box-shadow: var(--top-shadow);
        overflow-y: hidden;

        & .archived-tags {
            display: flex;
            width: 100%;
            height: 100%;
            position: relative;

            & .tag-groups {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow-y: auto;
                padding: 6px 0;

                & .tag-group-container {
                    display: flex;
                    flex-direction: column;
                }

                & .tag-group,
                & .tag {
                    font-family: 'Prata';
                    font-size: 24px;
                    max-width: 100%;
                    word-break: break-word;
                    text-align: left;
                }

                & .tag-group {
                    font-weight: 600;
                    padding: 2px 12px;
                    align-self: start;
                }

                & .tag-group {
                    padding: 0;
                    align-self: center;
                }

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
                    grid-template-columns: 1fr 35px 35px;
                }

                & .tag-group-setting {
                    margin: 0;
                }

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
        }
    }

    .no-archived {
        font-size: 24px;
        padding: 8px;
    }
`;
