import styled from "styled-components";
import { Image } from "react-konva";

export const CanvasContainer = styled.div`
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;

    & canvas {
        box-shadow: var(--box-shadow);
        border-radius: 25px;
        transition: 0.5s !important;
    }

    & .canvas-header {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        padding: 12px 20px;
        border-bottom: 1px solid var(--black);
    }

    & .remove-canvas-item-btn {
        padding: 12px;
        background: none;
        border-radius: 50%;
        border: 1.5px solid var(--black);
        cursor: pointer;
        font-size: 32px !important;
        background-color: var(--secondary-light);
        transition: all 0.1s;
        margin-bottom: 12px;

        &:hover,
        &.active {
            background-color: var(--secondary);
            color: var(--white) !important;
        }

        &.active:hover {
            transform: scale(1.2);
        }

        &:disabled,
        &:disabled:hover {
            background-color: var(--grey);
            color: var(--black) !important;
            cursor: default;
        }

        &.active {

        }
    }   
`;

export const CanvasImageContainer = styled(Image)`
    mix-blend-mode: multiply;
`;