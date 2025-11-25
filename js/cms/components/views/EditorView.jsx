/**
 * Editor View Component
 */

import { useState, useEffect } from 'preact/hooks';
import { guideForm, currentGuide, editorInstance, resetGuideForm, updateGuideForm } from '../../store/state.js';
import { GuideForm } from '../content/GuideForm.jsx';
import { TipTapEditor } from '../editor/TipTapEditor.jsx';
import { EditorToolbar } from '../editor/EditorToolbar.jsx';
import { Button } from '../ui/Button.jsx';
import { formatStepCardsHTML } from '../../utils/helpers.js';
import { LinkModal } from '../ui/LinkModal.jsx';
import { ImageSettingsModal } from '../editor/ImageSettingsModal.jsx';
import { DraftNotice } from '../content/DraftNotice.jsx';
import { GuideMetadata } from '../content/GuideMetadata.jsx';

export function EditorView({ 
    onSave, 
    onCancel, 
    onThumbnailUpload,
    onInsertImage,
    onDiscardDraft,
    title 
}) {
    const [linkPromptOpen, setLinkPromptOpen] = useState(false);
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [imageSettingsOpen, setImageSettingsOpen] = useState(false);
    
    const guide = currentGuide.value;
    const form = guideForm.value;
    const editor = editorInstance.value;

    // Add image edit button overlays when editor updates
    useEffect(() => {
        if (!editor) return;

        const addImageOverlays = () => {
            const editorElement = document.querySelector('.tiptap-editor');
            if (!editorElement) return;

            const images = editorElement.querySelectorAll('.guide-image');
            
            images.forEach((imageWrapper) => {
                if (imageWrapper.querySelector('.cms-image-edit-btn')) return;
                
                const editBtn = document.createElement('button');
                editBtn.className = 'cms-image-edit-btn';
                editBtn.type = 'button';
                editBtn.title = 'Edit image settings';
                editBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                `;
                
                editBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const pos = editor.view.posAtDOM(imageWrapper, 0);
                    editor.chain().focus().setNodeSelection(pos).run();
                    
                    setTimeout(() => setImageSettingsOpen(true), 50);
                });
                
                imageWrapper.appendChild(editBtn);
                imageWrapper.style.position = 'relative';
            });
        };

        const updateHandler = () => {
            setTimeout(addImageOverlays, 0);
        };

        editor.on('update', updateHandler);
        setTimeout(addImageOverlays, 100);

        return () => {
            editor.off('update', updateHandler);
        };
    }, [editor]);

    const handleSave = (status) => {
        if (!form.title || !form.slug) {
            alert('Please fill in all required fields (Title and Slug)');
            return;
        }

        let content = editor ? editor.getHTML() : '';
        content = formatStepCardsHTML(content);

        onSave({
            ...form,
            status,
            content,
        });
    };

    const handleContentChange = (html) => {
        // Update the content in the form state
        updateGuideForm('content', html);
    };

    const handleAddStepCard = () => {
        if (editor) {
            editor.chain().focus().setStepCard({ title: 'Step Title' }).run();
        }
    };

    const handleAddInfoBox = () => {
        if (editor) {
            editor.chain().focus().setInfoBox().run();
        }
    };

    const handleOpenLinkModal = () => {
        setLinkPromptOpen(true);
    };

    const handleAddLink = (url, displayText) => {
        if (!editor || !url) return;

        if (displayText) {
            // No selection - insert new text with link
            editor.chain()
                .focus()
                .insertContent(`<a href="${url}">${displayText}</a>`)
                .run();
        } else {
            // Has selection - apply link to selected text
            editor.chain().focus().setLink({ href: url }).run();
        }
        
        setLinkPromptOpen(false);
    };

    // Determine button text based on guide state
    const getButtonText = () => {
        if (!guide || !guide.id) {
            return {
                publish: 'Publish',
                draft: 'Save Draft'
            };
        }

        if (guide.status === 'published' && guide.draft_content) {
            return {
                publish: 'Publish Draft',
                draft: 'Update Draft'
            };
        }

        if (guide.status === 'published') {
            return {
                publish: 'Update Published',
                draft: 'Save as Draft'
            };
        }

        return {
            publish: 'Publish',
            draft: 'Save Draft'
        };
    };

    const buttonText = getButtonText();

    return (
        <div className="cms-view" id="editorView">
            <div className="cms-content-header">
                <h1 className="cms-content-title">{title}</h1>
                <div className="cms-editor-actions">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="secondary" color="orange" onClick={() => handleSave('draft')}>
                        {buttonText.draft}
                    </Button>
                    <Button variant="primary" color="success" onClick={() => handleSave('published')}>
                        {buttonText.publish}
                    </Button>
                </div>
            </div>

            <DraftNotice guide={guide} onDiscardDraft={onDiscardDraft} />

            <GuideMetadata guide={guide} />

            <div className="cms-editor-container">
                <GuideForm onThumbnailUpload={onThumbnailUpload} />

                <div className="cms-form-section">
                    <label className="cms-label">Content</label>
                    <EditorToolbar editor={editor} onAddLink={handleOpenLinkModal} />
                    
                    {/* Custom Editor Elements */}
                    <div className="cms-toolbar-group" style={{ marginTop: '12px', marginBottom: '12px', display: 'flex', gap: '4px', width: 'fit-content' }}>
                        <button
                            type="button"
                            className="cms-editor-btn cms-btn-indigo"
                            onClick={onInsertImage}
                            title="Insert Image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            Insert Image
                        </button>
                        
                        <button
                            type="button"
                            className="cms-editor-btn cms-btn-purple"
                            onClick={handleAddStepCard}
                            title="Add Step Card"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="9" x2="15" y2="9"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                            Add Step Card
                        </button>
                        
                        <button
                            type="button"
                            className="cms-editor-btn cms-btn-teal"
                            onClick={handleAddInfoBox}
                            title="Add Info Box"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            Add Info Box
                        </button>
                        
                    </div>

                    <TipTapEditor 
                        content={form.content || ''}
                        onChange={handleContentChange}
                    />
                </div>
            </div>
            
            {/* Link Modal */}
            <LinkModal
                isOpen={linkPromptOpen}
                hasSelection={editor && !editor.state.selection.empty}
                onSubmit={handleAddLink}
                onCancel={() => setLinkPromptOpen(false)}
            />

            {/* Image Settings Modal */}
            <ImageSettingsModal
                isOpen={imageSettingsOpen}
                onClose={() => setImageSettingsOpen(false)}
            />
        </div>
    );
}

