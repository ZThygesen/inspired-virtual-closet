import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage, Rect, Transformer } from "react-konva";
import { Html } from "react-konva-utils";
import CanvasImage from "./CanvasImage";
import { CanvasContainer } from "../styles/Canvas";
import { Tooltip } from "@mui/material";

export default function Canvas({ display, open, itemList, removeCanvasItems }) {
    const [containerSize, setContainerSize] = useState({ w: 100, h: 100 });
    const [selectedItems, setSelectedItems] = useState([]);
    const [selecting, setSelecting] = useState(false);
    const [selectionStartCoords, setSelectionStartCoords] = useState({ x1: 0, y1: 0 });
    const [selectionEndCoords, setSelectionEndCoords] = useState({ x2: 0, y2: 0 });
    const containerRef = useRef();
    const stageRef = useRef();
    const transformerRef = useRef();
    const selectionRectRef = useRef();

    const handleResize = useCallback(() => {
        if (display) {
            console.log('here')
            const { clientWidth, clientHeight } = containerRef?.current;
            const { offsetWidth, offsetHeight } = containerRef?.current;
            console.log(clientWidth, offsetWidth, containerRef.current.getBoundingClientRect().width);
            setContainerSize({ w: clientWidth, h: clientHeight });
        }
    }, [display]);

    useEffect(() =>{
        const currWidth = containerSize.w;
        const currHeight = containerSize.h;
        if (open) {
            setContainerSize({ w: currWidth - 320, h: currHeight }) 
        } else {
            setContainerSize({ w: currWidth + 320, h: currHeight }) 
        }
        
    }, [open]);

    useEffect(() => {
        // const resizeObserver = new ResizeObserver(handleResize);
        // resizeObserver.observe(document.querySelector('.closet-container'));
        window.addEventListener('resize', handleResize);
    }, [handleResize]);

    function handleRemoveItems() {
        removeCanvasItems(selectedItems);
        transformerRef.current.nodes([]);
        handleSelectItems();
    }

    function onMouseDown(e) {
        if (e.target !== stageRef.current) {
            return;
        }

        e.evt.preventDefault();

        const x1 = stageRef.current.getPointerPosition().x;
        const y1 = stageRef.current.getPointerPosition().y;
        const x2 = stageRef.current.getPointerPosition().x;
        const y2 = stageRef.current.getPointerPosition().y;

        setSelectionStartCoords({x1: x1, y1: y1});
        setSelectionEndCoords({x2: x2, y2: y2});
        selectionRectRef.current.width(0);
        selectionRectRef.current.height(0);
        setSelecting(true);
    }

    function onMouseMove(e) {
        if (!selecting) {
            return;
        }

        e.evt.preventDefault();

        const x2 = stageRef.current.getPointerPosition().x;
        const y2 = stageRef.current.getPointerPosition().y;

        setSelectionEndCoords({x2: x2, y2: y2});

        selectionRectRef.current.setAttrs({
            visible: true,
            x: Math.min(selectionStartCoords.x1, selectionEndCoords.x2),
            y: Math.min(selectionStartCoords.y1, selectionEndCoords.y2),
            width: Math.abs(selectionEndCoords.x2 - selectionStartCoords.x1),
            height: Math.abs(selectionEndCoords.y2 - selectionStartCoords.y1)
        });
    }

    function onMouseUp(e) {
        setSelecting(false);
        if (!selectionRectRef.current.visible()) {
            return;
        }

        e.evt.preventDefault();
        selectionRectRef.current.visible(false);
        const images = stageRef.current.find('.image');
        const selectionArea = selectionRectRef.current.getClientRect();
        const selectedImages = images.filter(image => hasIntersection(selectionArea, image.getClientRect()));
        transformerRef.current.nodes(selectedImages);
        handleSelectItems();
    }

    // checks if 2 rectangles are overlapping
    function hasIntersection(r1, r2) {
        return !(
            r2.x > r1.x + r1.width ||
            r2.x + r2.width < r1.x ||
            r2.y > r1.y + r1.height ||
            r2.y + r2.height < r1.y
        );
    }

    function handleClick(e) {
        // if currently selecting with rect do nothing
        if (selectionRectRef.current.visible()) {
            return;
        }

        // deselect all if not clicking on images
        if (e.target === stageRef.current) {
            transformerRef.current.nodes([]);
            handleSelectItems();
            return;
        }

        // do nothing if not clicked on image
        if (!e.target.hasName('image')) {
            return;
        }

        // handle shift/control keyboard functionality
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = transformerRef.current.nodes().indexOf(e.target) >= 0;

        // normal select (via clicking)
        if (!metaPressed && !isSelected) {
            transformerRef.current.nodes([e.target]);
        
        } else if (metaPressed && isSelected) {
            const nodes = transformerRef.current.nodes().slice();
            nodes.splice(nodes.indexOf(e.target), 1);
            transformerRef.current.nodes(nodes);
        } else if (metaPressed && !isSelected) {
            const nodes = transformerRef.current.nodes().concat([e.target]);
            transformerRef.current.nodes(nodes)
        }

        handleSelectItems();
    }

    function handleSelectItems(newItem = null) {
        const nodes = transformerRef.current.nodes();
        if (newItem && !nodes.some(node => node.attrs.item.fileId === newItem.attrs.item.fileId)) {
            transformerRef.current.nodes([newItem]);
        }

        const selected = transformerRef.current.nodes().map(image => {
            image.moveToTop();

            return image.attrs.item;
        });

        setSelectedItems(selected);

        transformerRef.current.moveToTop();
        selectionRectRef.current.moveToTop();
    }

    return (
        <CanvasContainer style={{ display: display ? 'flex' : 'none' }} ref={containerRef}>
            <Stage 
                width={containerSize.w}
                height={containerSize.h}
                ref={stageRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onClick={handleClick}
            >
                <Layer>
                    <Html>
                    <div className="canvas-header">
                        <Tooltip title="Remove Item">
                            <span>
                                <button
                                    className={`material-icons remove-canvas-item-btn ${true ? "active" : ""}`}
                                    onClick={handleRemoveItems}
                                    disabled={selectedItems.length > 0 ? false : true}
                                >
                                    
                                    {true ?
                                        "delete_forever" : "delete"
                                    }
                                </button>
                            </span>
                        </Tooltip>
                    </div>
                    </Html>
                    {
                        itemList?.map((item, index) => (
                            <CanvasImage
                                item={item}
                                handleDragImage={handleSelectItems}
                                canvasResized={containerSize}
                                key={index}
                            />
                        ))
                    }
                    <Transformer ref={transformerRef} />
                    <Rect fill="#f478534d" stroke="#f47853" dash={[9, 3]} visible={false} ref={selectionRectRef} />
                </Layer>
            </Stage>
        </CanvasContainer>
    );
}
