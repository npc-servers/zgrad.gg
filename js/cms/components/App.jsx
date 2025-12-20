/**
 * Main CMS Application Component
 * Now supports multiple content types through generic architecture
 */

import { useEffect, useState, useRef } from 'preact/hooks';
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
    activeLocks,
    currentLock,
    onLogout,
    isDirty,
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
import { ImageUploadModal } from './ui/ImageUploadModal.jsx';

export function App() {
    const [isUploading, setIsUploading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });
    const [imageUploadModal, setImageUploadModal] = useState({ isOpen: false, mode: null, fieldName: null });
    const heartbeatInterval = useRef(null);
    const lockPollInterval = useRef(null);

    useEffect(() => {
        initializeApp();
        
        // Register cleanup callback for logout
        const unsubscribe = onLogout(() => {
            stopHeartbeat();
            stopLockPolling();
        });
        
        // Cleanup on unmount
        return () => {
            unsubscribe();
            stopHeartbeat();
            stopLockPolling();
            releaseCurrentLock();
        };
    }, []);

    // Release lock when leaving page
    useEffect(() => {
        const handleBeforeUnload = () => {
            releaseCurrentLock();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const initializeApp = async () => {
        try {
            // Check authentication
            const user = await API.getCurrentUser();
            currentUser.value = user;

            // Load guides by default
            await loadContentForType(activeContentType.value);
            
            // Start polling for locks
            startLockPolling();
        } catch (error) {
            console.error('Initialization error:', error);
            window.location.href = '/api/auth/login';
        }
    };

    // Lock polling functions
    const startLockPolling = () => {
        fetchLocks();
        lockPollInterval.current = setInterval(fetchLocks, 5000); // Poll every 5 seconds for faster updates
    };

    const stopLockPolling = () => {
        if (lockPollInterval.current) {
            clearInterval(lockPollInterval.current);
            lockPollInterval.current = null;
        }
    };

    const fetchLocks = async () => {
        try {
            const data = await API.getLocks();
            // Create a new array to ensure signal reactivity
            activeLocks.value = [...(data.locks || [])];
        } catch (error) {
            // Don't log errors if we're logging out or session ended
            if (error.message !== 'Session ended' && error.message !== 'Unauthorized') {
                console.error('Error fetching locks:', error);
            }
        }
    };

    // Heartbeat functions
    const startHeartbeat = (contentType, contentId) => {
        stopHeartbeat();
        heartbeatInterval.current = setInterval(async () => {
            try {
                await API.heartbeatLock(contentType, contentId);
            } catch (error) {
                console.error('Heartbeat failed:', error);
                showToast('Lost editing lock - someone else may edit this content', 'warning');
                stopHeartbeat();
            }
        }, 30000); // Every 30 seconds
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
    };

    // Lock management functions
    const acquireLock = async (contentType, contentId) => {
        try {
            const result = await API.acquireLock(contentType, contentId);
            
            if (result.success) {
                currentLock.value = result.lock;
                startHeartbeat(contentType, contentId);
                return { success: true };
            } else if (result.locked_by) {
                return { 
                    success: false, 
                    locked_by: result.locked_by 
                };
            }
            
            return { success: false };
        } catch (error) {
            console.error('Error acquiring lock:', error);
            return { success: false, error: error.message };
        }
    };

    const releaseCurrentLock = async () => {
        const lock = currentLock.value;
        if (lock) {
            try {
                await API.releaseLock(lock.content_type, lock.content_id);
                // Immediately refresh locks to update the UI
                await fetchLocks();
            } catch (error) {
                console.error('Error releasing lock:', error);
            }
            currentLock.value = null;
            stopHeartbeat();
        }
    };

    const loadContentForType = async (type) => {
        try {
            isLoadingContent.value = true;
            const data = await API.listContent(type);
            
            // Store content based on content type
            const contentKey = type === 'guides' ? 'guides' : type;
            setContentForType(type, data[contentKey] || []);
            
            // Refresh locks
            await fetchLocks();
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            showToast(`Failed to load ${type}`, 'error');
        } finally {
            isLoadingContent.value = false;
        }
    };

    const handleContentTypeChange = async (type) => {
        // Check for unsaved changes before switching
        if (isDirty.value && currentView.value === 'editor') {
            setConfirmModal({
                isOpen: true,
                message: 'You have unsaved changes. Are you sure you want to switch? Your changes will be lost.',
                onConfirm: async () => {
                    await releaseCurrentLock();
                    switchContentType(type);
                    await loadContentForType(type);
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                },
            });
            return;
        }
        
        // Release any existing lock before switching
        await releaseCurrentLock();
        switchContentType(type);
        await loadContentForType(type);
    };

    const handleCreateNew = async () => {
        // Release any existing lock first
        await releaseCurrentLock();
        
        const type = activeContentType.value;
        resetContentForm(type);
        currentContent.value = null;
        currentView.value = 'editor';
    };

    const handleEditContent = async (item) => {
        try {
            const type = activeContentType.value;
            const config = getContentTypeConfig(type);
            
            // Try to acquire lock first
            const lockResult = await acquireLock(type, item.id);
            
            if (!lockResult.success) {
                if (lockResult.locked_by) {
                    const lockedBy = lockResult.locked_by;
                    showToast(`This ${config.labelSingular.toLowerCase()} is currently being edited by ${lockedBy.username}`, 'warning', 5000);
                } else {
                    showToast('Could not acquire editing lock', 'error');
                }
                return;
            }
            
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
            await releaseCurrentLock();
        }
    };

    const handleDeleteContent = (item) => {
        const config = getContentTypeConfig(activeContentType.value);
        setConfirmModal({
            isOpen: true,
            message: `Are you sure you want to delete this ${config.labelSingular.toLowerCase()}? This action cannot be undone.`,
            onConfirm: async () => {
                await confirmDelete(item);
            },
        });
    };

    const confirmDelete = async (item) => {
        if (!item || !item.id) {
            console.error('No item to delete');
            showToast('Failed to delete: No item selected', 'error');
            setConfirmModal({ isOpen: false, message: '', onConfirm: null });
            return;
        }

        const type = activeContentType.value;
        
        // Optimistic update - remove from list immediately for instant feedback
        const currentList = contentByType.value[type] || [];
        const updatedList = currentList.filter(i => i.id !== item.id);
        setContentForType(type, updatedList);
        
        // Close modal immediately
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });

        try {
            await API.deleteContent(type, item.id);
            showToast('Deleted successfully', 'success');
            // Refresh to sync with server (in case of any discrepancies)
            await loadContentForType(type);
        } catch (error) {
            console.error('Error deleting content:', error);
            showToast('Failed to delete', 'error');
            // Revert optimistic update on error
            await loadContentForType(type);
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
                // Release lock when leaving editor
                await releaseCurrentLock();
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

    const handleImageUpload = (e, fieldName) => {
        // Open the modal for thumbnail/image field uploads
        // We'll store the fieldName so we know where to save the result
        setImageUploadModal({ isOpen: true, mode: 'field', fieldName });
    };

    const handleInsertImage = () => {
        setImageUploadModal({ isOpen: true, mode: 'editor', fieldName: null });
    };

    const handleImageUploadFromModal = async (file, options = {}) => {
        const { mode, fieldName } = imageUploadModal;
        setImageUploadModal({ isOpen: false, mode: null, fieldName: null });
        
        try {
            setIsUploading(true);
            
            // Use different dimensions based on mode
            const maxWidth = mode === 'field' ? 1200 : 1200;
            const maxHeight = mode === 'field' ? 630 : 1200;
            
            const compressed = await ImageService.compressImage(file, maxWidth, maxHeight, options);
            const result = await API.uploadImage(compressed);
            
            if (mode === 'field' && fieldName) {
                // Update the form field (thumbnail, image, etc.)
                updateContentForm(fieldName, result.url);
            } else if (mode === 'editor') {
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
            }
            
            showToast('Image uploaded successfully', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Failed to upload image', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleViewChange = (view) => {
        if (view === 'new') {
            handleCreateNew();
        } else {
            currentView.value = view;
        }
    };

    const handleCancelEdit = async () => {
        // Check for unsaved changes
        if (isDirty.value) {
            setConfirmModal({
                isOpen: true,
                message: 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
                onConfirm: async () => {
                    // Release lock when canceling
                    await releaseCurrentLock();
                    
                    currentView.value = 'list';
                    resetContentForm();
                    currentContent.value = null;
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                },
            });
            return;
        }
        
        // Release lock when canceling
        await releaseCurrentLock();
        
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
                            onImageUpload={handleImageUpload}
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

            {/* Image Upload Modal */}
            <ImageUploadModal
                isOpen={imageUploadModal.isOpen}
                onUpload={handleImageUploadFromModal}
                onCancel={() => setImageUploadModal({ isOpen: false, mode: null, fieldName: null })}
            />

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
