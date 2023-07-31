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
        font-size: 40px;
        font-weight: 600;
        font-family: 'Fashion';
        color: var(--black);
        text-transform: uppercase;
        letter-spacing: 2px;
        white-space: nowrap;
        background-color: var(--primary-light);
        padding: 20px;
        position: absolute;
        top: 0;
        margin-top: var(--header-height);
        z-index: 500;
        box-shadow: var(--box-shadow);
    }

    .clients {
        width: 100%;
        max-width: 1400px;
        display: flex;
        justify-content: center;
        align-items: center;
        align-content: flex-start;
        gap: 40px;
        flex-wrap: wrap;
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

    button {
        border: 2px solid var(--black);
        border-radius: 40px;
        padding: 15px 30px;
        font-family: 'Fashion';
        font-size: 40px;
        letter-spacing: 1px;
        background-color: var(--white);
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: var(--secondary);
            color: var(--white);
        }
    }
`;
