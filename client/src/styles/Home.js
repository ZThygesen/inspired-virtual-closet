import styled from "styled-components";
import { PageContainer } from "./PageContainer";

export const HomeContainer = styled(PageContainer)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    align-self: center;
    gap: 40px;
    max-width: 980px;

    .big-logo {
        max-width: 80%;
        height: auto;
        margin-top: -20px;
    }
`;
