import styled from 'styled-components';

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
    z-index: 501;
    transition: 0.5s;
    transform: translateX(-100%);
    box-shadow: var(--sidebar-shadow);

    &.open {
        transform: translateX(0%);
    }

    .categories-header {
        width: 100%;
        min-height: var(--subheader-height);
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
    }

    .category-group {
        width: 100%;

        .group {
            font-size: 28px;
            font-weight: 700;
            font-family: 'Fashion';
            letter-spacing: 2px;
            text-align: left;
            padding: 12px 20px;
        }

        .categories {
            padding-bottom: 8px;
        }
    }

    .category-container {
        width: 100%;
        position: relative;

        .category-button {
            width: 100%;
            max-width: 100%;
            padding: 0 20px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            background: none;
            transition: all 0.1s;
            cursor: pointer;

            &:hover {
                background-color: var(--secondary);
                color: var(--white);
            }

            & .category-name,
            & .num-items > .cat-count {
                font-size: 24px;
                font-family: 'Fashion';
                letter-spacing: 2px;
                text-align: left;
            }

            & .category-name {
                margin-left: 20px;
                word-break: break-word;

                &.prominent {
                    font-weight: 700;
                    margin-left: 0;
                    font-size: 28px;
                }
            }
        }

        & .category-items-container {
            flex-direction: column;
            gap: 12px;
            padding: 12px 0;
            align-items: center;
            justify-content: center;
            display: none;
        }

        &.expanded > .category-items-container {
            display: flex;
        }

        &.expanded .category-button {
            position: sticky;
            top: 0px;
            z-index: 1;
        }

        & .cat-expand,
        & .cat-collapse {
            font-size: 32px !important;
            border-radius: 50%;
            display: none;
            transition: 0.1s;

            &:hover {
                background-color: var(--material-btn-bg);
            }
        }

        &:hover,
        &.active {
            & .category-button {
                background-color: var(--secondary);
                color: var(--white);
            }

            & .cat-count {
                display: none;
            }

            & .cat-expand {
                display: block;
            }

            & .cat-collapse {
                display: none;
            }
        }

        &.expanded {
            & .cat-count {
                display: none;
            }

            & .cat-expand {
                display: none;
            }

            & .cat-collapse {
                display: block;
            }
        }
    }
`;
