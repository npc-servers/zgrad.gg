/**
 * Image Settings Modal Component
 */

import { useState, useEffect } from 'preact/hooks';
import { editorInstance } from '../../store/state.js';

export function ImageSettingsModal({ isOpen, onClose }) {
    const [width, setWidth] = useState('600px');
    const [align, setAlign] = useState('center');
    const [customWidth, setCustomWidth] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const editor = editorInstance.value;
        if (!editor) return;

        const { selection, doc } = editor.state;
        const node = doc.nodeAt(selection.from);

        if (node && node.type.name === 'guideImage') {
            const currentWidth = node.attrs.width || '600px';
            const currentAlign = node.attrs.align || 'center';
            
            setWidth(currentWidth);
            setAlign(currentAlign);
            
            const presetWidths = ['300px', '450px', '600px', '100%'];
            if (!presetWidths.includes(currentWidth)) {
                setCustomWidth(currentWidth);
            } else {
                setCustomWidth('');
            }
        }
    }, [isOpen]);

    const handleApply = () => {
        const editor = editorInstance.value;
        if (!editor) return;

        const finalWidth = customWidth || width;
        editor.chain().focus().updateGuideImage({ width: finalWidth, align }).run();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="cms-modal" style={{ display: 'flex' }}>
            <div className="cms-modal-content" style={{ position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="cms-modal-header">
                    <h2 className="cms-modal-title">Image Settings</h2>
                </div>
                <div className="cms-modal-body">
                    <div className="cms-form-group">
                        <label className="cms-label">Width</label>
                        <div className="cms-image-width-options">
                            <button
                                type="button"
                                className={`cms-width-btn ${width === '300px' && !customWidth ? 'active' : ''}`}
                                onClick={() => { setWidth('300px'); setCustomWidth(''); }}
                            >
                                Small (300px)
                            </button>
                            <button
                                type="button"
                                className={`cms-width-btn ${width === '450px' && !customWidth ? 'active' : ''}`}
                                onClick={() => { setWidth('450px'); setCustomWidth(''); }}
                            >
                                Medium (450px)
                            </button>
                            <button
                                type="button"
                                className={`cms-width-btn ${width === '600px' && !customWidth ? 'active' : ''}`}
                                onClick={() => { setWidth('600px'); setCustomWidth(''); }}
                            >
                                Large (600px)
                            </button>
                            <button
                                type="button"
                                className={`cms-width-btn ${width === '100%' && !customWidth ? 'active' : ''}`}
                                onClick={() => { setWidth('100%'); setCustomWidth(''); }}
                            >
                                Full Width
                            </button>
                        </div>
                        <input
                            type="text"
                            className="cms-input"
                            placeholder="Or enter custom (e.g., 500px)"
                            style={{ marginTop: '12px' }}
                            value={customWidth}
                            onInput={(e) => setCustomWidth(e.target.value)}
                        />
                    </div>

                    <div className="cms-form-group">
                        <label className="cms-label">Alignment</label>
                        <div className="cms-image-align-options">
                            <button
                                type="button"
                                className={`cms-align-btn ${align === 'left' ? 'active' : ''}`}
                                onClick={() => setAlign('left')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="17" y1="10" x2="3" y2="10"></line>
                                    <line x1="21" y1="6" x2="3" y2="6"></line>
                                    <line x1="21" y1="14" x2="3" y2="14"></line>
                                    <line x1="17" y1="18" x2="3" y2="18"></line>
                                </svg>
                                Left
                            </button>
                            <button
                                type="button"
                                className={`cms-align-btn ${align === 'center' ? 'active' : ''}`}
                                onClick={() => setAlign('center')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="18" y1="10" x2="6" y2="10"></line>
                                    <line x1="21" y1="6" x2="3" y2="6"></line>
                                    <line x1="21" y1="14" x2="3" y2="14"></line>
                                    <line x1="18" y1="18" x2="6" y2="18"></line>
                                </svg>
                                Center
                            </button>
                            <button
                                type="button"
                                className={`cms-align-btn ${align === 'right' ? 'active' : ''}`}
                                onClick={() => setAlign('right')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="21" y1="10" x2="7" y2="10"></line>
                                    <line x1="21" y1="6" x2="3" y2="6"></line>
                                    <line x1="21" y1="14" x2="3" y2="14"></line>
                                    <line x1="21" y1="18" x2="7" y2="18"></line>
                                </svg>
                                Right
                            </button>
                        </div>
                    </div>

                    <div className="cms-modal-actions">
                        <button type="button" className="cms-btn cms-btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" className="cms-btn cms-btn-primary cms-btn-success" onClick={handleApply}>
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

