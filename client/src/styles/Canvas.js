import styled from 'styled-components';

export const CanvasContainer = styled.div`
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    & .canvas-header {
        min-height: var(--header-height);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 0 8px;
        box-shadow: var(--canvas-header-shadow);
        border-radius: 25px 25px 0 0;
        background-color: var(--white);
        z-index: 100;
        /* transition: width 0.5s, height 0.5s; */
    }

    & .canvas-title {
        display: flex;
        flex-direction: column;
        align-items: center;

        & .main-title {
            font-size: 28px;
            font-family: 'Fashion';
            font-weight: 600;
            letter-spacing: 2px;
        }

        & .sub-title,
        & .sub-title span {
            max-width: 100%;
            font-size: 16px;
            text-align: center;

            & span {
                font-weight: 600;
            }
        }
    }

    .canvas-options {
        display: flex;
        /* gap: 8px; */
    }

    .canvas-options button {
        padding: 4px;
        background: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 26px !important;
        color: var(--black) !important;
        transition: all 0.1s;

        &:hover {
            background-color: var(--material-btn-bg);
        }

        &:disabled,
        &:disabled:hover {
            background-color: var(--white);
            color: var(--grey) !important;
            cursor: default;
        }
    } 
    
    & .konvajs-content {
        /* width: 100% !important; */
    }

    & canvas {
        box-shadow: var(--canvas-shadow);
        border-radius: 0 0 25px 25px;
        /* width: 100% !important; */
    }

    @media (min-width: 600px) {
        & .canvas-title {
            & .main-title {
                font-size: 36px;
            }

            & .sub-title {
                font-size: 20px;
            }
        }

        .canvas-options {
            gap: 8px;
        }

        .canvas-options button {
            padding: 6px;
            font-size: 38px !important;
        }
    }
`;