import styled from 'styled-components';
import { PageContainer } from './PageContainer';

const subheaderHeight = 100;
const footerHeight = 100;

export const ManageClientsContainer = styled(PageContainer)`
    height: calc(100vh - var(--header-height));
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--white);
    padding: 0;

    .title {
        width: 100%;
        height: ${subheaderHeight}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        font-weight: 600;
        font-family: 'Fashion';
        color: var(--black);
        letter-spacing: 4px;
        white-space: nowrap;
        background-color: var(--primary-light);
        padding: 0 20px;
        position: absolute;
        top: 0;
        margin-top: var(--header-height);
        z-index: 500;
        box-shadow: var(--box-shadow);
    }

    .clients {
        width: 100%;
        max-width: 1400px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 40px;
        margin-top: ${subheaderHeight}px;
        margin-bottom: ${footerHeight}px;
        padding: 20px;
        overflow-y: auto;
    }

    .footer {
        width: 100%;
        height: ${footerHeight}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-light);
        padding: 20px;
        position: absolute;
        bottom: 0;
        box-shadow: var(--top-shadow);
    }

    @media (min-width: 480px) {
        .title {
            font-size: 44px;
        }
    }

    @media (min-width: 768px) {
        .title {
            font-size: 56px;
        }
    }
`;
