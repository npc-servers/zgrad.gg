/**
 * Reusable Modal Component
 */

import { useState } from 'preact/hooks';

export function Modal({ 
    isOpen, 
    onClose, 
    title, 
    children,
    position = 'center', // 'center' | 'right'
    className = '',
    showOverlay = true
}) {
    if (!isOpen) return null;

    const positionClass = position === 'right' ? 'cms-modal-right' : '';

    return (
        <div className={`cms-modal ${className}`} style={{ display: 'flex' }}>
            {showOverlay && (
                <div className="cms-modal-overlay" onClick={onClose}></div>
            )}
            <div className={`cms-modal-content ${positionClass}`}>
                {title && (
                    <div className="cms-modal-header">
                        <h3>{title}</h3>
                        <button className="cms-modal-close" onClick={onClose}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}
                <div className="cms-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ConfirmModal({ isOpen, onConfirm, onCancel, message, title = 'Confirm Action' }) {
    if (!isOpen) return null;

    return (
        <div className="cms-custom-modal-overlay">
            <div className="cms-custom-modal">
                <div className="cms-custom-modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="cms-custom-modal-body">
                    <p>{message}</p>
                </div>
                <div className="cms-custom-modal-actions">
                    <button className="cms-btn cms-btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="cms-btn cms-btn-danger" onClick={onConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PromptModal({ isOpen, onSubmit, onCancel, message, placeholder, initialValue = '' }) {
    if (!isOpen) return null;

    const [inputValue, setInputValue] = useState(initialValue);

    const handleSubmit = () => {
        if (inputValue.trim()) {
            onSubmit(inputValue);
            setInputValue(initialValue); // Reset for next time
        }
    };

    return (
        <div className="cms-custom-modal-overlay">
            <div className="cms-custom-modal">
                <div className="cms-custom-modal-header">
                    <h3>{message}</h3>
                </div>
                <div className="cms-custom-modal-body">
                    <input
                        type="text"
                        className="cms-input"
                        placeholder={placeholder}
                        value={inputValue}
                        onInput={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        autoFocus
                    />
                </div>
                <div className="cms-custom-modal-actions">
                    <button className="cms-btn cms-btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="cms-btn cms-btn-primary cms-btn-success" onClick={handleSubmit}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

