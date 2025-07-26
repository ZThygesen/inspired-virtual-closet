import styled from 'styled-components';

export const ClientCardContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: var(--box-shadow);
    padding: 48px 20px 40px 20px;
    border-radius: 25px;
    background-color: var(--white);
    width: 300px;
    max-width: 300px;
    position: relative;

    &.is-self {
        box-shadow: var(--active-shadow);
    }

    .you-icon,
    .admin-icon {
        font-size: 38px !important;
        color: var(--primary) !important;
        position: absolute;
        top: 6px;
    }

    .you-icon {
        left: 6px;
    }

    .admin-icon {
        right: 6px;
    }

    .client-name {
        font-family: 'Prata';
        font-size: 24px;
        word-break: break-word;
        text-align: center;
    }

    .client-email {
        font-size: 18px;
        word-break: break-word;
        text-align: center;
        flex-grow: 1;
    }

    .client-options {
        display: flex;
        align-items: flex-end;
        gap: 4px;
    }

    .client-options button {
        font-size: 36px;
        color: var(--material-btn);
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
            font-size: 32px;
        }
    }
`;
