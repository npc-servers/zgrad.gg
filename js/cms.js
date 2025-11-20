// CMS JavaScript - Main Application Logic
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { StepCard, InfoBox, GuideImage, Icon } from './tiptap-extensions.js';

let currentUser = null;
let editor = null;
let currentGuideId = null;
let guides = [];

// Toast Notification System
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `cms-toast cms-toast-${type}`;
    toast.innerHTML = `
        <div class="cms-toast-icon">
            ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </div>
        <div class="cms-toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Custom Modal Functions
function showConfirmModal(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'cms-custom-modal-overlay';
    modal.innerHTML = `
        <div class="cms-custom-modal">
            <div class="cms-custom-modal-header">
                <h3>Confirm Action</h3>
            </div>
            <div class="cms-custom-modal-body">
                <p>${message}</p>
            </div>
            <div class="cms-custom-modal-actions">
                <button class="cms-btn cms-btn-secondary" id="customModalCancel">Cancel</button>
                <button class="cms-btn cms-btn-danger" id="customModalConfirm">Confirm</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('customModalConfirm').onclick = () => {
        document.body.removeChild(modal);
        onConfirm();
    };
    
    document.getElementById('customModalCancel').onclick = () => {
        document.body.removeChild(modal);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

function showPromptModal(message, placeholder, onSubmit) {
    const modal = document.createElement('div');
    modal.className = 'cms-custom-modal-overlay';
    modal.innerHTML = `
        <div class="cms-custom-modal">
            <div class="cms-custom-modal-header">
                <h3>${message}</h3>
            </div>
            <div class="cms-custom-modal-body">
                <input type="text" class="cms-input" id="customModalInput" placeholder="${placeholder}" value="${placeholder}">
            </div>
            <div class="cms-custom-modal-actions">
                <button class="cms-btn cms-btn-secondary" id="customModalCancel">Cancel</button>
                <button class="cms-btn cms-btn-primary cms-btn-success" id="customModalSubmit">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const input = document.getElementById('customModalInput');
    input.focus();
    input.select();
    
    const submit = () => {
        const value = input.value.trim();
        if (value) {
            document.body.removeChild(modal);
            onSubmit(value);
        }
    };
    
    document.getElementById('customModalSubmit').onclick = submit;
    document.getElementById('customModalCancel').onclick = () => {
        document.body.removeChild(modal);
    };
    
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            submit();
        }
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

// Initialize CMS on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[CMS] Initializing CMS application...');
    
    try {
        // Check authentication
        console.log('[CMS] Checking authentication...');
        await checkAuth();
        console.log('[CMS] Authentication successful');
        
        // Initialize UI
        console.log('[CMS] Initializing UI...');
        initializeUI();
        console.log('[CMS] UI initialized');
        
        // Load guides
        console.log('[CMS] Loading guides...');
        await loadGuides();
        console.log('[CMS] CMS initialization complete');
    } catch (error) {
        console.error('[CMS] Initialization error:', error);
        alert('Failed to initialize CMS: ' + error.message);
    }
});

// Authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
            window.location.href = '/api/auth/login';
            return;
        }
        
        currentUser = await response.json();
        displayUserInfo(currentUser);
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/api/auth/login';
    }
}

function displayUserInfo(user) {
    const userInfoEl = document.getElementById('userInfo');
    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    userInfoEl.innerHTML = `
        <img src="${avatarUrl}" alt="${user.username}" class="cms-user-avatar">
        <span class="cms-user-name">${escapeHtml(user.username)}</span>
    `;
}

// UI Initialization
function initializeUI() {
    // Sidebar navigation
    document.querySelectorAll('.cms-sidebar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
            
            // Update active state
            document.querySelectorAll('.cms-sidebar-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/auth/logout');
        window.location.href = '/';
    });
    
    // Create guide button
    document.getElementById('createGuideBtn').addEventListener('click', () => {
        createNewGuide();
    });
    
    // Editor actions
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        switchView('guides');
    });
    
    document.getElementById('saveDraftBtn').addEventListener('click', () => {
        saveGuide('draft');
    });
    
    document.getElementById('publishBtn').addEventListener('click', () => {
        saveGuide('published');
    });
    
    // Title to slug auto-generation
    document.getElementById('guideTitle').addEventListener('input', (e) => {
        if (!currentGuideId) {
            const slug = generateSlug(e.target.value);
            document.getElementById('guideSlug').value = slug;
        }
    });
    
    // Thumbnail upload
    document.getElementById('thumbnailUpload').addEventListener('change', async (e) => {
        await uploadThumbnail(e.target.files[0]);
    });
    
    // Thumbnail preview
    document.getElementById('guideThumbnail').addEventListener('input', (e) => {
        updateThumbnailPreview(e.target.value);
    });
    
    // Insert image button
    document.getElementById('insertImageBtn').addEventListener('click', () => {
        document.getElementById('contentImageUpload').click();
    });
    
    document.getElementById('contentImageUpload').addEventListener('change', async (e) => {
        await insertImage(e.target.files[0]);
    });
}

function switchView(view) {
    document.querySelectorAll('.cms-view').forEach(v => v.style.display = 'none');
    
    if (view === 'guides') {
        document.getElementById('guidesView').style.display = 'block';
    } else if (view === 'new') {
        createNewGuide();
    }
}

// Guides Management
async function loadGuides() {
    const listEl = document.getElementById('guidesList');
    listEl.innerHTML = '<div class="cms-loading"><div class="cms-spinner"></div><p>Loading guides...</p></div>';
    
    try {
        const response = await fetch('/api/guides/list');
        const data = await response.json();
        
        guides = data.guides || [];
        displayGuides(guides);
    } catch (error) {
        console.error('Error loading guides:', error);
        listEl.innerHTML = '<div class="cms-error">Failed to load guides. Please try again.</div>';
    }
}

function displayGuides(guides) {
    const listEl = document.getElementById('guidesList');
    
    if (guides.length === 0) {
        listEl.innerHTML = `
            <div class="cms-empty">
                <p>No guides yet. Create your first guide!</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = guides.map(guide => createGuideCard(guide)).join('');
    
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-guide-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const guideId = e.target.closest('.edit-guide-btn').dataset.id;
            editGuide(guideId);
        });
    });
    
    document.querySelectorAll('.delete-guide-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const guideId = e.target.closest('.delete-guide-btn').dataset.id;
            showConfirmModal('Are you sure you want to delete this guide? This action cannot be undone.', async () => {
                await deleteGuide(guideId);
            });
        });
    });
}

