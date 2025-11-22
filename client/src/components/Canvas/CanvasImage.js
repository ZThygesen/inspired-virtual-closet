import { useEffect, useRef, useState } from "react";
import useImage from "use-image";
import { Image } from "react-konva";

const fallbackSrc = 'https://storage.googleapis.com/edie-styles-virtual-closet/canvas-img-unavailable.jpg';
export default function CanvasImage({ imageObj, scale, handleSelectItems, canvasResized }) {
    const [src, setSrc] = useState(imageObj.src);
    const [image, status] = useImage(src, 'anonymous');
    useEffect(() => {
        if (status === 'failed') {
            setSrc(fallbackSrc);
        }
    }, [status]);

    const imageRef = useRef();

    const [xPos, setXPos] = useState(null);

    let initialWidth = 150;
    let initialX = 20;
    
    if (imageObj.canvasId === 0) {
        initialWidth = 125;
        const scaleX = imageRef?.current?.attrs?.scaleX || 1;
        initialX = Math.round((canvasResized.w / scale.x) - (initialWidth * scaleX) - 20);
    }

    const initialHeight = (image?.height / image?.width) * initialWidth || initialWidth;
    const initialY = 20;

    useEffect(() => {
        if (imageObj.canvasId === 0 && xPos === initialX) {
            setXPos(initialX);
        }
    }, [imageObj, initialX, xPos]);

    useEffect(() => {
        handleDrag();
    }, [canvasResized]);

    function handleDrag() {
        const node = imageRef.current;
        const stage = node.getStage();
        const rect = node.getClientRect();
        const centerX = rect.x + (rect.width / 2);
        const centerY = rect.y + (rect.height / 2);
 
        if (stage.width() > 0 && stage.height() > 0) {
            if (centerX < 0) {
                node.x(node.x() - centerX);
            }

            if (centerY < 0) {
                node.y(node.y() - centerY);
            }

            if (centerX > stage.width()) {
                node.x(stage.width() - (centerX - node.x()));
            }

            if (centerY > stage.height()) {
                node.y(stage.height() - (centerY - node.y()));
            }        
        }     
    }

    function onDragEnd(e) {
        if (imageObj.canvasId === 0) {
            setXPos(e.target.attrs.x);
        }
    }

    function onMouseDown() {
        handleSelectItems(imageRef.current);
    }

    function onMouseEnter() {
        const stage = imageRef.current.getStage();
        stage.container().style.cursor = 'pointer';
    }

    function onMouseLeave() {
        const stage = imageRef.current.getStage();
        stage.container().style.cursor = 'default';
    }

    return (
        <>
            <Image
                image={image}
                ref={imageRef}

                onDragMove={handleDrag}
                onDragEnd={onDragEnd}
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}

                onTouchStart={onMouseDown}
                
                // default attrs
                name="image"
                x={xPos || initialX}
                y={initialY}
                width={initialWidth}
                height={initialHeight}
                draggable
                item={imageObj}
                
                // if attrs exist (edit mode)
                {...imageObj.attrs}
            />
        </>
    )
}