/**
 * Global State Management using Preact Signals
 */

import { signal, computed } from '@preact/signals';
import { CONTENT_TYPES, getDefaultFormValues } from '../config/contentTypes.js';

// Auth state
export const currentUser = signal(null);
export const isAuthenticated = computed(() => currentUser.value !== null);
export const isAdmin = computed(() => currentUser.value?.isAdmin || false);

// Content type state
export const activeContentType = signal(CONTENT_TYPES.GUIDES); // Current content type being managed

// Generic content state - stores all content by type
export const contentByType = signal({
    [CONTENT_TYPES.GUIDES]: [],
    [CONTENT_TYPES.NEWS]: [],
    [CONTENT_TYPES.SALES]: [],
});

export const currentContent = signal(null); // Currently selected/editing content item
export const isLoadingContent = signal(false);

// Editor state
export const editorInstance = signal(null);
export const editorContent = signal('');
export const isDirty = signal(false);

// UI state
export const currentView = signal('list'); // 'list' | 'editor'
export const isUploading = signal(false);
export const activeModal = signal(null); // null | 'image-settings' | 'icon-picker' | etc.

// Editing locks state
export const activeLocks = signal([]); // Array of active locks from server
export const currentLock = signal(null); // Lock held by current user for current content

// Logout state - used to signal components to clean up
export const isLoggingOut = signal(false);
const logoutCallbacks = [];

// Register a cleanup callback for logout
export function onLogout(callback) {
    logoutCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
        const index = logoutCallbacks.indexOf(callback);
        if (index > -1) logoutCallbacks.splice(index, 1);
    };
}

// Trigger all logout callbacks
export function triggerLogout() {
    isLoggingOut.value = true;
    logoutCallbacks.forEach(cb => {
        try { cb(); } catch (e) { console.error('Logout callback error:', e); }
    });
}

// Generic content form state
export const contentForm = signal({
    type: CONTENT_TYPES.GUIDES,
    id: null,
    ...getDefaultFormValues(CONTENT_TYPES.GUIDES),
});

// Get content list for active type
export const activeContentList = computed(() => {
    return contentByType.value[activeContentType.value] || [];
});

// Reset form
export function resetContentForm(type = null) {
    const contentType = type || activeContentType.value;
    contentForm.value = {
        type: contentType,
        id: null,
        ...getDefaultFormValues(contentType),
    };
    editorContent.value = '';
    isDirty.value = false;
}

// Update form field
export function updateContentForm(field, value) {
    contentForm.value = {
        ...contentForm.value,
        [field]: value,
    };
    if (field !== 'content') {
        isDirty.value = true;
    }
}

// Set content for a specific type
export function setContentForType(type, content) {
    contentByType.value = {
        ...contentByType.value,
        [type]: content,
    };
}

// Switch active content type
export function switchContentType(type) {
    activeContentType.value = type;
    currentView.value = 'list';
    resetContentForm(type);
    currentContent.value = null;
}

// Legacy exports for backward compatibility (will be removed later)
export const guides = computed(() => contentByType.value[CONTENT_TYPES.GUIDES]);
export const currentGuide = currentContent;
export const isLoadingGuides = isLoadingContent;
export const guideForm = contentForm;
export const resetGuideForm = () => resetContentForm(CONTENT_TYPES.GUIDES);
export const updateGuideForm = updateContentForm;

