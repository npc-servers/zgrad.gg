/**
 * Guide Card Component
 */

import { escapeHtml } from '../../utils/helpers.js';

export function GuideCard({ guide, onEdit, onDelete }) {
    const createdDate = new Date(guide.created_at).toLocaleDateString();
    const thumbnailUrl = guide.thumbnail || '/images/placeholder.png';
    const viewCount = guide.view_count || 0;

    // Determine status badge
    let statusBadge = guide.status;
    let statusClass = guide.status;

    if (guide.draft_content && guide.status === 'published') {
        statusBadge = 'has draft';
        statusClass = 'has-draft';
    }

    // Visibility badge
    const visibilityBadge = guide.visibility === 'unlisted' ? (
        <span className="cms-guide-status unlisted">unlisted</span>
    ) : null;

    return (
        <div className="cms-guide-card">
            <img src={thumbnailUrl} alt={guide.title} className="cms-guide-thumbnail" />
            <div className="cms-guide-info">
                <div className="cms-guide-header">
                    <h3 className="cms-guide-title">{guide.title}</h3>
                    <div className="cms-guide-header-meta">
                        <span className={`cms-guide-status ${statusClass}`}>{statusBadge}</span>
                        {visibilityBadge}
                        <span className="cms-guide-views">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            {viewCount.toLocaleString()}
                        </span>
                    </div>
                </div>
                <p className="cms-guide-description">{guide.description || ''}</p>
                <div className="cms-guide-footer">
                    <div className="cms-guide-meta">
                        <span>Created: {createdDate}</span>
                        <span>Slug: {guide.slug}</span>
                    </div>
                    <div className="cms-guide-actions">
                        <button 
                            className="cms-btn cms-btn-secondary cms-guide-btn" 
                            onClick={() => onEdit(guide)}
                        >
                            Edit
                        </button>
                        <button 
                            className="cms-btn cms-btn-danger cms-guide-btn" 
                            onClick={() => onDelete(guide)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

