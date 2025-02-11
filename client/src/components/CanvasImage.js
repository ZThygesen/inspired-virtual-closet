import { useEffect, useRef, useState } from "react";
import useImage from "use-image";
import { Image } from "react-konva";

export default function CanvasImage({ imageObj, scale, handleSelectItems, canvasResized }) {
    const [canvasRendered, setCanvasRendered] = useState(false);
    const [image] = useImage(imageObj.src, 'anonymous');
    const imageRef = useRef();
    
    useEffect(() => {
        if (canvasResized.w > 0) {
            setCanvasRendered(true);
        }
    }, [canvasResized.w]);

    let initialWidth = 150;
    let initialX = 20;
    const scaleX = imageRef?.current?.attrs?.scaleX || 1;
    
    if (imageObj.canvasId === 0) {
        initialWidth = 125;
        const scaleX = imageRef?.current?.attrs?.scaleX || 1;
        const width = imageObj?.current?.attrs?.width || initialWidth;
        const testX = Math.round((canvasResized.w / scale.x) - (initialWidth * scaleX) - 20);;
        if (!canvasRendered && canvasResized.w > 0) {
            console.log("here")
            initialX = /*imageRef?.current?.attrs?.x || */ Math.round((canvasResized.w / scale.x) - (initialWidth * scaleX) - 20);
        }
        if (imageRef.current && imageRef?.current?.attrs?.x < 0) {
            
        }
        // console.log(prevWidth, initialX);
        // setPrevWidth(initialX);
        console.log(canvasRendered, canvasResized.w, testX, initialX, imageRef?.current?.attrs?.x)
    }

    const initialHeight = (image?.height / image?.width) * initialWidth || initialWidth;
    const initialY = 20;

    // let xPos = imageRef?.current?.attrs?.x 
    // const initialX = imageObj.canvasId === 0 ? ((canvasResized.w / scale.x) - (initialWidth * scaleX) - 20) : 20;
    // console.log(imageRef.current.attrs)
    // console.log(canvasResized.w, (canvasResized.w / scale.x) - (imageRef.current.attrs.width / scale.x) - 20, imageRef.current)

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
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}

                onTouchStart={onMouseDown}
                
                // default attrs
                name="image"
                x={initialX}
                y={initialY}
                width={initialWidth}
                height={initialHeight}
                draggable
                item={imageObj}

                // {...imageRef?.current?.attrs}
                
                // if attrs exist (edit mode)
                {...imageObj.attrs}
            />
        </>
    )
}