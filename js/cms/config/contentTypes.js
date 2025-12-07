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
        editorFeatures: {
            stepCards: true,
            infoBoxes: true,
        },
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
            cover_image: { type: 'image', required: false, label: 'Cover Image' },
            image_caption: { type: 'text', required: false, label: 'Image Caption' },
            content: { type: 'richtext', required: true, label: 'Article Content' },
            category: {
                type: 'select',
                required: true,
                label: 'Category',
                options: [
                    { value: 'announcement', label: 'Announcement' },
                    { value: 'event', label: 'Event' }
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
            // Loading screen fields
            show_on_loading_screen: {
                type: 'checkbox',
                required: false,
                label: 'Show on Loading Screen',
                description: 'Display this news/event on the game loading screen',
                default: false
            },
            loading_screen_description: {
                type: 'textarea',
                required: false,
                label: 'Loading Screen Description',
                description: 'Short description for the loading screen. Use <strong> for bold, <em> for italic.',
                showIf: 'show_on_loading_screen'
            },
            event_start_date: {
                type: 'datetime',
                required: false,
                label: 'Event Start Date',
                showIf: { category: 'event' }
            },
            event_end_date: {
                type: 'datetime',
                required: false,
                label: 'Event End Date',
                showIf: { category: 'event' }
            },
        },
        supportsDrafts: true,
        supportsContributors: false,
        listColumns: ['cover_image', 'title', 'category', 'status', 'views', 'created'],
        editorFeatures: {
            stepCards: false,
            infoBoxes: false,
        },
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
                case 'checkbox':
                    defaults[key] = false;
                    break;
                case 'datetime':
                    defaults[key] = null;
                    break;
                default:
                    defaults[key] = null;
            }
        }
    });

    return defaults;
}

