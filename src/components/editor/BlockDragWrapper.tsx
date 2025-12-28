import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { Editor, Path } from 'slate';
import { PlateEditor } from 'platejs/react';

type BlockDragWrapperProps = {
    children: React.ReactNode;
    editor: PlateEditor;
    element: unknown;
    path?: Path;
    dragPathRef: React.MutableRefObject<Path | null>;
};

export const BlockDragWrapper = ({ children, editor, element, path, dragPathRef }: BlockDragWrapperProps) => {
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

    // Casting to any because Editor.isBlock signature might mismatch slightly with Plate's typed editor
    if (!path || path.length !== 1 || !Editor.isBlock(editor as any, element as any)) {
        return <>{children}</>;
    }

    const getDropPosition = (event: React.DragEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    };

    const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
        dragPathRef.current = path;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', 'block');
    };

    const handleDragEnd = () => {
        dragPathRef.current = null;
        setDropPosition(null);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        if (!dragPathRef.current) return;
        if (Path.equals(dragPathRef.current, path)) return;
        event.preventDefault();
        setDropPosition(getDropPosition(event));
    };

    const handleDragLeave = () => {
        setDropPosition(null);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        const dragPath = dragPathRef.current;
        if (!dragPath || Path.equals(dragPath, path)) {
            setDropPosition(null);
            return;
        }

        event.preventDefault();
        const position = getDropPosition(event);
        const targetPath = position === 'after' ? Path.next(path) : path;

        editor.tf.moveNodes({ at: dragPath, to: targetPath });
        dragPathRef.current = null;
        setDropPosition(null);
    };

    const handleSelectBlock = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        editor.tf.select(Editor.range(editor as any, path));
    };

    return (
        <div
            className="group relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <button
                type="button"
                className="absolute -left-7 top-1/2 -translate-y-1/2 rounded-md p-1 text-default-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMouseDown={handleSelectBlock}
                contentEditable={false}
            >
                <GripVertical size={16} />
            </button>
            {dropPosition && (
                <div
                    className={`absolute left-0 right-0 h-0.5 bg-primary ${dropPosition === 'before' ? 'top-0' : 'bottom-0'
                        }`}
                    contentEditable={false}
                />
            )}
            {children}
        </div>
    );
};
