# ZGRAD CMS - Preact Architecture

## Overview

The ZGRAD CMS is a modern, component-based content management system built with Preact. It features a fully extensible architecture that supports multiple content types (Guides, News, and more) through a unified interface.

## Architecture

### Core Principles

1. **Content Type Agnostic**: The CMS is designed to work with any content type through configuration
2. **Component-Based**: All UI elements are reusable Preact components
3. **Centralized State**: Uses Preact Signals for reactive state management
4. **Service Layer**: Dedicated services for API calls and business logic
5. **Configuration-Driven**: Content types are defined through configuration, not hardcoded

## Directory Structure

```
js/cms/
├── components/
│   ├── App.jsx                  # Main application component
│   ├── content/                 # Content display components
│   │   ├── ContentList.jsx      # Generic list view for any content type
│   │   ├── ContentCard.jsx      # Generic card component
│   │   ├── GuideCard.jsx        # Legacy guide-specific card (deprecated)
│   │   ├── GuideForm.jsx        # Form for guide metadata
│   │   ├── GuidesList.jsx       # Legacy guides list (deprecated)
│   │   ├── GuideMetadata.jsx    # Displays guide authorship and stats
│   │   └── DraftNotice.jsx      # Notice for draft changes
│   ├── editor/                  # Rich text editor components
│   │   ├── EditorToolbar.jsx    # TipTap editor toolbar
│   │   ├── TipTapEditor.jsx     # TipTap editor wrapper
│   │   └── ImageSettingsModal.jsx # Image editing modal
│   ├── layout/                  # Layout components
│   │   ├── Navbar.jsx           # Top navigation bar
│   │   └── Sidebar.jsx          # Content type navigation sidebar
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.jsx           # Button component
│   │   ├── Input.jsx            # Input component
│   │   ├── Modal.jsx            # Modal dialogs
│   │   ├── Loading.jsx          # Loading spinners
│   │   └── LinkModal.jsx        # Link insertion modal
│   └── views/                   # View components
│       └── EditorView.jsx       # Content editor view
├── config/
│   └── contentTypes.js          # Content type registry and configuration
├── services/
│   ├── api.js                   # API communication service
│   └── image.js                 # Image upload and compression
├── store/
│   └── state.js                 # Global state management (Preact Signals)
├── utils/
│   ├── helpers.js               # Utility functions
│   ├── tiptap-helpers.js        # TipTap editor extensions
│   └── toast.js                 # Toast notifications
└── README.md                    # This file
```

## Content Type System

### How It Works

The CMS uses a **configuration-driven approach** to support multiple content types. Each content type is defined in `config/contentTypes.js` with:

- **Metadata**: Label, icon, API endpoint
- **Fields**: Form fields with types and validation
- **Features**: Draft support, contributors, etc.
- **Display**: Which columns to show in lists

### Currently Supported Content Types

1. **Guides** (📖)
   - Tutorial and how-to content
   - Supports drafts and contributors
   - Fields: title, slug, description, thumbnail, content

2. **News** (📰)
   - News articles and announcements
   - Supports drafts
   - Fields: title, slug, excerpt, featured_image, content, category

### Adding a New Content Type

To add a new content type (e.g., "Pages"):

1. **Define the content type in `config/contentTypes.js`**:

```javascript
export const CONTENT_TYPES = {
    GUIDES: 'guides',
    NEWS: 'news',
    PAGES: 'pages', // Add your new type
};

export const contentTypeConfig = {
    // ... existing types ...
    
    [CONTENT_TYPES.PAGES]: {
        id: CONTENT_TYPES.PAGES,
        label: 'Pages',
        labelSingular: 'Page',
        icon: '📄',
        apiEndpoint: 'pages',
        fields: {
            title: { type: 'text', required: true, label: 'Title' },
            slug: { type: 'slug', required: true, label: 'URL Slug' },
            content: { type: 'richtext', required: true, label: 'Content' },
            // ... add more fields as needed
        },
        supportsDrafts: true,
        supportsContributors: false,
        listColumns: ['title', 'status', 'created'],
    },
};
```

2. **Create backend API endpoints** (if not already present):
   - `/api/pages/list`
   - `/api/pages/:id`
   - `/api/pages/create`
   - `/api/pages/:id` (PUT for update)
   - `/api/pages/:id` (DELETE)

3. **That's it!** The CMS will automatically:
   - Add the new type to the sidebar
   - Create list and editor views
   - Handle CRUD operations
   - Support drafts (if enabled)

## State Management

### Preact Signals

The CMS uses Preact Signals for reactive state management:

```javascript
// Core state
currentUser          // Current authenticated user
activeContentType    // Currently active content type ('guides', 'news', etc.)
contentByType        // All content organized by type
currentContent       // Currently selected/editing content item
currentView          // Current view ('list' or 'editor')
contentForm          // Form data for content being edited

// Computed state
activeContentList    // Content list for the active type
isAuthenticated      // Whether user is logged in
```

### Key Functions

```javascript
// Switch between content types
switchContentType('news');

// Update form data
updateContentForm('title', 'New Title');

// Reset form
resetContentForm();

// Set content for a specific type
setContentForType('guides', guidesArray);
```

