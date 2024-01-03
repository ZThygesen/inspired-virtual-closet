import { useEffect, useRef } from "react";
import useImage from "use-image";
import { Image } from "react-konva";

export default function CanvasImage({ imageObj, handleSelectItems, canvasResized }) {
    const [image] = useImage(imageObj.src, 'anonymous');
    const imageRef = useRef();

    useEffect(() => {
        handleDrag();
    }, [canvasResized]);

    function handleDrag() {
        const node = imageRef.current;
        const stage = node.getStage();
        const rect = node.getClientRect();
        const centerX = rect.x + (rect.width / 2);
        const centerY = rect.y + (rect.height / 2);
 
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
                name="image"
                image={image}
                ref={imageRef}
                x={20}
                y={120}
                draggable
                onDragMove={handleDrag}
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                item={imageObj}
                globalCompositeOperation="multiply"
                
            />
        </>
    )
}