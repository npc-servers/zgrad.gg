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

    // Check if a field should be visible based on showIf condition
    const shouldShowField = (fieldConfig) => {
        if (!fieldConfig.showIf) return true;
        
        // Simple string condition - check if that field is truthy
        if (typeof fieldConfig.showIf === 'string') {
            return !!form[fieldConfig.showIf];
        }
        
        // Object condition - check if field matches value
        if (typeof fieldConfig.showIf === 'object') {
            return Object.entries(fieldConfig.showIf).every(([key, value]) => form[key] === value);
        }
        
        return true;
    };

    // Format datetime for input (convert timestamp to local datetime string)
    const formatDateTimeForInput = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        return date.toISOString().slice(0, 16);
    };

    // Parse datetime from input (convert local datetime string to timestamp)
    const parseDateTimeFromInput = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).getTime();
    };

    const renderField = (fieldKey, fieldConfig) => {
        const value = form[fieldKey];

        switch (fieldConfig.type) {
            case 'text':
                return (
                    <Input
                        key={fieldKey}
                        label={fieldConfig.label}
                        value={value || ''}
                        onChange={fieldKey === 'title' ? handleTitleChange : (val) => updateContentForm(fieldKey, val)}
                        placeholder={`Enter ${fieldConfig.label.toLowerCase()}...`}
                        required={fieldConfig.required}
                        hint={fieldKey === 'slug' ? '(URL-friendly version, auto-generated from title)' : fieldConfig.hint || fieldConfig.description}
                    />
                );

            case 'slug':
                return (
                    <Input
                        key={fieldKey}
                        label={fieldConfig.label}
                        value={value || ''}
                        onChange={(val) => updateContentForm(fieldKey, val)}
                        placeholder="url-slug"
                        required={fieldConfig.required}
                        hint="(URL-friendly version, auto-generated from title)"
                    />
                );

            case 'textarea':
                // Check if this textarea supports HTML formatting
                const supportsFormatting = fieldConfig.description && fieldConfig.description.includes('<strong>');
                
                if (supportsFormatting) {
                    // Sanitize HTML to only allow strong and em tags
                    const sanitizeHtml = (html) => {
                        if (!html) return '';
                        const temp = document.createElement('div');
                        temp.innerHTML = html;
                        // Only keep text, strong, em, b, i elements
                        const walk = (node) => {
                            const children = Array.from(node.childNodes);
                            children.forEach(child => {
                                if (child.nodeType === 3) return; // text node, keep
                                if (child.nodeType === 1) {
                                    const tag = child.tagName.toLowerCase();
                                    if (['strong', 'em', 'b', 'i'].includes(tag)) {
                                        walk(child);
                                    } else {
                                        // Replace with its text content
                                        child.replaceWith(child.textContent);
                                    }
                                }
                            });
                        };
                        walk(temp);
                        return temp.innerHTML;
                    };

                    const handleFormatClick = (command) => {
                        const editor = document.getElementById(`richtext-${fieldKey}`);
                        if (editor) {
                            editor.focus();
                            document.execCommand(command, false, null);
                            // Update form state
                            updateContentForm(fieldKey, sanitizeHtml(editor.innerHTML));
                        }
                    };
                    
                    return (
                        <div key={fieldKey} className="cms-form-group">
                            <label className="cms-label">{fieldConfig.label}</label>
                            <div className="cms-textarea-with-formatting">
                                <div className="cms-formatting-toolbar">
                                    <button
                                        type="button"
                                        className="cms-format-btn"
                                        onClick={() => handleFormatClick('bold')}
                                        title="Bold"
                                    >
                                        <strong>B</strong>
                                    </button>
                                    <button
                                        type="button"
                                        className="cms-format-btn"
                                        onClick={() => handleFormatClick('italic')}
                                        title="Italic"
                                    >
                                        <em>I</em>
                                    </button>
                                </div>
                                <div
                                    id={`richtext-${fieldKey}`}
                                    className="cms-richtext-input"
                                    contentEditable="true"
                                    dangerouslySetInnerHTML={{ __html: value || '' }}
                                    onInput={(e) => updateContentForm(fieldKey, sanitizeHtml(e.target.innerHTML))}
                                    onBlur={(e) => updateContentForm(fieldKey, sanitizeHtml(e.target.innerHTML))}
                                    data-placeholder={`Enter ${fieldConfig.label.toLowerCase()}...`}
                                />
                            </div>
                            {fieldConfig.description && (
                                <span className="cms-hint">{fieldConfig.description}</span>
                            )}
                        </div>
                    );
                }
                
                return (
                    <Textarea
                        key={fieldKey}
                        label={fieldConfig.label}
                        value={value || ''}
                        onChange={(val) => updateContentForm(fieldKey, val)}
                        placeholder={`Enter ${fieldConfig.label.toLowerCase()}...`}
                        rows={3}
                        hint={fieldConfig.hint || fieldConfig.description}
                        maxLength={fieldConfig.maxLength}
                    />
                );

            case 'select':
                return (
                    <Select
                        key={fieldKey}
                        label={fieldConfig.label}
                        value={value || ''}
                        onChange={(val) => updateContentForm(fieldKey, val)}
                        options={fieldConfig.options}
                        hint={fieldConfig.hint || fieldConfig.description}
                    />
                );

            case 'checkbox':
                return (
                    <div key={fieldKey} className="cms-form-group">
                        <label className="cms-checkbox-label">
                            <input
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => updateContentForm(fieldKey, e.target.checked)}
                                className="cms-checkbox"
                            />
                            <span className="cms-checkbox-text">{fieldConfig.label}</span>
                        </label>
                        {fieldConfig.description && (
                            <span className="cms-hint">{fieldConfig.description}</span>
                        )}
                    </div>
                );

            case 'datetime':
                return (
                    <div key={fieldKey} className="cms-form-group">
                        <label className="cms-label">{fieldConfig.label}</label>
                        <input
                            type="datetime-local"
                            className="cms-input"
                            value={formatDateTimeForInput(value)}
                            onChange={(e) => updateContentForm(fieldKey, parseDateTimeFromInput(e.target.value))}
                        />
                        {fieldConfig.description && (
                            <span className="cms-hint">{fieldConfig.description}</span>
                        )}
                    </div>
                );

            case 'image':
                return (
                    <div key={fieldKey} className="cms-form-group">
                        <label className="cms-label">{fieldConfig.label}</label>
                        <div className="cms-file-input-group">
                            <input
                                type="text"
                                className="cms-input"
                                value={value || ''}
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
                // Check conditional visibility
                if (!shouldShowField(fieldConfig)) return null;

                return renderField(fieldKey, fieldConfig);
            })}
        </div>
    );
}