## API Service

### Generic Methods

The API service provides generic methods that work with any content type:

```javascript
// List all items of a content type
await API.listContent('guides');
await API.listContent('news');

// Get a specific item
await API.getContent('guides', id);

// Create new content
await API.createContent('news', data);

// Update content
await API.updateContent('guides', id, data);

// Delete content
await API.deleteContent('news', id);
```

### Legacy Methods

For backward compatibility, type-specific methods are still available:

```javascript
await API.listGuides();
await API.getGuide(id);
await API.createGuide(data);
await API.updateGuide(id, data);
await API.deleteGuide(id);

await API.listNews();
await API.getNewsItem(id);
// etc...
```

## Components

### Generic Components

These components work with any content type:

- **`ContentList`**: Displays a list of content items
- **`ContentCard`**: Renders a single content item card
- **`EditorView`**: Editor for creating/editing content

### Type-Specific Components

Some components are still type-specific but will be refactored:

- **`GuideForm`**: Form for guide metadata (will become generic)
- **`GuideMetadata`**: Shows author, dates, views (will become generic)
- **`DraftNotice`**: Draft workflow notice

### UI Components

Reusable across all content types:

- **`Button`**: Styled button with variants
- **`Input`**: Text input with validation
- **`Modal`**: Modal dialogs
- **`Loading`**: Loading states
- **`LinkModal`**: Link insertion
- **`ImageSettingsModal`**: Image editing

## Editor Features

### Rich Text Editor (TipTap)

- Bold, italic, underline, strikethrough
- Headings (H1-H6)
- Bulleted and numbered lists
- Links with custom display text
- Code formatting
- Auto-exit link formatting on space

### Custom Elements

- **Guide Images**: Resizable images with alignment
- **Step Cards**: Numbered step-by-step instructions
- **Info Boxes**: Highlighted information blocks
- **Icons**: SVG icon insertion

### Image Management

- Automatic compression before upload
- Resize and alignment controls
- Edit button overlay on images

## Draft Workflow

### For Published Content

1. Edit a published item
2. Save as "Draft" to create draft version
3. Published version remains live
4. Continue editing the draft
5. Click "Publish Draft" to replace published version
6. Or "Discard Draft" to abandon changes

### Draft Indicators

- Badge on content cards: "has draft"
- Banner in editor showing draft state
- Button text changes based on state

## Migration from Old System

The refactoring maintains backward compatibility:

### Legacy Exports (Deprecated)

```javascript
// Old (still works)
import { guides, currentGuide, guideForm } from './store/state.js';

// New (preferred)
import { 
    contentByType, 
    currentContent, 
    contentForm,
    activeContentType 
} from './store/state.js';
```

### What Changed

| Old | New | Status |
|-----|-----|--------|
| `guides` signal | `contentByType.guides` computed | Deprecated |
| `currentGuide` | `currentContent` | Deprecated |
| `guideForm` | `contentForm` | Deprecated |
| `resetGuideForm()` | `resetContentForm()` | Deprecated |
| `updateGuideForm()` | `updateContentForm()` | Deprecated |
| Guide-specific views | Generic `ContentList` | Migrating |

## Future Enhancements

### Planned Features

1. **Generic Form Component**: Replace type-specific forms
2. **Field Type Plugins**: Custom field types (color picker, date picker, etc.)
3. **Content Relationships**: Link content items together
4. **Media Library**: Centralized asset management
5. **Version History**: Track all changes over time
6. **Bulk Operations**: Edit multiple items at once
7. **Search and Filtering**: Advanced content search
8. **Categories and Tags**: Taxonomy system

### Adding More Content Types

The system is ready for:
- **Pages**: Static pages (About, Contact, etc.)
- **Portfolio**: Showcase projects
- **Testimonials**: User reviews
- **FAQs**: Question and answer pairs
- **Events**: Calendar events
- **Downloads**: File management

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Testing

The system includes:
- Preact DevTools support
- Console logging in development
- Error boundaries (planned)

## Best Practices

### Creating New Content Types

1. Always define in `config/contentTypes.js` first
2. Use descriptive field names
3. Include proper validation
4. Test with backend API
5. Update documentation

### Writing Components

1. Keep components small and focused
2. Use Preact Signals for reactivity
3. Extract reusable logic to hooks
4. Follow existing naming conventions
5. Add JSDoc comments

### State Management

1. Use signals for reactive data
2. Use computed for derived state
3. Keep state minimal and normalized
4. Don't mutate signals directly (use `.value =`)

## Troubleshooting

### Common Issues

**Content type not appearing**
- Check `contentTypes.js` configuration
- Verify API endpoints exist
- Check browser console for errors

**Editor not saving**
- Verify all required fields are filled
- Check network tab for API errors
- Ensure user has permission

**Draft state not showing**
- Reload content after saving draft
- Check that `supportsDrafts: true` in config
- Verify backend returns `draft_content` field

## Support

For questions or issues:
1. Check this documentation
2. Review the code comments
3. Contact the development team

---

**Version**: 2.0.0  
**Last Updated**: November 2025  
**Maintainer**: ZGRAD Development Team