function createGuideCard(guide) {
    const createdDate = new Date(guide.created_at).toLocaleDateString();
    const thumbnailUrl = guide.thumbnail || '/images/placeholder.png';
    
    const viewCount = guide.view_count || 0;
    
    // Determine status badge text and styling
    let statusBadge = guide.status;
    let statusClass = guide.status;
    
    if (guide.draft_content && guide.status === 'published') {
        statusBadge = 'has draft';
        statusClass = 'has-draft';
    }
    
    // Visibility badge
    const visibilityBadge = guide.visibility === 'unlisted' 
        ? '<span class="cms-guide-status unlisted">unlisted</span>' 
        : '';
    
    return `
        <div class="cms-guide-card">
            <img src="${thumbnailUrl}" alt="${escapeHtml(guide.title)}" class="cms-guide-thumbnail">
            <div class="cms-guide-info">
                <div class="cms-guide-header">
                    <h3 class="cms-guide-title">${escapeHtml(guide.title)}</h3>
                    <div class="cms-guide-header-meta">
                        <span class="cms-guide-status ${statusClass}">${statusBadge}</span>
                        ${visibilityBadge}
                        <span class="cms-guide-views">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            ${viewCount.toLocaleString()}
                        </span>
                    </div>
                </div>
                <p class="cms-guide-description">${escapeHtml(guide.description || '')}</p>
                <div class="cms-guide-footer">
                    <div class="cms-guide-meta">
                        <span>Created: ${createdDate}</span>
                        <span>Slug: ${guide.slug}</span>
                    </div>
                    <div class="cms-guide-actions">
                        <button class="cms-btn cms-btn-secondary cms-guide-btn edit-guide-btn" data-id="${guide.id}">Edit</button>
                        <button class="cms-btn cms-btn-danger cms-guide-btn delete-guide-btn" data-id="${guide.id}">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createNewGuide() {
    currentGuideId = null;
    document.getElementById('editorTitle').textContent = 'Create New Guide';
    
    // Clear form
    document.getElementById('guideTitle').value = '';
    document.getElementById('guideSlug').value = '';
    document.getElementById('guideDescription').value = '';
    document.getElementById('guideThumbnail').value = '';
    document.getElementById('guideVisibility').value = 'public';
    document.getElementById('thumbnailPreview').style.display = 'none';
    
    // Remove any existing draft notice
    const existingNotice = document.getElementById('draftNotice');
    if (existingNotice) {
        existingNotice.remove();
    }
    
    // Reset button states
    document.getElementById('publishBtn').textContent = 'Publish';
    document.getElementById('saveDraftBtn').textContent = 'Save Draft';
    
    // Initialize or reset editor
    initializeEditor('');
    
    // Switch to editor view
    document.getElementById('guidesView').style.display = 'none';
    document.getElementById('editorView').style.display = 'block';
}

async function editGuide(guideId) {
    console.log('[CMS] Loading guide for editing:', guideId);
    
    try {
        const response = await fetch(`/api/guides/${guideId}`);
        const data = await response.json();
        const guide = data.guide;
        const contributors = data.contributors || [];
        
        console.log('[CMS] Guide loaded:', {
            id: guide.id,
            title: guide.title,
            status: guide.status,
            hasDraft: !!guide.draft_content,
            author: guide.author_name,
            contributorCount: contributors.length
        });
        
        currentGuideId = guide.id;
        
        // Check if current user is the author
        const isAuthor = currentUser && guide.author_id === currentUser.id;
        const titleText = isAuthor ? 'Edit Guide' : 'Edit Guide (Contributing)';
        document.getElementById('editorTitle').textContent = titleText;
        
        // Fill form
        document.getElementById('guideTitle').value = guide.title;
        document.getElementById('guideSlug').value = guide.slug;
        document.getElementById('guideDescription').value = guide.description || '';
        document.getElementById('guideThumbnail').value = guide.thumbnail || '';
        document.getElementById('guideVisibility').value = guide.visibility || 'public';
        
        if (guide.thumbnail) {
            updateThumbnailPreview(guide.thumbnail);
        }
        
        // Show author and contributors info
        displayGuideAuthorship(guide, contributors, isAuthor);
        
        // Load draft content if it exists, otherwise load published content
        const contentToLoad = guide.draft_content || guide.content;
        
        // Show draft notice if there are draft changes
        if (guide.draft_content && guide.status === 'published') {
            showDraftNotice(guide);
        }
        
        // Initialize editor with content
        initializeEditor(contentToLoad);
        
        // Update button states based on guide status
        updateEditorButtonStates(guide);
        
        // Switch to editor view
        document.getElementById('guidesView').style.display = 'none';
        document.getElementById('editorView').style.display = 'block';
    } catch (error) {
        console.error('[CMS] Error loading guide:', error);
        alert('Failed to load guide');
    }
}

async function saveGuide(status) {
    const title = document.getElementById('guideTitle').value.trim();
    const slug = document.getElementById('guideSlug').value.trim();
    const description = document.getElementById('guideDescription').value.trim();
    const thumbnail = document.getElementById('guideThumbnail').value.trim();
    const visibility = document.getElementById('guideVisibility').value;
    let content = editor.getHTML();
    
    // Post-process step cards to match player-report.html structure
    content = formatStepCardsHTML(content);
    
    if (!title || !slug) {
        showToast('Please fill in all required fields (Title and Slug)', 'error');
        return;
    }
    
    try {
        const url = currentGuideId 
            ? `/api/guides/${currentGuideId}`
            : '/api/guides/create';
        
        const method = currentGuideId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                slug,
                description,
                thumbnail,
                content,
                status,
                visibility,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to save guide');
        }
        
        const result = await response.json();
        
        // Show appropriate message
        let message = result.action_message || (status === 'published' ? 'Guide published successfully!' : 'Draft saved successfully!');
        if (result.is_contributor) {
            message += ' 🎉 You\'ve been added as a contributor!';
        }
        
        showToast(message, 'success', 4000);
        
        console.log('[CMS] Guide saved:', {
            isContributor: result.is_contributor,
            status: status,
            actionMessage: result.action_message
        });
        
        // If we just published, update the UI to reflect no more draft
        if (status === 'published') {
            // Remove draft notice if present
            const draftNotice = document.getElementById('draftNotice');
            if (draftNotice) {
                draftNotice.remove();
            }
            
            // Update button states - create a temporary guide object with published status and no draft
            updateEditorButtonStates({ 
                status: 'published', 
                draft_content: null 
            });
        }
        // If we saved as draft on a published guide, show draft notice and update buttons
        else if (status === 'draft' && currentGuideId) {
            // Fetch the updated guide to get accurate state
            const guideResponse = await fetch(`/api/guides/${currentGuideId}`);
            const guideData = await guideResponse.json();
            const updatedGuide = guideData.guide;
            
            // Show draft notice if we now have draft changes on a published guide
            if (updatedGuide.status === 'published' && updatedGuide.draft_content) {
                showDraftNotice(updatedGuide);
            }
            
            // Update button states
            updateEditorButtonStates(updatedGuide);
        }
        
        // Reload guides and switch view
        await loadGuides();
        switchView('guides');
    } catch (error) {
        console.error('Error saving guide:', error);
        showToast('Failed to save guide. Please try again.', 'error');
    }
}

// Show draft notice when editing a guide with unsaved draft changes
function showDraftNotice(guide) {
    // Remove existing notice if present
    const existing = document.getElementById('draftNotice');
    if (existing) {
        existing.remove();
    }
    
    const notice = document.createElement('div');
    notice.id = 'draftNotice';
    notice.className = 'cms-draft-notice';
    notice.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; flex-shrink: 0;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
            <strong>You're editing draft changes</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; opacity: 0.9;">This guide is published, but you have unpublished draft changes. Publishing will update the live guide.</p>
        </div>
        <button class="cms-btn cms-btn-secondary cms-btn-sm" id="discardDraftBtn" style="margin-left: auto;">
            Discard Draft
        </button>
    `;
    
    const editorContainer = document.querySelector('.cms-editor-container');
    editorContainer.insertBefore(notice, editorContainer.firstChild);
    
    // Add discard draft button handler
    document.getElementById('discardDraftBtn').addEventListener('click', () => {
        showConfirmModal('Are you sure you want to discard your draft changes? This will reload the published version.', async () => {
            await discardDraft(guide.id);
        });
    });
}

