import styled from "styled-components";
import { PageContainer } from "./PageContainer";

export const HomeContainer = styled(PageContainer)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; 
    align-self: center;
    max-width: 980px;

    .big-logo {
        width: 200px;
        height: auto;
        margin-top: -20px;
    }

    .home-options {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 24px;
    }

    h1 {
        font-size: 60px;
        font-family: 'Mallows';
        white-space: nowrap;
    }

    @media (min-width: 500px) {
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-items: center;
        gap: 24px;

        .big-logo {
            width: max(80%, 200px);
        }

        h1 {
            font-size: 72px;
        }
    }

    @media (min-width: 768px) {
        h1 {
            font-size: 92px;
        }
    }
`;
