/**
 * TipTap Editor Component
 */

import { useEffect, useRef } from 'preact/hooks';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { editorInstance } from '../../store/state.js';
import { StepCard, InfoBox, GuideImage, Icon } from '../../../tiptap-extensions.js';
import { ExitLinkOnSpace } from '../../utils/tiptap-helpers.js';

export function TipTapEditor({ content, onChange }) {
    const editorRef = useRef(null);
    // Track when we're programmatically setting content to avoid infinite loops
    const isSettingContent = useRef(false);
    // Track the last content we received from props to detect external changes
    const lastExternalContent = useRef(content);

    useEffect(() => {
        if (!editorRef.current) return;

        const editor = new Editor({
            element: editorRef.current,
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3, 4],
                    },
                }),
                Image,
                Link.configure({
                    openOnClick: false,
                    HTMLAttributes: {
                        target: '_blank',
                        rel: 'noopener noreferrer',
                    },
                    // Exit link mark when typing space at the end
                    autolink: false,
                }),
                Underline,
                TextAlign.configure({
                    types: ['heading', 'paragraph'],
                }),
                TextStyle,
                Color,
                StepCard,
                InfoBox,
                GuideImage,
                Icon,
                ExitLinkOnSpace,
            ],
            content: content,
            editorProps: {
                attributes: {
                    class: 'tiptap-editor',
                },
            },
            onUpdate: ({ editor: ed }) => {
                // Skip onChange if we're programmatically setting content
                if (isSettingContent.current) return;
                
                if (onChange) {
                    const html = ed.getHTML();
                    // Update our tracking ref so we don't try to re-set this content
                    lastExternalContent.current = html;
                    onChange(html);
                }
            },
        });

        editorInstance.value = editor;

        return () => {
            editor.destroy();
            editorInstance.value = null;
        };
    }, []);

    // Update content when prop changes from EXTERNAL source (e.g., loading a different guide)
    useEffect(() => {
        const editor = editorInstance.value;
        if (!editor) return;
        
        // Only update if the content prop changed from an external source
        // (not from our own onUpdate callback)
        if (content !== lastExternalContent.current) {
            lastExternalContent.current = content;
            isSettingContent.current = true;
            editor.commands.setContent(content);
            isSettingContent.current = false;
        }
    }, [content]);

    return <div ref={editorRef} className="cms-editor" />;
}

