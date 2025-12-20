/**
 * Mini Rich Text Editor Component
 * A simpler TipTap editor for secondary content fields like descriptions
 */

import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';

export function MiniRichTextEditor({ content, onChange, placeholder }) {
    const editorRef = useRef(null);
    const editorInstanceRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [updateKey, setUpdateKey] = useState(0);
    const lastUpdateRef = useRef(0);

    // Throttled update to prevent excessive re-renders
    const throttledUpdate = useCallback(() => {
        const now = Date.now();
        // Only update at most every 150ms
        if (now - lastUpdateRef.current > 150) {
            lastUpdateRef.current = now;
            setUpdateKey(k => k + 1);
        }
    }, []);

    useEffect(() => {
        if (!editorRef.current) return;

        const editor = new Editor({
            element: editorRef.current,
            extensions: [
                StarterKit.configure({
                    heading: false,
                    codeBlock: false,
                    blockquote: false,
                    horizontalRule: false,
                }),
                Link.configure({
                    openOnClick: false,
                    HTMLAttributes: {
                        target: '_blank',
                        rel: 'noopener noreferrer',
                    },
                }),
                Underline,
            ],
            content: content || '',
            editorProps: {
                attributes: {
                    class: 'mini-tiptap-editor',
                    'data-placeholder': placeholder || 'Enter description...',
                },
            },
            onUpdate: ({ editor: ed }) => {
                if (onChange) {
                    onChange(ed.getHTML());
                }
            },
            onSelectionUpdate: throttledUpdate,
        });

        editorInstanceRef.current = editor;
        setIsReady(true);

        return () => {
            editor.destroy();
            editorInstanceRef.current = null;
        };
    }, []);

    // Update content when prop changes externally
    useEffect(() => {
        const editor = editorInstanceRef.current;
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '');
        }
    }, [content]);

    const handleFormat = (command) => {
        const editor = editorInstanceRef.current;
        if (!editor) return;

        switch (command) {
            case 'bold':
                editor.chain().focus().toggleBold().run();
                break;
            case 'italic':
                editor.chain().focus().toggleItalic().run();
                break;
            case 'underline':
                editor.chain().focus().toggleUnderline().run();
                break;
            case 'strike':
                editor.chain().focus().toggleStrike().run();
                break;
            case 'bulletList':
                editor.chain().focus().toggleBulletList().run();
                break;
            case 'orderedList':
                editor.chain().focus().toggleOrderedList().run();
                break;
        }
        // Trigger immediate update for button states after formatting
        lastUpdateRef.current = 0; // Reset throttle to allow immediate update
        throttledUpdate();
    };

    const isActive = (command) => {
        const editor = editorInstanceRef.current;
        if (!editor || !isReady) return false;
        return editor.isActive(command);
    };

    return (
        <div className="mini-editor-wrapper">
            <div className="cms-editor-toolbar mini-editor-toolbar">
                <div className="cms-toolbar-group">
                    <button
                        type="button"
                        className={`cms-editor-btn ${isActive('bold') ? 'active' : ''}`}
                        onClick={() => handleFormat('bold')}
                        title="Bold (Ctrl+B)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`cms-editor-btn ${isActive('italic') ? 'active' : ''}`}
                        onClick={() => handleFormat('italic')}
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
                        className={`cms-editor-btn ${isActive('underline') ? 'active' : ''}`}
                        onClick={() => handleFormat('underline')}
                        title="Underline (Ctrl+U)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                            <line x1="4" y1="21" x2="20" y2="21"></line>
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`cms-editor-btn ${isActive('strike') ? 'active' : ''}`}
                        onClick={() => handleFormat('strike')}
                        title="Strikethrough"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 3.6 3.9h.2m8.2 3.7c.3.4.4.8.4 1.3 0 2.9-2.7 3.6-6.2 3.6-2.3 0-4.4-.3-6.2-.9M4 11.5h16"></path>
                        </svg>
                    </button>
                </div>
                <div className="cms-toolbar-group">
                    <button
                        type="button"
                        className={`cms-editor-btn ${isActive('bulletList') ? 'active' : ''}`}
                        onClick={() => handleFormat('bulletList')}
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
                        className={`cms-editor-btn ${isActive('orderedList') ? 'active' : ''}`}
                        onClick={() => handleFormat('orderedList')}
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
            <div ref={editorRef} className="mini-editor-content" />
        </div>
    );
}