// Discard draft changes and reload published version
async function discardDraft(guideId) {
    try {
        // Fetch the guide to get the published content
        const response = await fetch(`/api/guides/${guideId}`);
        const data = await response.json();
        const guide = data.guide;
        
        // Clear draft_content by saving the published content back with status='published'
        // This triggers the API to set draft_content = NULL
        const saveResponse = await fetch(`/api/guides/${guideId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: guide.title,
                slug: guide.slug,
                description: guide.description,
                thumbnail: guide.thumbnail,
                content: guide.content, // Use the published content
                status: 'published',
                visibility: guide.visibility,
            }),
        });
        
        if (!saveResponse.ok) {
            throw new Error('Failed to discard draft');
        }
        
        // Update editor with published content
        editor.commands.setContent(guide.content);
        
        // Remove draft notice
        const notice = document.getElementById('draftNotice');
        if (notice) {
            notice.remove();
        }
        
        showToast('Draft changes discarded', 'success');
        
        // Update button states - set draft_content to null since we discarded it
        updateEditorButtonStates({ 
            ...guide, 
            draft_content: null 
        });
        
        // Reload guides list to update badges
        await loadGuides();
    } catch (error) {
        console.error('Error discarding draft:', error);
        showToast('Failed to discard draft', 'error');
    }
}

// Update editor button states based on guide status
function updateEditorButtonStates(guide) {
    const publishBtn = document.getElementById('publishBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    
    // If guide is published and has draft changes
    if (guide.status === 'published' && guide.draft_content) {
        publishBtn.textContent = 'Publish Draft';
        saveDraftBtn.textContent = 'Update Draft';
    }
    // If guide is published without draft changes
    else if (guide.status === 'published') {
        publishBtn.textContent = 'Update Published';
        saveDraftBtn.textContent = 'Save as Draft';
    }
    // If guide is a draft
    else {
        publishBtn.textContent = 'Publish';
        saveDraftBtn.textContent = 'Save Draft';
    }
}

async function deleteGuide(guideId) {
    try {
        const response = await fetch(`/api/guides/${guideId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete guide');
        }
        
        await loadGuides();
    } catch (error) {
        console.error('Error deleting guide:', error);
        alert('Failed to delete guide');
    }
}

// Editor Initialization
function initializeEditor(content = '') {
    console.log('[CMS] Initializing TipTap editor...', { hasExistingEditor: !!editor });
    
    if (editor) {
        console.log('[CMS] Editor already exists, setting content...');
        editor.commands.setContent(content);
        return;
    }
    
    console.log('[CMS] Creating new Editor instance...');
    
    try {
        editor = new Editor({
        element: document.getElementById('editor'),
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
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
            },
        },
    });
    
    console.log('[CMS] Editor created successfully');
    
    // Setup custom toolbar
    console.log('[CMS] Setting up custom toolbar...');
    setupCustomToolbar();
    console.log('[CMS] Editor initialization complete');
    } catch (error) {
        console.error('[CMS] Failed to initialize editor:', error);
        alert('Failed to initialize editor: ' + error.message);
        throw error;
    }
}

