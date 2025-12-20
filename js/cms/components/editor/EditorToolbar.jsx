/**
 * TipTap Editor Toolbar Component
 */

import { useEffect, useState, useRef, useCallback } from 'preact/hooks';

export function EditorToolbar({ editor, onAddLink }) {
    const [updateKey, setUpdateKey] = useState(0);
    const lastUpdateRef = useRef(0);

    // Throttled update to prevent excessive re-renders
    const throttledUpdate = useCallback(() => {
        const now = Date.now();
        // Only update at most every 100ms
        if (now - lastUpdateRef.current > 100) {
            lastUpdateRef.current = now;
            setUpdateKey(k => k + 1);
        }
    }, []);

    useEffect(() => {
        if (!editor) return;

        // Only listen to selectionUpdate - transaction fires too often (every keystroke)
        // selectionUpdate is sufficient for toolbar button active states
        editor.on('selectionUpdate', throttledUpdate);

        return () => {
            editor.off('selectionUpdate', throttledUpdate);
        };
    }, [editor, throttledUpdate]);

    if (!editor) return null;

    const headingLevel = editor.isActive('heading') 
        ? editor.getAttributes('heading').level.toString() 
        : 'paragraph';

    return (
        <div className="cms-editor-toolbar">
            {/* Text Formatting */}
            <div className="cms-toolbar-group">
                <button
                    type="button"
                    className={`cms-editor-btn ${editor.isActive('bold') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold (Ctrl+B)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                    </svg>
                </button>
                <button
                    type="button"
                    className={`cms-editor-btn ${editor.isActive('italic') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic (Ctrl+I)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="4" x2="10" y2="4"></line>
                        <line x1="14" y1="20" x2="5" y2="20"></line>
                        <line x1="15" y1="4" x2="9" y2="20"></line>
                    </svg>
                </button>
                <button
                    type="button"
                    className={`cms-editor-btn ${editor.isActive('underline') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Underline (Ctrl+U)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                        <line x1="4" y1="21" x2="20" y2="21"></line>
                    </svg>
                </button>
                <button
                    type="button"
                    className={`cms-editor-btn ${editor.isActive('strike') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 4H9a3 3 0 0 0-2.83 4"></path>
                        <path d="M14 12a4 4 0 0 1 0 8H6"></path>
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                    </svg>
                </button>
                <button
                    type="button"
                    className={`cms-editor-btn ${editor.isActive('code') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    title="Inline Code"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                </button>
                <button
                    type="button"
                    className={`cms-editor-btn ${editor.isActive('link') ? 'active' : ''}`}
                    onClick={onAddLink}
                    title="Add Link"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </button>
            </div>

            {/* Heading Levels */}
            <div className="cms-toolbar-group">
                <select
                    className="cms-editor-select"
                    value={headingLevel}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'paragraph') {
                            editor.chain().focus().setParagraph().run();
                        } else {
                            editor.chain().focus().toggleHeading({ level: parseInt(value) }).run();
                        }
                    }}
                    title="Text Style"
                >
                    <option value="paragraph">Paragraph</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                    <option value="4">Heading 4</option>
                </select>
            </div>

            {/* Lists */}
            <div className="cms-toolbar-group">
                <button
                    type="button"
                    className={`cms-editor-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </button>
                <button
                    type="button"
                    className={`cms-editor-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Numbered List"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="10" y1="6" x2="21" y2="6"></line>
                        <line x1="10" y1="12" x2="21" y2="12"></line>
                        <line x1="10" y1="18" x2="21" y2="18"></line>
                        <path d="M4 6h1v4"></path>
                        <path d="M4 10h2"></path>
                        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
}

