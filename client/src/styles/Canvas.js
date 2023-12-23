import styled from "styled-components";
import { Image } from "react-konva";

export const CanvasContainer = styled.div`
    width: 100%;
    height: 100%;
    flex-direction: column;

    & .canvas-header {
        width: 100%;
        min-height: var(--header-height);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        box-shadow: var(--canvas-header-shadow);
        border-radius: 25px 25px 0 0;
        background-color: var(--white);
        z-index: 100;
    }

    & .canvas-title {
        font-size: 36px;
        font-family: 'Fashion';
        font-weight: 600;
        letter-spacing: 2px;
    }

    & .remove-canvas-item-btn,
    & .save-outfit-btn {
        padding: 6px;
        background: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 38px !important;
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
        width: 100% !important;
    }

    & canvas {
        box-shadow: var(--canvas-shadow);
        border-radius: 0 0 25px 25px;
        width: 100% !important;
    }
`;

export const CanvasImageContainer = styled(Image)`
    mix-blend-mode: multiply;
`;