// Image Upload
async function uploadThumbnail(file) {
    if (!file) return;
    
    console.log('[CMS] Starting thumbnail upload:', {
        name: file.name,
        size: file.size,
        type: file.type
    });
    
    showUploadModal();
    
    try {
        console.log('[CMS] Compressing thumbnail image...');
        const compressedFile = await compressImage(file, 1200, 630);
        console.log('[CMS] Compression complete:', {
            originalSize: file.size,
            compressedSize: compressedFile.size,
            reduction: Math.round((1 - compressedFile.size / file.size) * 100) + '%'
        });
        
        console.log('[CMS] Uploading thumbnail to server...');
        const url = await uploadImage(compressedFile);
        console.log('[CMS] Thumbnail upload successful:', url);
        
        document.getElementById('guideThumbnail').value = url;
        updateThumbnailPreview(url);
        
        hideUploadModal();
    } catch (error) {
        console.error('[CMS] Error uploading thumbnail:', error);
        alert('Failed to upload thumbnail: ' + error.message);
        hideUploadModal();
    }
}

async function insertImage(file) {
    if (!file) return;
    
    console.log('[CMS] Starting content image upload:', {
        name: file.name,
        size: file.size,
        type: file.type
    });
    
    showUploadModal();
    
    try {
        console.log('[CMS] Compressing content image...');
        const compressedFile = await compressImage(file, 1200);
        console.log('[CMS] Compression complete:', {
            originalSize: file.size,
            compressedSize: compressedFile.size,
            reduction: Math.round((1 - compressedFile.size / file.size) * 100) + '%'
        });
        
        console.log('[CMS] Uploading content image to server...');
        const url = await uploadImage(compressedFile);
        console.log('[CMS] Content image upload successful:', url);
        
        // Insert guide image into editor with paragraphs before and after it
        console.log('[CMS] Inserting image into editor...');
        
        const { state } = editor;
        const { selection } = state;
        
        // Check if we're at the start of the document
        const isAtStart = selection.from === 0 || selection.from === 1;
        
        if (isAtStart) {
            // Insert a paragraph before the image when at the start
            editor.chain()
                .focus()
                .insertContent([
                    { type: 'paragraph' },
                    { type: 'guideImage', attrs: { src: url, alt: file.name } },
                    { type: 'paragraph' }
                ])
                .run();
        } else {
            // Normal insertion with a paragraph after
            editor.chain()
                .focus()
                .setGuideImage({ src: url, alt: file.name })
                .command(({ tr, dispatch }) => {
                    // Insert an empty paragraph after the image so users can continue typing
                    const paragraph = editor.schema.nodes.paragraph.create();
                    if (dispatch) {
                        tr.insert(tr.selection.to, paragraph);
                        // Move cursor to the new paragraph
                        tr.setSelection(editor.state.selection.constructor.near(tr.doc.resolve(tr.selection.to)));
                    }
                    return true;
                })
                .run();
        }
        
        console.log('[CMS] Image inserted successfully');
        
        hideUploadModal();
    } catch (error) {
        console.error('[CMS] Error uploading image:', error);
        alert('Failed to upload image: ' + error.message);
        hideUploadModal();
    }
}

