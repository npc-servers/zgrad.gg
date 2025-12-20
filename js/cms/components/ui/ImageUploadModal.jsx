/**
 * Image Upload Modal Component
 * Allows users to select an image and choose whether to preserve transparency
 */

import { useState, useRef, useEffect } from 'preact/hooks';

export function ImageUploadModal({ isOpen, onUpload, onCancel }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preserveTransparency, setPreserveTransparency] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
            setPreserveTransparency(false);
            setPreview(null);
        }
    }, [isOpen]);

    // Generate preview when file is selected
    useEffect(() => {
        if (!selectedFile) {
            setPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            
            // Auto-enable transparency preservation for PNG files
            if (file.type === 'image/png') {
                setPreserveTransparency(true);
            }
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = () => {
        if (selectedFile) {
            onUpload(selectedFile, { preserveTransparency });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            if (file.type === 'image/png') {
                setPreserveTransparency(true);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    if (!isOpen) return null;

    return (
        <div className="cms-custom-modal-overlay">
            <div className="cms-custom-modal" style={{ maxWidth: '500px' }}>
                <div className="cms-custom-modal-header">
                    <h3>Insert Image</h3>
                </div>
                <div className="cms-custom-modal-body">
                    {/* File Selection Area */}
                    <div 
                        className="cms-image-drop-zone"
                        onClick={handleBrowseClick}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        style={{
                            border: '2px dashed #444',
                            borderRadius: '8px',
                            padding: '24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            marginBottom: '16px',
                            backgroundColor: selectedFile ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255,255,255,0.02)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        
                        {preview ? (
                            <div>
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '150px', 
                                        borderRadius: '4px',
                                        marginBottom: '8px'
                                    }} 
                                />
                                <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
                                    {selectedFile.name}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                    style={{ width: '48px', height: '48px', color: '#666', marginBottom: '12px' }}
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                <p style={{ color: '#aaa', margin: 0 }}>
                                    Click to browse or drag and drop an image
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Transparency Option */}
                    <div 
                        className="cms-form-group"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '12px',
                            padding: '12px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderRadius: '6px',
                            border: '1px solid #333',
                        }}
                    >
                        <input
                            type="checkbox"
                            id="preserveTransparency"
                            checked={preserveTransparency}
                            onChange={(e) => setPreserveTransparency(e.target.checked)}
                            style={{ 
                                marginTop: '3px',
                                width: '18px',
                                height: '18px',
                                accentColor: '#6366f1',
                            }}
                        />
                        <div>
                            <label 
                                htmlFor="preserveTransparency" 
                                className="cms-label"
                                style={{ 
                                    cursor: 'pointer', 
                                    marginBottom: '4px',
                                    display: 'block',
                                }}
                            >
                                Preserve transparency
                            </label>
                            <p style={{ 
                                color: '#888', 
                                fontSize: '13px', 
                                margin: 0,
                                lineHeight: '1.4',
                            }}>
                                Outputs as WebP to keep transparent areas. 
                                Leave unchecked to convert to JPEG (smaller file, white background).
                            </p>
                        </div>
                    </div>
                </div>
                <div className="cms-custom-modal-actions">
                    <button className="cms-btn cms-btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className="cms-btn cms-btn-primary cms-btn-success" 
                        onClick={handleSubmit}
                        disabled={!selectedFile}
                        style={{ opacity: selectedFile ? 1 : 0.5 }}
                    >
                        Upload & Insert
                    </button>
                </div>
            </div>
        </div>
    );
}
