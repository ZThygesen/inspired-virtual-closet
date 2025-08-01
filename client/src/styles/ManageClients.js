import styled from 'styled-components';
import { PageContainer } from './PageContainer';

const subheaderHeight = 100;
const footerHeight = 100;

export const ManageClientsContainer = styled(PageContainer)`
    height: calc(100% - var(--header-height));
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--white);
    padding: 0;
    position: relative;

    .title {
        width: 100%;
        min-height: ${subheaderHeight}px;
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
    }

    .clients {
        width: 100%;
        max-width: 1400px;
        flex: 1;
        /* display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); */
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
        min-height: ${footerHeight}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--grey);
        padding: 20px;
        box-shadow: var(--top-shadow);
        z-index: 500;
    }

    @media (min-width: 480px) {
        .title {
            font-size: 40px;
        }
    }

    @media (min-width: 768px) {
        .title {
            font-size: 48px;
        }
    }
`;