async function uploadImage(file) {
    console.log('[CMS] Preparing upload request...');
    const formData = new FormData();
    formData.append('image', file);
    
    console.log('[CMS] Sending POST request to /api/images/upload');
    console.log('[CMS] File details:', {
        name: file.name,
        size: file.size,
        type: file.type
    });
    
    try {
        const response = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
        });
        
        console.log('[CMS] Server response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            console.error('[CMS] Upload failed with status:', response.status);
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            console.error('[CMS] Error response:', error);
            throw new Error(error.error || error.details || 'Upload failed');
        }
        
        const data = await response.json();
        console.log('[CMS] Upload response data:', data);
        
        // Show warning if in dev mode
        if (data.dev_mode && data.warning) {
            console.warn('[CMS] Development Mode:', data.warning);
            alert('⚠️ Dev Mode: ' + data.warning);
        }
        
        return data.url;
    } catch (error) {
        console.error('[CMS] Upload request failed:', error);
        throw error;
    }
}

// Image Compression
async function compressImage(file, maxWidth, maxHeight = maxWidth) {
    console.log('[CMS] Starting image compression...', {
        maxWidth,
        maxHeight,
        originalSize: file.size
    });
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('[CMS] File read complete, creating image element...');
            const img = document.createElement('img');
            
            img.onload = () => {
                console.log('[CMS] Image loaded:', {
                    originalWidth: img.width,
                    originalHeight: img.height
                });
                
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        if (width > maxWidth) {
                            height = height * (maxWidth / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = width * (maxHeight / height);
                            height = maxHeight;
                        }
                    }
                }
                
                console.log('[CMS] Resizing to:', { width, height });
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                console.log('[CMS] Converting to blob...');
                canvas.toBlob((blob) => {
                    if (blob) {
                        console.log('[CMS] Blob created:', {
                            size: blob.size,
                            type: blob.type
                        });
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        console.log('[CMS] Compression complete');
                        resolve(compressedFile);
                    } else {
                        console.error('[CMS] Failed to create blob');
                        reject(new Error('Compression failed - blob is null'));
                    }
                }, 'image/jpeg', 0.85);
            };
            
            img.onerror = (error) => {
                console.error('[CMS] Failed to load image:', error);
                reject(new Error('Failed to load image'));
            };
            
            console.log('[CMS] Setting image src...');
            img.src = e.target.result;
        };
        
        reader.onerror = (error) => {
            console.error('[CMS] Failed to read file:', error);
            reject(new Error('Failed to read file'));
        };
        
        console.log('[CMS] Reading file as data URL...');
        reader.readAsDataURL(file);
    });
}

// Utility Functions
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateThumbnailPreview(url) {
    const previewEl = document.getElementById('thumbnailPreview');
    const imgEl = document.getElementById('thumbnailPreviewImg');
    
    if (url) {
        console.log('[CMS] Updating thumbnail preview with URL:', url);
        imgEl.src = url;
        imgEl.onerror = () => {
            console.error('[CMS] Failed to load thumbnail preview:', url);
        };
        imgEl.onload = () => {
            console.log('[CMS] Thumbnail preview loaded successfully');
        };
        previewEl.style.display = 'block';
    } else {
        previewEl.style.display = 'none';
    }
}

function showUploadModal() {
    document.getElementById('imageUploadModal').style.display = 'flex';
}

function hideUploadModal() {
    document.getElementById('imageUploadModal').style.display = 'none';
}

