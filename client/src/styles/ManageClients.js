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
        background-color: var(--primary-light);
        padding: 0 20px;
        z-index: 500;
        box-shadow: var(--box-shadow);

        & .title {
            font-size: 36px;
            font-weight: 600;
            font-family: 'Fashion';
            color: var(--black);
            letter-spacing: 4px;
            white-space: nowrap;
        }

        & .closet-settings-button {
            background: none;
            font-size: 36px;
            padding: 4px;
            border-radius: 50%;
            position: absolute;
            right: 20px;
            cursor: pointer;

            &:hover {
                background-color: var(--material-btn-bg);
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
        background-color: var(--primary-light);
        padding: 20px;
        box-shadow: var(--top-shadow);
        z-index: 500;
    }

    @media (min-width: 480px) {
        .clients-header {
            & .title {
                font-size: 44px;
            }
        }
        
    }

    @media (min-width: 768px) {
        .clients-header {
            & .title {
                font-size: 56px;
            }
        }
        
    }
`;