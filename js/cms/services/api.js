/**
 * API Service
 * Centralized API communication layer for all content types
 */

import { getContentTypeConfig } from '../config/contentTypes.js';

class APIService {
    constructor() {
        this.baseURL = '';
        this.isLoggingOut = false;
    }

    // Call this before logout to prevent further API errors
    setLoggingOut(value) {
        this.isLoggingOut = value;
    }

    async request(endpoint, options = {}) {
        // If we're logging out, don't make any more requests
        if (this.isLoggingOut) {
            throw new Error('Session ended');
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            // Handle 401 Unauthorized - user is logged out
            if (response.status === 401) {
                this.isLoggingOut = true;
                throw new Error('Unauthorized');
            }
            
            // Try to parse JSON error, but handle HTML responses gracefully
            let error = { error: 'Request failed' };
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                error = await response.json().catch(() => ({ error: 'Request failed' }));
            }
            throw new Error(error.error || error.details || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    // Auth endpoints
    async getCurrentUser() {
        return await this.request('/api/auth/me');
    }

    async logout() {
        return await this.request('/api/auth/logout');
    }

    // Generic Content CRUD operations
    async listContent(contentType) {
        const config = getContentTypeConfig(contentType);
        if (!config) throw new Error(`Unknown content type: ${contentType}`);
        return await this.request(`/api/${config.apiEndpoint}/list`);
    }

    async getContent(contentType, id) {
        const config = getContentTypeConfig(contentType);
        if (!config) throw new Error(`Unknown content type: ${contentType}`);
        return await this.request(`/api/${config.apiEndpoint}/${id}`);
    }

    async createContent(contentType, data) {
        const config = getContentTypeConfig(contentType);
        if (!config) throw new Error(`Unknown content type: ${contentType}`);
        return await this.request(`/api/${config.apiEndpoint}/create`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateContent(contentType, id, data) {
        const config = getContentTypeConfig(contentType);
        if (!config) throw new Error(`Unknown content type: ${contentType}`);
        return await this.request(`/api/${config.apiEndpoint}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteContent(contentType, id) {
        const config = getContentTypeConfig(contentType);
        if (!config) throw new Error(`Unknown content type: ${contentType}`);
        return await this.request(`/api/${config.apiEndpoint}/${id}`, {
            method: 'DELETE',
        });
    }

    // Legacy guide-specific methods (for backward compatibility)
    async listGuides() {
        return await this.listContent('guides');
    }

    async getGuide(id) {
        return await this.getContent('guides', id);
    }

    async createGuide(data) {
        return await this.createContent('guides', data);
    }

    async updateGuide(id, data) {
        return await this.updateContent('guides', id, data);
    }

    async deleteGuide(id) {
        return await this.deleteContent('guides', id);
    }

    // News-specific methods
    async listNews() {
        return await this.listContent('news');
    }

    async getNewsItem(id) {
        return await this.getContent('news', id);
    }

    async createNewsItem(data) {
        return await this.createContent('news', data);
    }

    async updateNewsItem(id, data) {
        return await this.updateContent('news', id, data);
    }

    async deleteNewsItem(id) {
        return await this.deleteContent('news', id);
    }

    // Image endpoints
    async uploadImage(file) {
        // If we're logging out, don't make any more requests
        if (this.isLoggingOut) {
            throw new Error('Session ended');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.isLoggingOut = true;
                throw new Error('Unauthorized');
            }
            
            let error = { error: 'Upload failed' };
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                error = await response.json().catch(() => ({ error: 'Upload failed' }));
            }
            throw new Error(error.error || error.details || 'Upload failed');
        }

        return await response.json();
    }

    // Lock endpoints
    async getLocks() {
        return await this.request('/api/locks/status');
    }

    async acquireLock(contentType, contentId) {
        return await this.request('/api/locks/acquire', {
            method: 'POST',
            body: JSON.stringify({ content_type: contentType, content_id: contentId }),
        });
    }

    async releaseLock(contentType, contentId) {
        return await this.request('/api/locks/release', {
            method: 'POST',
            body: JSON.stringify({ content_type: contentType, content_id: contentId }),
        });
    }

    async heartbeatLock(contentType, contentId) {
        return await this.request('/api/locks/heartbeat', {
            method: 'POST',
            body: JSON.stringify({ content_type: contentType, content_id: contentId }),
        });
    }

    async forceReleaseLock(contentType, contentId) {
        return await this.request('/api/locks/force-release', {
            method: 'POST',
            body: JSON.stringify({ content_type: contentType, content_id: contentId }),
        });
    }

    // Sales-specific methods (admin only)
    async listSales() {
        return await this.listContent('sales');
    }

    async getSale(id) {
        return await this.getContent('sales', id);
    }

    async createSale(data) {
        return await this.createContent('sales', data);
    }

    async updateSale(id, data) {
        return await this.updateContent('sales', id, data);
    }

    async deleteSale(id) {
        return await this.deleteContent('sales', id);
    }

    async toggleSale(id) {
        return await this.request(`/api/sales/${id}/toggle`, {
            method: 'POST',
        });
    }
}

export default new APIService();

