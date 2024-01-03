import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import cuid from 'cuid';
import { Layer, Stage, Rect, Transformer } from 'react-konva';
import Modal from './Modal';
import Input from './Input';
import Loading from './Loading';
import CanvasImage from './CanvasImage';
import CanvasTextbox from './CanvasTextbox';
import { CanvasContainer } from '../styles/Canvas';
import { Tooltip } from '@mui/material';

export default function Canvas({ display, sidebarRef, client, imageList, removeCanvasImages, updateOutfits, editMode, existingNodes }) {
    const [containerSize, setContainerSize] = useState({ w: 1, h: 1 });
    const [selectedItems, setSelectedItems] = useState([]);
    const [selecting, setSelecting] = useState(false);
    const [selectionStartCoords, setSelectionStartCoords] = useState({ x1: 0, y1: 0 });
    const [selectionEndCoords, setSelectionEndCoords] = useState({ x2: 0, y2: 0 });
    const [shiftKeyPressed, setShiftKeyPressed] = useState(false);
    const [ctrlKeyPressed, setCtrlKeyPressed] = useState(false);
    const [textboxes, setTextboxes] = useState([]);

    const [addOutfitOpen, setAddOutfitOpen] = useState(false);
    const [outfitName, setOutfitName] = useState('');
    const [outfitImageData, setOutfitImageData] = useState('');
    const [loading, setLoading] = useState(false);
    
    // editing mode
    // const existingImages = existingNodes.filter(node => node.className === 'Image');
    // const existingTextboxes = existingNodes.filter(node => node.className === 'Group');

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

    }, [handleResize, sidebarRef, display]);

    const handleSelectItems = useCallback((newItem = undefined) => {
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

        const selected = transformerRef.current.nodes().map(item => {
            if (ctrlKeyPressed && item === newItem) {
                transformerRef.current.moveToBottom();
                item.moveToBottom();
            } else {
                item.moveToTop();
            }

            return item.attrs.item;
        });

        setSelectedItems(selected);

        if (!ctrlKeyPressed) {
            transformerRef.current.moveToTop();
        } 

        selectionRectRef.current.moveToTop();
    }, [ctrlKeyPressed, shiftKeyPressed]);

    const handleRemoveItems = useCallback((clearCanvas = false) => {
        // remove text boxes
        const selectedTextboxes = selectedItems.filter(item => item.initialText);

        let updatedTextboxes = textboxes;
        selectedTextboxes.forEach(selectedTextbox => {
            updatedTextboxes = updatedTextboxes.filter(textbox => textbox.canvasId !== selectedTextbox.canvasId);
        });
        setTextboxes(updatedTextboxes);

        // remove images
        if (clearCanvas) {
            removeCanvasImages(imageList);
            setSelectedItems([]);
        } else {
            removeCanvasImages(selectedItems);
        }
        
        transformerRef.current.nodes([]);
        handleSelectItems();
    }, [handleSelectItems, removeCanvasImages, selectedItems, textboxes, imageList]);

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

        // select all items in bounds of selection rect
        const images = stageRef.current.find('.image');
        const textboxes = stageRef.current.find('.textbox');
        const items = images.concat(textboxes);
        const selectionArea = selectionRectRef.current.getClientRect();
        const selectedItems = items.filter(item => hasIntersection(selectionArea, item.getClientRect()));
        transformerRef.current.nodes(selectedItems);
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

    useEffect(() => {
        function handleKeydown(e) {
            if (display) {
                if (e.key === 'Shift') {
                    setShiftKeyPressed(true);
                } else if (e.key === 'Control') {
                    setCtrlKeyPressed(true);
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    handleRemoveItems();
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
    }, [display, handleRemoveItems]);

    function handleDblClick(e) {
        // if double clicking on empty space, add text box
        if (e.target === stageRef.current) {
            const {x, y} = stageRef.current.getPointerPosition();
            const textbox = {
                canvasId: cuid(),
                x: x,
                y: y,
                width: 100,
                height: 50,
                initialText: 'Add text here...'
            }
            setTextboxes(current => [...current, textbox]);
        }
    }

    async function handleAddOutfitOpen() {
        setOutfitImageData(stageRef.current.toDataURL());
        setAddOutfitOpen(true);
    }

    function handleAddOutfitClose() {
        setAddOutfitOpen(false);
        setOutfitName('');
        setOutfitImageData('');
    }

    async function handleAddOutfit(e) {
        e.preventDefault();

        const stageJSON = JSON.parse(stageRef.current.toJSON());
        const layerJSON = stageJSON.children[0]
        const stageItems = layerJSON.children.filter(item => item.className === 'Group' || item.className === 'Image');

        setLoading(true);

        // convert konva-generated image to blob and post to imgbb
        const blob = await fetch(outfitImageData).then(res => res.blob());
        const formData = new FormData();
        formData.append('image', blob, `${outfitName}.png`);
        formData.append('key', process.env.REACT_APP_IMGBB_API_KEY);
        const res = await axios.post('https://api.imgbb.com/1/upload', formData);
        const outfitImg = res.data.data.url;

        await axios.post('/outfits', {
            clientId: client._id, 
            imageList: imageList,
            textboxes: textboxes,
            stageItems: stageItems,
            outfitName: outfitName,
            outfitImage: outfitImg
        })
            .catch(err => console.log(err));

        await updateOutfits();
        setSelectedItems(imageList);
        handleRemoveItems(true);
        setTextboxes([]);
        handleAddOutfitClose();
        setLoading(false);
    }

    return (
        <>
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
                    <h2 className="canvas-title">Canvas</h2>
                    <Tooltip title="Save Outfit">
                        <span>
                            <button
                                className={`material-icons save-outfit-btn`}
                                onClick={handleAddOutfitOpen}
                                disabled={imageList.length > 0 || textboxes.length > 0 ? false : true}
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
                    onDblClick={handleDblClick}
                >
                    <Layer>
                        {
                            imageList?.map(image => (
                                <CanvasImage
                                    imageObj={image}
                                    handleSelectItems={handleSelectItems}
                                    canvasResized={containerSize}
                                    key={image.canvasId}
                                />
                            ))
                        }
                        {
                            textboxes?.map(textbox => (
                                <CanvasTextbox 
                                    textbox={textbox}
                                    handleSelectItems={handleSelectItems}
                                    canvasResized={containerSize}
                                    transformerRef={transformerRef}
                                    key={textbox.canvasId}
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
            <Modal
                open={addOutfitOpen}
                onClose={handleAddOutfitClose}
                isForm={true}
                submitFn={handleAddOutfit}
            >
                <>
                    <h2 className="modal-title">ADD OUTFIT</h2>
                    <div className="modal-content">
                        <p className="medium">Provide a name for this outfit:</p>
                        <Input
                            type="text"
                            id="outfit-name"
                            label="Outfit Name"
                            value={outfitName}
                            onChange={e => setOutfitName(e.target.value)}
                        />
                        <img
                            src={outfitImageData}
                            alt="New Outfit Preview"
                            className="add-outfit-img"
                        />
                        
                    </div>
                    <div className="modal-options">
                        <button type="button" onClick={handleAddOutfitClose}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </>
            </Modal>
            <Loading open={loading} />
        </>
    );
}
