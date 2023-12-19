import styled from "styled-components";

export const AddItemsContainer = styled.div`
    flex-direction: column;
    align-items: center;
    width: 100%;

    & .category-select {
        max-width: 800px;
        text-align: center;

        & .add-item-title,
        & .add-item-title > * {
            font-size: 36px;
            font-family: 'Fashion';
            font-weight: 600;
            letter-spacing: 2px;
        }

        & .help-info {
            font-size: 24px;
            margin-bottom: 20px;
        }

        .category {
            color: var(--secondary);
            text-decoration: underline;
            cursor: pointer;
        }
        
        .error {
            color: red;
        }
    }
`;

export const Dropzone = styled.div`

`;