// Display guide authorship and contributors
function displayGuideAuthorship(guide, contributors, isAuthor) {
    // Remove existing authorship info if present
    const existing = document.getElementById('guideAuthorshipInfo');
    if (existing) {
        existing.remove();
    }
    
    // Create authorship info element
    const authorshipDiv = document.createElement('div');
    authorshipDiv.id = 'guideAuthorshipInfo';
    authorshipDiv.className = 'cms-authorship-info';
    
    // Build metadata items for existing guides
    let metadataHTML = '';
    if (guide.created_at && guide.updated_at) {
        const createdDate = new Date(guide.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const viewCount = guide.view_count || 0;
        
        metadataHTML = `
            <div class="cms-metadata-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span class="cms-metadata-value">${viewCount.toLocaleString()}</span>
            </div>
            <div class="cms-metadata-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span class="cms-metadata-value">${createdDate}</span>
            </div>
        `;
        
        // Only show updated date if it's different from created date
        if (guide.updated_at !== guide.created_at) {
            const updatedDate = new Date(guide.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            metadataHTML += `
                <div class="cms-metadata-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span class="cms-metadata-value">${updatedDate}</span>
                </div>
            `;
        }
    }
    
    let html = `
        <div class="cms-authorship-header">
            <h4>Guide Information</h4>
            ${metadataHTML ? `<div class="cms-metadata-section">${metadataHTML}</div>` : ''}
        </div>
        <div class="cms-authorship-content">
            <div class="cms-author-section">
                <span class="cms-authorship-label">Original Author:</span>
                <div class="cms-user-badge">
                    ${guide.author_avatar ? `<img src="https://cdn.discordapp.com/avatars/${guide.author_id}/${guide.author_avatar}.png" alt="${guide.author_name}" class="cms-user-badge-avatar">` : ''}
                    <span class="cms-user-badge-name">${escapeHtml(guide.author_name)}</span>
                </div>
            </div>
    `;
    
    if (contributors.length > 0) {
        html += `
            <div class="cms-contributors-section">
                <span class="cms-authorship-label">Contributors (${contributors.length}):</span>
                <div class="cms-contributors-list">
                    ${contributors.map(c => `
                        <div class="cms-user-badge cms-contributor-badge" title="Contributed: ${new Date(c.contributed_at).toLocaleDateString()}">
                            ${c.avatar ? `<img src="https://cdn.discordapp.com/avatars/${c.user_id}/${c.avatar}.png" alt="${c.username}" class="cms-user-badge-avatar">` : ''}
                            <span class="cms-user-badge-name">${escapeHtml(c.username)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (!isAuthor) {
        html += `
            <div class="cms-contributor-notice">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>You're editing someone else's guide. Your contribution will be tracked!</span>
            </div>
        `;
    }
    
    html += `
        </div>
    `;
    
    authorshipDiv.innerHTML = html;
    
    // Insert after the editor title
    const editorView = document.getElementById('editorView');
    const contentHeader = editorView.querySelector('.cms-content-header');
    contentHeader.parentNode.insertBefore(authorshipDiv, contentHeader.nextSibling);
}

// Custom Toolbar Setup
function setupCustomToolbar() {
    // Helper function to update button active states
    const updateToolbarStates = () => {
        const headingSelect = document.getElementById('headingSelect');
        const { $from } = editor.state.selection;
        const node = $from.node($from.depth);
        
        // Update heading dropdown
        if (node.type.name === 'heading') {
            headingSelect.value = node.attrs.level.toString();
        } else if (node.type.name === 'paragraph') {
            headingSelect.value = 'paragraph';
        }
        
        // Update button active states
        document.getElementById('boldBtn').classList.toggle('active', editor.isActive('bold'));
        document.getElementById('italicBtn').classList.toggle('active', editor.isActive('italic'));
        document.getElementById('underlineBtn').classList.toggle('active', editor.isActive('underline'));
        document.getElementById('strikeBtn').classList.toggle('active', editor.isActive('strike'));
        document.getElementById('codeBtn').classList.toggle('active', editor.isActive('code'));
        document.getElementById('bulletListBtn').classList.toggle('active', editor.isActive('bulletList'));
        document.getElementById('orderedListBtn').classList.toggle('active', editor.isActive('orderedList'));
    };
    
    // Text formatting buttons (Bold, Italic, Underline, Strike)
    document.getElementById('boldBtn').addEventListener('click', () => {
        editor.chain().focus().toggleBold().run();
        updateToolbarStates();
    });
    
    document.getElementById('italicBtn').addEventListener('click', () => {
        editor.chain().focus().toggleItalic().run();
        updateToolbarStates();
    });
    
    document.getElementById('underlineBtn').addEventListener('click', () => {
        editor.chain().focus().toggleUnderline().run();
        updateToolbarStates();
    });
    
    document.getElementById('strikeBtn').addEventListener('click', () => {
        editor.chain().focus().toggleStrike().run();
        updateToolbarStates();
    });
    
    document.getElementById('codeBtn').addEventListener('click', () => {
        editor.chain().focus().toggleCode().run();
        updateToolbarStates();
    });
    
    // Heading dropdown
    const headingSelect = document.getElementById('headingSelect');
    headingSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else {
            editor.chain().focus().toggleHeading({ level: parseInt(value) }).run();
        }
        updateToolbarStates();
    });
    
    // Update button states on editor events
    editor.on('selectionUpdate', updateToolbarStates);
    editor.on('transaction', updateToolbarStates);
    
    // List buttons
    document.getElementById('bulletListBtn').addEventListener('click', () => {
        editor.chain().focus().toggleBulletList().run();
        updateToolbarStates();
    });
    
    document.getElementById('orderedListBtn').addEventListener('click', () => {
        editor.chain().focus().toggleOrderedList().run();
        updateToolbarStates();
    });
    
    // Get references
    const insertImageBtn = document.getElementById('insertImageBtn');
    const insertImageGroup = insertImageBtn.parentElement;
    const toolbarContainer = document.querySelector('.cms-editor-toolbar');
    
    // Add Step Card button (Purple)
    const stepCardBtn = createToolbarButton(
        'Add Step Card',
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="9"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>`,
        () => {
            editor.chain().focus().setStepCard({ title: 'Step Title' }).run();
        },
        'cms-btn-purple'
    );
    
    // Add Info Box button (Teal)
    const infoBoxBtn = createToolbarButton(
        'Add Info Box',
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`,
        () => {
            editor.chain().focus().setInfoBox().run();
        },
        'cms-btn-teal'
    );
    
    // Add Link button (Cyan)
    const linkBtn = createToolbarButton(
        'Add Link',
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>`,
        () => {
            showPromptModal('Enter URL:', 'https://', (url) => {
                editor.chain().focus().setLink({ href: url }).run();
            });
        },
        'cms-btn-cyan'
    );
    
    // Add Icon button (Pink)
    const iconBtn = createToolbarButton(
        'Insert Icon',
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>`,
        () => {
            openIconPicker();
        },
        'cms-btn-pink'
    );
    
    // Remove the original insert image group wrapper
    insertImageGroup.remove();
    
    // Create a custom elements group
    const customElementsGroup = document.createElement('div');
    customElementsGroup.className = 'cms-toolbar-group';
    customElementsGroup.appendChild(insertImageBtn);
    customElementsGroup.appendChild(stepCardBtn);
    customElementsGroup.appendChild(infoBoxBtn);
    customElementsGroup.appendChild(linkBtn);
    customElementsGroup.appendChild(iconBtn);
    
    // Append after all other toolbar items
    toolbarContainer.appendChild(customElementsGroup);
    
    // Initialize image settings modal handlers and overlays
    initializeImageSettingsModal();
    initializeImageOverlays();
}

function createToolbarButton(text, iconHTML, onClick, colorClass = '') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cms-editor-btn' + (colorClass ? ' ' + colorClass : '');
    btn.innerHTML = iconHTML + text;
    btn.addEventListener('click', onClick);
    return btn;
}

// Image Overlays and Selection
function initializeImageOverlays() {
    // Add click event listener to editor
    const editorElement = document.getElementById('editor');
    
    // Listen for selection changes
    editor.on('selectionUpdate', ({ editor: ed }) => {
        updateImageSelection(ed);
    });
    
    // Listen for updates to refresh overlays
    editor.on('update', ({ editor: ed }) => {
        setTimeout(() => {
            updateImageOverlays(ed);
        }, 0);
    });
    
    // Initial overlay setup
    setTimeout(() => {
        updateImageOverlays(editor);
    }, 100);
}

function updateImageSelection(ed) {
    // Remove previous selection highlights
    document.querySelectorAll('.guide-image').forEach(img => {
        img.classList.remove('cms-image-selected');
    });
    
    // Check if current selection is an image
    const { selection, doc } = ed.state;
    const node = doc.nodeAt(selection.from);
    
    if (node && node.type.name === 'guideImage') {
        // Find the corresponding DOM element and highlight it
        const pos = selection.from;
        const domNode = ed.view.nodeDOM(pos);
        if (domNode && domNode.classList) {
            domNode.classList.add('cms-image-selected');
        }
    }
}

function updateImageOverlays(ed) {
    // Find all guide images in the editor
    const editorElement = document.querySelector('.tiptap-editor');
    if (!editorElement) return;
    
    const images = editorElement.querySelectorAll('.guide-image');
    
    images.forEach((imageWrapper) => {
        // Check if overlay already exists
        if (imageWrapper.querySelector('.cms-image-edit-btn')) return;
        
        // Create edit button overlay
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
            
            // Find and select this image in the editor
            const pos = ed.view.posAtDOM(imageWrapper, 0);
            ed.chain().focus().setNodeSelection(pos).run();
            
            // Open settings modal
            setTimeout(() => openImageSettingsModal(), 50);
        });
        
        imageWrapper.appendChild(editBtn);
        
        // Make image wrapper relative positioned for overlay
        imageWrapper.style.position = 'relative';
    });
}

