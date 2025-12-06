/**
 * Guide Metadata Component - displays author, dates, and view count
 */

import { escapeHtml } from '../../utils/helpers.js';

export function GuideMetadata({ guide }) {
    if (!guide || !guide.id) return null;

    const createdDate = new Date(guide.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    const viewCount = guide.view_count || 0;
    
    // Check if updated date is different from created date
    const showUpdatedDate = guide.updated_at && guide.updated_at !== guide.created_at;
    const updatedDate = showUpdatedDate ? new Date(guide.updated_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    }) : null;

    return (
        <div className="cms-authorship-info">
            <div className="cms-authorship-header">
                <h4>Guide Information</h4>
                <div className="cms-metadata-section">
                    <div className="cms-metadata-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span className="cms-metadata-label">Created:</span>
                        <span className="cms-metadata-value">{createdDate}</span>
                    </div>
                    
                    <div className="cms-metadata-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span className="cms-metadata-label">Views:</span>
                        <span className="cms-metadata-value">{viewCount.toLocaleString()}</span>
                    </div>
                    
                    {showUpdatedDate && (
                        <div className="cms-metadata-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            <span className="cms-metadata-label">Updated:</span>
                            <span className="cms-metadata-value">{updatedDate}</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="cms-authorship-content">
                <div className="cms-author-section">
                    <span className="cms-authorship-label">Original Author:</span>
                    <div className="cms-user-badge">
                        {guide.author_avatar && (
                            <img 
                                src={`https://cdn.discordapp.com/avatars/${guide.author_id}/${guide.author_avatar}.png`} 
                                alt={guide.author_name} 
                                className="cms-user-badge-avatar"
                            />
                        )}
                        <span className="cms-user-badge-name">{guide.author_name || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

