import styled from 'styled-components';

export const ClientCardContainer = styled.div`
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    box-shadow: var(--box-shadow);
    border-radius: 25px;
    padding: 40px 20px;
    background-color: var(--white);
    position: relative;

    .admin-icon {
        font-size: 38px !important;
        color: var(--secondary) !important;
        position: absolute;
        top: 6px;
        right: 6px;
    }

    .client-name {
        font-family: 'Fashion';
        font-size: 28px;
        font-weight: 600;
        letter-spacing: 2px;
        word-break: break-word;
        text-align: center;
    }

    .client-email {
        font-size: 18px;
    }

    .client-options {
        display: flex;
        align-items: flex-end;
        gap: 4px;
    }

    .client-options button {
        font-size: 36px;
        color: #a7a7a7;
        background: transparent;
        border-radius: 50%;
        padding: 8px;
        cursor: pointer;
        transition: all 0.1s;

        &:hover {
            background-color: var(--material-btn-bg);
            color: var(--black);
        }
    }

    .closet-icon {
        font-size: 60px !important;
        color: var(--secondary) !important;
    }

    .client-credits {
        font-size: 20px;
        position: absolute;
        bottom: 8px;
    }

    @media (min-width: 480px) {
        .client-name {
            font-size: 36px;
        }
    }
`;
