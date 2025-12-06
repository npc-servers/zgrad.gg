/**
 * Guide Form Component
 */

import { guideForm, updateGuideForm } from '../../store/state.js';
import { Input, Textarea, Select } from '../ui/Input.jsx';
import { generateSlug } from '../../utils/helpers.js';

export function GuideForm({ onThumbnailUpload }) {
    const form = guideForm.value;

    const handleTitleChange = (value) => {
        updateGuideForm('title', value);
        // Auto-generate slug if creating new guide
        if (!form.id) {
            updateGuideForm('slug', generateSlug(value));
        }
    };

    return (
        <div className="cms-form-section">
            <Input
                label="Title"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="Enter guide title..."
                required
            />

            <Input
                label="Slug"
                hint="(URL-friendly version, auto-generated from title)"
                value={form.slug}
                onChange={(value) => updateGuideForm('slug', value)}
                placeholder="guide-url-slug"
                required
            />

            <Textarea
                label="Description"
                value={form.description}
                onChange={(value) => updateGuideForm('description', value)}
                placeholder="Brief description of the guide for SEO and guide cards..."
                rows={3}
            />

            <Select
                label="Visibility"
                hint="Unlisted guides can still be accessed if someone has the link, but won't appear in the guides list."
                value={form.visibility}
                onChange={(value) => updateGuideForm('visibility', value)}
                options={[
                    { value: 'public', label: 'Public (Listed in guide index)' },
                    { value: 'unlisted', label: 'Unlisted (Accessible via direct URL only)' },
                ]}
            />

            <div className="cms-form-group">
                <label className="cms-label">Thumbnail URL</label>
                <div className="cms-file-input-group">
                    <input
                        type="text"
                        className="cms-input"
                        value={form.thumbnail}
                        onChange={(e) => updateGuideForm('thumbnail', e.target.value)}
                        placeholder="https://..."
                    />
                    <label htmlFor="thumbnailUpload" className="cms-btn cms-btn-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Upload
                    </label>
                    <input
                        type="file"
                        id="thumbnailUpload"
                        accept="image/*"
                        onChange={onThumbnailUpload}
                        style={{ display: 'none' }}
                    />
                </div>
                {form.thumbnail && (
                    <div className="cms-thumbnail-preview">
                        <img src={form.thumbnail} alt="Thumbnail preview" />
                    </div>
                )}
            </div>
        </div>
    );
}

