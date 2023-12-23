import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage, Rect, Transformer } from "react-konva";
import CanvasImage from "./CanvasImage";
import { CanvasContainer } from "../styles/Canvas";
import { Tooltip } from "@mui/material";

export default function Canvas({ sidebarRef, display, itemList, removeCanvasItems }) {
    const [containerSize, setContainerSize] = useState({ w: 1, h: 1 });
    const [selectedItems, setSelectedItems] = useState([]);
    const [selecting, setSelecting] = useState(false);
    const [selectionStartCoords, setSelectionStartCoords] = useState({ x1: 0, y1: 0 });
    const [selectionEndCoords, setSelectionEndCoords] = useState({ x2: 0, y2: 0 });
    const [shiftKeyPressed, setShiftKeyPressed] = useState(false);
    const [ctrlKeyPressed, setCtrlKeyPressed] = useState(false);

    const containerRef = useRef();
    const stageRef = useRef();
    const transformerRef = useRef();
    const selectionRectRef = useRef();

    const handleResize = useCallback(() => {
        if (display) {
            const { clientWidth, clientHeight } = containerRef?.current;
            setContainerSize({ w: clientWidth, h: clientHeight - 75 });
        }
    }, [display]);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => { window.removeEventListener('resize', handleResize); }
    }, [handleResize]);

    useEffect(() => {
        let animationId;
        
        function handleTransitionStart(e) {
            if (e.target === sidebarRef.current && display) {
                handleResize();
                animationId = requestAnimationFrame(() => handleTransitionStart(e));
            }
        }

        function handleTransitionEnd(e) {
            if (e.target === sidebarRef.current && display) {
                cancelAnimationFrame(animationId);
            }
        }

        sidebarRef.current.addEventListener('transitionstart', handleTransitionStart);
        sidebarRef.current.addEventListener('transitionend', handleTransitionEnd);

        const sidebarCurr = sidebarRef.current;
        return () => {
            sidebarCurr.removeEventListener('transitionstart', handleTransitionStart);
            sidebarCurr.removeEventListener('transitionend', handleTransitionEnd);
        }

    }, [handleResize, sidebarRef, display])

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
        if (e.target.hasName('image')) {
            return;
        }
    }

    function handleSelectItems(newItem = undefined) {
        const nodes = transformerRef.current.nodes();
        if (newItem && !shiftKeyPressed && !nodes.some(node => node.attrs.item.canvasId === newItem.attrs.item.canvasId)) {
            transformerRef.current.nodes([newItem]);
        }

        // if item clicked while shift pressed
        if (newItem && shiftKeyPressed) {
            // if item already selected, remove from selected
            if (nodes.some(node => node.attrs.item.canvasId === newItem.attrs.item.canvasId)) {
                nodes.splice(nodes.indexOf(newItem), 1);
                transformerRef.current.nodes(nodes);
            } 
            // if item not already selected, add to selected
            else {
                transformerRef.current.nodes([...nodes, newItem]);
            }
        }

        const selected = transformerRef.current.nodes().map(image => {
            if (ctrlKeyPressed && image === newItem) {
                transformerRef.current.moveToBottom();
                image.moveToBottom();
            } else {
                image.moveToTop();
            }

            return image.attrs.item;
        });

        setSelectedItems(selected);

        if (!ctrlKeyPressed) {
            transformerRef.current.moveToTop();
        } 

        selectionRectRef.current.moveToTop();
    }

    useEffect(() => {
        function handleKeydown(e) {
            if (display) {
                if (e.key === 'Shift') {
                    setShiftKeyPressed(true);
                } else if (e.key === 'Control') {
                    setCtrlKeyPressed(true);
                }
            }
        }

        function handleKeyup(e) {
            if (e.key === 'Shift') {
                setShiftKeyPressed(false);
            } else if (e.key === 'Control') {
                setCtrlKeyPressed(false);
            }
        }

        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('keyup', handleKeyup);

        return () => { 
            document.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('keyup', handleKeyup);
        }
    }, [display]);

    function handleSaveOutfit() {
        alert('save outfit');
    }

    return (
        <CanvasContainer style={{ display: display ? 'flex' : 'none' }} ref={containerRef}>
            <div className="canvas-header">
                <Tooltip title="Remove Selected Items">
                    <span>
                        <button
                            className={`material-icons remove-canvas-item-btn`}
                            onClick={handleRemoveItems}
                            disabled={selectedItems.length > 0 ? false : true}
                        >
                            delete
                        </button>
                    </span>
                </Tooltip>
                <h2 className="canvas-title">CANVAS</h2>
                <Tooltip title="Save Outfit">
                    <span>
                        <button
                            className={`material-icons save-outfit-btn`}
                            onClick={handleSaveOutfit}
                            disabled={itemList.length > 0 ? false : true}
                        > 
                            save
                        </button>
                    </span>
                </Tooltip>
            </div>
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
                    {
                        itemList?.map(item => (
                            <CanvasImage
                                item={item}
                                handleDragImage={handleSelectItems}
                                canvasResized={containerSize}
                                key={item.canvasId}
                            />
                        ))
                    }
                    <Transformer 
                        ref={transformerRef} 
                        borderStroke="#f47853" 
                        anchorStroke="#f47853" 
                        anchorFill="#f47853" 
                        anchorCornerRadius={100} 
                        rotationSnaps={[0, 90, 180, 270]}
                    />
                    <Rect
                        ref={selectionRectRef} 
                        fill="#f478534d" 
                        stroke="#f47853" 
                        dash={[9, 3]} 
                        visible={false} 
                    />
                </Layer>
            </Stage>
        </CanvasContainer>
    );
}
