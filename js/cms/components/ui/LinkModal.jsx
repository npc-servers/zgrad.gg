/**
 * Link Modal Component
 * Prompts for URL and optionally display text
 */

import { useState, useEffect } from 'preact/hooks';

export function LinkModal({ isOpen, onSubmit, onCancel, hasSelection }) {
    const [url, setUrl] = useState('https://');
    const [text, setText] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setUrl('https://');
            setText('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (url.trim()) {
            onSubmit(url.trim(), hasSelection ? null : text.trim());
            setUrl('https://');
            setText('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="cms-custom-modal-overlay">
            <div className="cms-custom-modal">
                <div className="cms-custom-modal-header">
                    <h3>Add Link</h3>
                </div>
                <div className="cms-custom-modal-body">
                    <div className="cms-form-group" style={{ marginBottom: '16px' }}>
                        <label className="cms-label">URL</label>
                        <input
                            type="text"
                            className="cms-input"
                            placeholder="https://example.com"
                            value={url}
                            onInput={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && hasSelection && handleSubmit()}
                            autoFocus
                        />
                    </div>
                    {!hasSelection && (
                        <div className="cms-form-group">
                            <label className="cms-label">Display Text</label>
                            <input
                                type="text"
                                className="cms-input"
                                placeholder="Click here"
                                value={text}
                                onInput={(e) => setText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            />
                        </div>
                    )}
                </div>
                <div className="cms-custom-modal-actions">
                    <button className="cms-btn cms-btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="cms-btn cms-btn-primary cms-btn-success" onClick={handleSubmit}>
                        Add Link
                    </button>
                </div>
            </div>
        </div>
    );
}

