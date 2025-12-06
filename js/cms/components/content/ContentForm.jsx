/**
 * Generic Content Form Component
 * Renders form fields based on content type configuration
 */

import { contentForm, updateContentForm } from '../../store/state.js';
import { getContentTypeConfig } from '../../config/contentTypes.js';
import { Input, Textarea, Select } from '../ui/Input.jsx';
import { generateSlug } from '../../utils/helpers.js';

export function ContentForm({ contentType, onImageUpload }) {
    const form = contentForm.value;
    const config = getContentTypeConfig(contentType);

    if (!config) return null;

    const handleTitleChange = (value) => {
        updateContentForm('title', value);
        // Auto-generate slug if creating new content
        if (!form.id) {
            updateContentForm('slug', generateSlug(value));
        }
    };

    const renderField = (fieldKey, fieldConfig) => {
        const value = form[fieldKey] || '';

        switch (fieldConfig.type) {
            case 'text':
                return (
                    <Input
                        key={fieldKey}
                        label={fieldConfig.label}
                        value={value}
                        onChange={fieldKey === 'title' ? handleTitleChange : (val) => updateContentForm(fieldKey, val)}
                        placeholder={`Enter ${fieldConfig.label.toLowerCase()}...`}
                        required={fieldConfig.required}
                        hint={fieldKey === 'slug' ? '(URL-friendly version, auto-generated from title)' : fieldConfig.hint}
                    />
                );

            case 'slug':
                return (
                    <Input
                        key={fieldKey}
                        label={fieldConfig.label}
                        value={value}
                        onChange={(val) => updateContentForm(fieldKey, val)}
                        placeholder="url-slug"
                        required={fieldConfig.required}
                        hint="(URL-friendly version, auto-generated from title)"
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        key={fieldKey}
                        label={fieldConfig.label}
                        value={value}
                        onChange={(val) => updateContentForm(fieldKey, val)}
                        placeholder={`Enter ${fieldConfig.label.toLowerCase()}...`}
                        rows={3}
                        hint={fieldConfig.hint}
                    />
                );

            case 'select':
                return (
                    <Select
                        key={fieldKey}
                        label={fieldConfig.label}
                        value={value}
                        onChange={(val) => updateContentForm(fieldKey, val)}
                        options={fieldConfig.options}
                        hint={fieldConfig.hint}
                    />
                );

            case 'image':
                return (
                    <div key={fieldKey} className="cms-form-group">
                        <label className="cms-label">{fieldConfig.label}</label>
                        <div className="cms-file-input-group">
                            <input
                                type="text"
                                className="cms-input"
                                value={value}
                                onChange={(e) => updateContentForm(fieldKey, e.target.value)}
                                placeholder="https://..."
                            />
                            <label htmlFor={`${fieldKey}Upload`} className="cms-btn cms-btn-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                Upload
                            </label>
                            <input
                                type="file"
                                id={`${fieldKey}Upload`}
                                accept="image/*"
                                onChange={(e) => onImageUpload(e, fieldKey)}
                                style={{ display: 'none' }}
                            />
                        </div>
                        {value && (
                            <div className="cms-thumbnail-preview">
                                <img src={value} alt={`${fieldConfig.label} preview`} />
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="cms-form-section">
            {Object.entries(config.fields).map(([fieldKey, fieldConfig]) => {
                // Skip richtext content field (handled separately in editor)
                if (fieldConfig.type === 'richtext') return null;
                // Skip status field (handled by action buttons)
                if (fieldConfig.type === 'status') return null;

                return renderField(fieldKey, fieldConfig);
            })}
        </div>
    );
}

