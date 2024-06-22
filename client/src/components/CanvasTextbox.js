import { useEffect, useRef, useState } from "react";
import { Group, Text } from "react-konva";
import { Html } from "react-konva-utils";

export default function CanvasTextbox({ textbox, handleSelectItems, canvasResized, transformerRef }) {
    const groupRef = useRef();
    const textboxRef = useRef();
    const inputRef = useRef();
    const [text, setText] = useState(textbox.textAttrs?.text || textbox.initialText);
    const { text: _, ...otherTextAttrs } = textbox.textAttrs || {};
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        handleDrag();
    }, [canvasResized]);

    useEffect(() => {
        function handleWindowClick(e) {
            if (isEditing && e.target !== inputRef.current) {
                setIsEditing(false);
                if (text === "") {
                    setText(textbox.initialText);
                }
            }
        }

        function handleKeydown(e) {
            if (isEditing && !e.shiftKey && e.key === 'Enter') {
                // remove node from transformer selection
                const nodes = transformerRef.current.nodes().filter(node => (
                    node.attrs.item.canvasId !== textbox.canvasId
                ));
                transformerRef.current.nodes(nodes);
                handleSelectItems();
                setIsEditing(false);
                
                if (text === "") {
                    setText(textbox.initialText);
                }
            } 
        }

        window.addEventListener('click', handleWindowClick);
        window.addEventListener('keydown', handleKeydown);

        return () => {
            window.removeEventListener('click', handleWindowClick);
            window.removeEventListener('keydown', handleKeydown);
        }
    }, [isEditing, text, textbox, transformerRef, handleSelectItems]);

    useEffect(() => {
        // make sure text cursor is at end of text when editing
        if (isEditing) {
            inputRef.current.selectionStart = text.length;
            inputRef.current.selectionEnd = text.length;
        }
        
    }, [isEditing, text.length]);

    function handleDrag() {
        const node = groupRef.current;
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
        handleSelectItems(groupRef.current);
    }

    function onMouseEnter() {
        const stage = textboxRef.current.getStage();
        stage.container().style.cursor = 'pointer';
    }

    function onMouseLeave() {
        const stage = textboxRef.current.getStage();
        stage.container().style.cursor = 'default';
    }

    function onClick() {
        if (!isEditing) {
            setIsEditing(true); 
        }    
    }

    function onTransform() {
        const scaleX = groupRef.current.scaleX();
        const scaleY = groupRef.current.scaleY();

        const width = textboxRef.current.width();
        const height = textboxRef.current.height();

        textboxRef.current.width(width * scaleX);
        textboxRef.current.height(height * scaleY);

        groupRef.current.scaleX(1);
        groupRef.current.scaleY(1);
    }

    return (
        <>
            <Group
                ref={groupRef}

                onDragMove={handleDrag}
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={onClick}

                onTouchStart={onMouseDown}

                onTransform={onTransform}

                // default attrs
                name="textbox"
                x={20}
                y={20}
                draggable
                item={textbox}
        
                // if attrs exist (edit mode)
                {...textbox.groupAttrs}
            >
                <Text
                    ref={textboxRef}
                    text={text}
                    width={150}
                    height={100}
                    padding={8}
                    fontSize={16}
                    opacity={isEditing ? 0 : 1}
                    
                    // if attrs exist (edit mode)
                    {...otherTextAttrs}
                />
                {isEditing && 
                    <Html>
                        <textarea
                            ref={inputRef}
                            type="text"
                            name="textbox"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            style={{
                                position: 'absolute',
                                top: textboxRef.current.y(),
                                left: textboxRef.current.x(),
                                width: textboxRef.current.width(),
                                height: textboxRef.current.height(),
                                fontSize: textboxRef.current.fontSize() + 'px',
                                border: 'none',
                                padding: '8px',
                                margin: '0px',
                                overflow: 'hidden',
                                background: 'none',
                                outline: 'none',
                                resize: 'none',
                                lineHeight: textboxRef.current.lineHeight(),
                                fontFamily: textboxRef.current.fontFamily(),
                                transformOrigin: 'left top',
                                textAlign: textboxRef.current.align()
                            }}
                            autoFocus
                        />
                    </Html>
                }
            </Group>
            
        </>
    );
}