// Image Settings Modal
function initializeImageSettingsModal() {
    // Width button handlers
    document.querySelectorAll('.cms-width-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cms-width-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('customImageWidth').value = '';
        });
    });
    
    // Alignment button handlers
    document.querySelectorAll('.cms-align-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cms-align-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Apply settings button
    document.getElementById('applyImageSettings').addEventListener('click', () => {
        applyImageSettings();
    });
}

function openImageSettingsModal() {
    // Check if an image is selected
    const { selection, doc } = editor.state;
    const node = doc.nodeAt(selection.from);
    
    if (!node || node.type.name !== 'guideImage') {
        alert('Please click on an image first to edit its settings');
        return;
    }
    
    console.log('[CMS] Opening image settings for:', node.attrs);
    
    // Get current settings
    const currentWidth = node.attrs.width || '600px';
    const currentAlign = node.attrs.align || 'center';
    
    // Reset and set width buttons
    document.querySelectorAll('.cms-width-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.width === currentWidth) {
            btn.classList.add('active');
        }
    });
    
    // Set custom width if not a preset
    const presetWidths = ['300px', '450px', '600px', '100%'];
    if (!presetWidths.includes(currentWidth)) {
        document.getElementById('customImageWidth').value = currentWidth;
    } else {
        document.getElementById('customImageWidth').value = '';
    }
    
    // Set alignment buttons
    document.querySelectorAll('.cms-align-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.align === currentAlign) {
            btn.classList.add('active');
        }
    });
    
    // Show modal
    document.getElementById('imageSettingsModal').style.display = 'flex';
}

function applyImageSettings() {
    console.log('[CMS] Applying image settings...');
    
    // Get selected width
    let width = '600px';
    const customWidth = document.getElementById('customImageWidth').value.trim();
    if (customWidth) {
        width = customWidth;
    } else {
        const activeWidthBtn = document.querySelector('.cms-width-btn.active');
        if (activeWidthBtn) {
            width = activeWidthBtn.dataset.width;
        }
    }
    
    // Get selected alignment
    const activeAlignBtn = document.querySelector('.cms-align-btn.active');
    const align = activeAlignBtn ? activeAlignBtn.dataset.align : 'center';
    
    console.log('[CMS] New image settings:', { width, align });
    
    // Update the image attributes
    editor.chain().focus().updateGuideImage({ width, align }).run();
    
    // Close modal
    document.getElementById('imageSettingsModal').style.display = 'none';
    
    console.log('[CMS] Image settings applied successfully');
}

