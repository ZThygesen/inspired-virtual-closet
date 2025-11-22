import styled from 'styled-components';
import { PageContainer } from './PageContainer';

const subheaderHeight = 75;
const footerHeight = 90;

export const ManageClientsContainer = styled(PageContainer)`
    height: calc(100% - var(--header-height));
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--white);
    padding: 0;
    position: relative;

    .clients-header {
        width: 100%;
        height: ${subheaderHeight}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-family: 'Prata';
        color: var(--black);
        white-space: nowrap;
        background-color: var(--grey);
        padding: 0 20px;
        z-index: 500;
        box-shadow: var(--box-shadow);

        & .title {
            font-size: 32px;
            font-family: 'Prata';
            color: var(--black);
            white-space: nowrap;
        }

        & .the-archive-button,
        & .closet-settings-button {
            background: none;
            font-size: 36px;
            padding: 8px;
            border-radius: 50%;
            position: absolute;
            left: 20px;
            cursor: pointer;

            &:hover {
                background-color: var(--material-btn-bg);
            }
        }

        & .closet-settings-button {
            left: unset;
            right: 20px;
        }
    }

    & .title-search {
        width: 100%;
        display: flex;
        justify-content: center;
        background: transparent;
        padding: 20px 20px 0 20px;

        & .MuiFormControl-root {
            max-width: 500px;

            & input {
                padding-right: 32px;
            }
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
    }

    .clients {
        width: 100%;
        max-width: 1400px;
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        justify-content: center;
        gap: 40px;
        padding: 20px;
        overflow-y: auto;
    }

    .footer {
        width: 100%;
        height: ${footerHeight}px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        background-color: var(--grey);
        padding: 20px;
        box-shadow: var(--top-shadow);
        z-index: 500;
    }

    @media (min-width: 480px) {
        .clients-header {
            & .title {
                font-size: 40px;
            }
        }
        
    }

    @media (min-width: 768px) {
        .clients-header {
            & .title {
                font-size: 48px;
            }
        }
        
    }
`;