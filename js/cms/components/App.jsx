/**
 * Main CMS Application Component
 * Now supports multiple content types through generic architecture
 */

import { useEffect, useState } from 'preact/hooks';
import { 
    currentUser, 
    activeContentType,
    contentByType,
    setContentForType,
    currentContent,
    isLoadingContent,
    currentView,
    contentForm,
    resetContentForm,
    updateContentForm,
    editorInstance,
    switchContentType,
} from '../store/state.js';
import API from '../services/api.js';
import ImageService from '../services/image.js';
import { showToast } from '../utils/toast.js';
import { getContentTypeConfig } from '../config/contentTypes.js';
import { Navbar } from './layout/Navbar.jsx';
import { Sidebar } from './layout/Sidebar.jsx';
import { ContentList } from './content/ContentList.jsx';
import { EditorView } from './views/EditorView.jsx';
import { Modal, ConfirmModal } from './ui/Modal.jsx';
import { LoadingSpinner } from './ui/Loading.jsx';

export function App() {
    const [isUploading, setIsUploading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });
    const [contentToDelete, setContentToDelete] = useState(null);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Check authentication
            const user = await API.getCurrentUser();
            currentUser.value = user;

            // Load guides by default
            await loadContentForType(activeContentType.value);
        } catch (error) {
            console.error('Initialization error:', error);
            window.location.href = '/api/auth/login';
        }
    };

    const loadContentForType = async (type) => {
        try {
            isLoadingContent.value = true;
            const data = await API.listContent(type);
            
            // Store content based on content type
            const contentKey = type === 'guides' ? 'guides' : type;
            setContentForType(type, data[contentKey] || []);
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            showToast(`Failed to load ${type}`, 'error');
        } finally {
            isLoadingContent.value = false;
        }
    };

    const handleContentTypeChange = async (type) => {
        switchContentType(type);
        await loadContentForType(type);
    };

    const handleCreateNew = () => {
        const type = activeContentType.value;
        resetContentForm(type);
        currentContent.value = null;
        currentView.value = 'editor';
    };

    const handleEditContent = async (item) => {
        try {
            const type = activeContentType.value;
            const config = getContentTypeConfig(type);
            const data = await API.getContent(type, item.id);
            const fullItem = data[config.apiEndpoint.slice(0, -1)] || data.guide || data.news;

            currentContent.value = fullItem;
            
            // Build form data based on content type fields
            const formData = {
                type,
                id: fullItem.id,
                status: fullItem.status,
            };

            // Map all fields from config
            Object.keys(config.fields).forEach(fieldKey => {
                if (fieldKey === 'content') {
                    formData.content = fullItem.draft_content || fullItem.content;
                } else {
                    formData[fieldKey] = fullItem[fieldKey] || config.fields[fieldKey].default || '';
                }
            });

            contentForm.value = formData;
            currentView.value = 'editor';
        } catch (error) {
            console.error('Error loading content:', error);
            showToast('Failed to load content', 'error');
        }
    };

    const handleDeleteContent = (item) => {
        setContentToDelete(item);
        const config = getContentTypeConfig(activeContentType.value);
        setConfirmModal({
            isOpen: true,
            message: `Are you sure you want to delete this ${config.labelSingular.toLowerCase()}? This action cannot be undone.`,
            onConfirm: async () => {
                await confirmDelete();
            },
        });
    };

    const confirmDelete = async () => {
        try {
            const type = activeContentType.value;
            await API.deleteContent(type, contentToDelete.id);
            showToast('Deleted successfully', 'success');
            await loadContentForType(type);
            setConfirmModal({ isOpen: false, message: '', onConfirm: null });
            setContentToDelete(null);
        } catch (error) {
            console.error('Error deleting content:', error);
            showToast('Failed to delete', 'error');
        }
    };

    const handleSaveContent = async (data) => {
        try {
            const type = activeContentType.value;
            const config = getContentTypeConfig(type);
            
            if (data.id) {
                const result = await API.updateContent(type, data.id, data);
                
                // Show appropriate message
                let message = result.action_message || (data.status === 'published' ? `${config.labelSingular} published successfully!` : 'Draft saved successfully!');
                if (result.is_contributor) {
                    message += ' 🎉 You\'ve been added as a contributor!';
                }
                
                showToast(message, 'success', 4000);
                
                // If published, update the current content state
                if (data.status === 'published') {
                    const updatedData = await API.getContent(type, data.id);
                    const fullItem = updatedData[config.apiEndpoint.slice(0, -1)] || updatedData.guide || updatedData.news;
                    currentContent.value = fullItem;
                    
                    contentForm.value = {
                        ...contentForm.value,
                        status: 'published',
                        draft_content: null
                    };
                } else if (data.status === 'draft' && data.id) {
                    const updatedData = await API.getContent(type, data.id);
                    const fullItem = updatedData[config.apiEndpoint.slice(0, -1)] || updatedData.guide || updatedData.news;
                    currentContent.value = fullItem;
                }
            } else {
                await API.createContent(type, data);
                showToast(`${config.labelSingular} created successfully!`, 'success');
            }

            await loadContentForType(type);
            
            if (data.status === 'published' || !data.id) {
                currentView.value = 'list';
            }
        } catch (error) {
            console.error('Error saving content:', error);
            showToast('Failed to save', 'error');
        }
    };

    const handleDiscardDraft = async () => {
        const item = currentContent.value;
        const type = activeContentType.value;
        if (!item || !item.id) return;

        setConfirmModal({
            isOpen: true,
            message: 'Are you sure you want to discard your draft changes? This will reload the published version.',
            onConfirm: async () => {
                try {
                    const config = getContentTypeConfig(type);
                    
                    // Rebuild data object with all required fields
                    const saveData = {
                        status: 'published',
                    };
                    
                    Object.keys(config.fields).forEach(fieldKey => {
                        if (fieldKey === 'content') {
                            saveData.content = item.content;
                        } else if (item[fieldKey] !== undefined) {
                            saveData[fieldKey] = item[fieldKey];
                        }
                    });
                    
                    await API.updateContent(type, item.id, saveData);

                    // Reload the content
                    const data = await API.getContent(type, item.id);
                    const updatedItem = data[config.apiEndpoint.slice(0, -1)] || data.guide || data.news;
                    
                    currentContent.value = updatedItem;
                    contentForm.value = {
                        ...contentForm.value,
                        content: updatedItem.content,
                        draft_content: null
                    };

                    // Update editor content
                    if (editorInstance.value) {
                        editorInstance.value.commands.setContent(updatedItem.content);
                    }

                    showToast('Draft changes discarded', 'success');
                    await loadContentForType(type);
                    
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                } catch (error) {
                    console.error('Error discarding draft:', error);
                    showToast('Failed to discard draft', 'error');
                }
            },
        });
    };

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const compressed = await ImageService.compressImage(file, 1200, 630);
            const result = await API.uploadImage(compressed);
            
            // Update the appropriate field based on content type
            const config = getContentTypeConfig(activeContentType.value);
            const imageField = config.fields.thumbnail ? 'thumbnail' : 'featured_image';
            updateContentForm(imageField, result.url);
            showToast('Image uploaded successfully', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Failed to upload image', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleInsertImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                setIsUploading(true);
                const compressed = await ImageService.compressImage(file, 1200);
                const result = await API.uploadImage(compressed);
                
                // Insert into editor using GuideImage extension
                const editor = editorInstance.value;
                if (editor) {
                    const { state } = editor;
                    const { selection } = state;
                    const isAtStart = selection.from === 0 || selection.from === 1;
                    
                    if (isAtStart) {
                        editor.chain()
                            .focus()
                            .insertContent([
                                { type: 'paragraph' },
                                { type: 'guideImage', attrs: { src: result.url, alt: file.name } },
                                { type: 'paragraph' }
                            ])
                            .run();
                    } else {
                        editor.chain()
                            .focus()
                            .setGuideImage({ src: result.url, alt: file.name })
                            .command(({ tr, dispatch }) => {
                                const paragraph = editor.schema.nodes.paragraph.create();
                                if (dispatch) {
                                    tr.insert(tr.selection.to, paragraph);
                                    tr.setSelection(editor.state.selection.constructor.near(tr.doc.resolve(tr.selection.to)));
                                }
                                return true;
                            })
                            .run();
                    }
                }
                
                showToast('Image uploaded successfully', 'success');
            } catch (error) {
                console.error('Error uploading image:', error);
                showToast('Failed to upload image', 'error');
            } finally {
                setIsUploading(false);
            }
        };
        input.click();
    };

    const handleViewChange = (view) => {
        if (view === 'new') {
            handleCreateNew();
        } else {
            currentView.value = view;
        }
    };

    const handleCancelEdit = () => {
        currentView.value = 'list';
        resetContentForm();
        currentContent.value = null;
    };

    const view = currentView.value;
    const config = getContentTypeConfig(activeContentType.value);
    const editorTitle = contentForm.value.id ? `Edit ${config.labelSingular}` : `Create New ${config.labelSingular}`;

    return (
        <div className="cms-app">
            <Navbar />
            
            <div className="cms-container">
                <Sidebar 
                    onViewChange={handleViewChange}
                    onContentTypeChange={handleContentTypeChange}
                />
                
                <main className="cms-content">
                    {view === 'list' && (
                        <ContentList
                            onCreateNew={handleCreateNew}
                            onEdit={handleEditContent}
                            onDelete={handleDeleteContent}
                        />
                    )}

                    {view === 'editor' && (
                        <EditorView
                            title={editorTitle}
                            onSave={handleSaveContent}
                            onCancel={handleCancelEdit}
                            onThumbnailUpload={handleThumbnailUpload}
                            onInsertImage={handleInsertImage}
                            onDiscardDraft={handleDiscardDraft}
                        />
                    )}
                </main>
            </div>

            {/* Upload Modal */}
            <Modal 
                isOpen={isUploading} 
                onClose={() => {}}
                title="Uploading Image"
                showOverlay={true}
            >
                <LoadingSpinner message="Compressing and uploading image..." />
            </Modal>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
            />
        </div>
    );
}