// Format step cards HTML to match player-report.html structure
function formatStepCardsHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all step cards
    const stepCards = doc.querySelectorAll('[data-type="step-card"]');
    
    stepCards.forEach(card => {
        // If it already has step-header, it's already formatted - skip to avoid duplication
        const hasStepHeader = Array.from(card.children).some(child => child.classList && child.classList.contains('step-header'));
        if (hasStepHeader) {
            card.classList.add('step-card');
            return;
        }
        
        // Get the first h3 (title) and remaining content
        const h3 = card.querySelector('h3');
        if (!h3) return;
        
        const title = h3.textContent;
        
        // Create proper structure
        const stepHeader = document.createElement('div');
        stepHeader.className = 'step-header';
        
        const stepTitle = document.createElement('h3');
        stepTitle.className = 'step-title';
        stepTitle.textContent = title;
        
        stepHeader.appendChild(stepTitle);
        
        const stepDescription = document.createElement('div');
        stepDescription.className = 'step-description';
        
        // Move all content except the first h3 to step-description
        const children = Array.from(card.children);
        children.forEach(child => {
            if (child !== h3) {
                stepDescription.appendChild(child.cloneNode(true));
            }
        });
        
        // Clear and rebuild card
        card.innerHTML = '';
        card.appendChild(stepHeader);
        card.appendChild(stepDescription);
        
        // Update class
        card.classList.add('step-card');
    });
    
    return doc.body.innerHTML;
}

// Icon Picker Functions
let iconSearchTimeout = null;

function openIconPicker() {
    const modal = document.getElementById('iconPickerModal');
    modal.style.display = 'flex';
    
    const searchInput = document.getElementById('iconSearch');
    searchInput.value = '';
    searchInput.focus();
    
    // Set up event listeners
    setupIconPickerListeners();
}

function setupIconPickerListeners() {
    const searchInput = document.getElementById('iconSearch');
    const collectionInputs = document.querySelectorAll('input[name="iconCollection"]');
    
    // Remove old listeners
    searchInput.replaceWith(searchInput.cloneNode(true));
    const newSearchInput = document.getElementById('iconSearch');
    
    newSearchInput.addEventListener('input', (e) => {
        clearTimeout(iconSearchTimeout);
        iconSearchTimeout = setTimeout(() => {
            searchIcons(e.target.value);
        }, 300);
    });
    
    collectionInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (newSearchInput.value) {
                searchIcons(newSearchInput.value);
            }
        });
    });
}

async function searchIcons(query) {
    if (!query || query.length < 2) {
        document.getElementById('iconResults').innerHTML = '<div class="cms-icon-placeholder">Type at least 2 characters to search...</div>';
        return;
    }
    
    const collection = document.querySelector('input[name="iconCollection"]:checked').value;
    const resultsContainer = document.getElementById('iconResults');
    
    resultsContainer.innerHTML = '<div class="cms-icon-loading">Searching icons...</div>';
    
    try {
        // Use Iconify API to search icons
        const collectionParam = collection === 'all' ? '' : `&prefix=${collection}`;
        const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}${collectionParam}&limit=48`);
        const data = await response.json();
        
        if (!data.icons || data.icons.length === 0) {
            resultsContainer.innerHTML = '<div class="cms-icon-placeholder">No icons found. Try a different search term.</div>';
            return;
        }
        
        // Fetch SVG data for each icon
        displayIcons(data.icons);
    } catch (error) {
        console.error('[CMS] Error searching icons:', error);
        resultsContainer.innerHTML = '<div class="cms-icon-placeholder">Error loading icons. Please try again.</div>';
    }
}

async function displayIcons(iconNames) {
    const resultsContainer = document.getElementById('iconResults');
    resultsContainer.innerHTML = '';
    
    for (const iconName of iconNames) {
        try {
            // Fetch SVG data from Iconify
            const response = await fetch(`https://api.iconify.design/${iconName}.svg`);
            const svgData = await response.text();
            
            const iconItem = document.createElement('div');
            iconItem.className = 'cms-icon-item';
            iconItem.innerHTML = `
                ${svgData}
                <div class="cms-icon-item-name">${iconName.split(':')[1] || iconName}</div>
            `;
            
            iconItem.addEventListener('click', () => {
                insertIconIntoEditor(iconName, svgData);
            });
            
            resultsContainer.appendChild(iconItem);
        } catch (error) {
            console.warn('[CMS] Failed to load icon:', iconName);
        }
    }
}

function insertIconIntoEditor(iconName, svgData) {
    console.log('[CMS] Inserting icon:', iconName);
    
    editor.chain()
        .focus()
        .insertIcon({
            iconName: iconName,
            iconData: svgData,
            color: 'currentColor',
            size: '1em',
        })
        .run();
    
    // Close modal
    document.getElementById('iconPickerModal').style.display = 'none';
    console.log('[CMS] Icon inserted successfully');
}
