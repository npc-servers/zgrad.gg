/**
 * Content Type Registry
 * Define all content types and their configurations here
 */

export const CONTENT_TYPES = {
    GUIDES: 'guides',
    NEWS: 'news',
};

/**
 * Content Type Configuration
 * Each content type can have custom fields, validation, and behavior
 */
export const contentTypeConfig = {
    [CONTENT_TYPES.GUIDES]: {
        id: CONTENT_TYPES.GUIDES,
        label: 'Guides',
        labelSingular: 'Guide',
        icon: '📖',
        apiEndpoint: 'guides',
        fields: {
            title: { type: 'text', required: true, label: 'Title' },
            slug: { type: 'slug', required: true, label: 'URL Slug' },
            description: { type: 'textarea', required: false, label: 'Description' },
            thumbnail: { type: 'image', required: false, label: 'Thumbnail' },
            content: { type: 'richtext', required: true, label: 'Content' },
            visibility: { 
                type: 'select', 
                required: true, 
                label: 'Visibility',
                options: [
                    { value: 'public', label: 'Public' },
                    { value: 'unlisted', label: 'Unlisted' }
                ],
                default: 'public'
            },
            status: { 
                type: 'status', 
                required: true,
                options: ['draft', 'published'],
                default: 'draft'
            },
        },
        supportsDrafts: true,
        supportsContributors: true,
        listColumns: ['thumbnail', 'title', 'status', 'views', 'created'],
    },
    
    [CONTENT_TYPES.NEWS]: {
        id: CONTENT_TYPES.NEWS,
        label: 'News',
        labelSingular: 'News Article',
        icon: '📰',
        apiEndpoint: 'news',
        fields: {
            title: { type: 'text', required: true, label: 'Title' },
            slug: { type: 'slug', required: true, label: 'URL Slug' },
            excerpt: { type: 'textarea', required: false, label: 'Excerpt' },
            featured_image: { type: 'image', required: false, label: 'Featured Image' },
            content: { type: 'richtext', required: true, label: 'Content' },
            category: {
                type: 'select',
                required: true,
                label: 'Category',
                options: [
                    { value: 'announcement', label: 'Announcement' },
                    { value: 'update', label: 'Update' },
                    { value: 'event', label: 'Event' },
                    { value: 'community', label: 'Community' }
                ],
                default: 'announcement'
            },
            visibility: { 
                type: 'select', 
                required: true, 
                label: 'Visibility',
                options: [
                    { value: 'public', label: 'Public' },
                    { value: 'unlisted', label: 'Unlisted' }
                ],
                default: 'public'
            },
            status: { 
                type: 'status', 
                required: true,
                options: ['draft', 'published'],
                default: 'draft'
            },
        },
        supportsDrafts: true,
        supportsContributors: false,
        listColumns: ['featured_image', 'title', 'category', 'status', 'views', 'created'],
    },
};

/**
 * Get content type configuration
 */
export function getContentTypeConfig(type) {
    return contentTypeConfig[type] || null;
}

/**
 * Get all available content types
 */
export function getAvailableContentTypes() {
    return Object.values(contentTypeConfig);
}

/**
 * Get default form values for a content type
 */
export function getDefaultFormValues(type) {
    const config = getContentTypeConfig(type);
    if (!config) return {};

    const defaults = { type };
    Object.entries(config.fields).forEach(([key, field]) => {
        if (field.default !== undefined) {
            defaults[key] = field.default;
        } else {
            switch (field.type) {
                case 'text':
                case 'slug':
                case 'textarea':
                case 'richtext':
                    defaults[key] = '';
                    break;
                case 'image':
                    defaults[key] = '';
                    break;
                case 'select':
                    defaults[key] = field.options[0]?.value || '';
                    break;
                default:
                    defaults[key] = null;
            }
        }
    });

    return defaults;
}

