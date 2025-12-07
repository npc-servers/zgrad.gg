/**
 * Generic Content Card Component
 * Displays a content item card based on content type configuration
 */

export function ContentCard({ item, contentType, config, onEdit, onDelete, lock, isLockedByOther }) {
    const createdDate = new Date(item.created_at).toLocaleDateString();
    
    // Get thumbnail/image based on content type
    const thumbnailField = config.fields.thumbnail ? 'thumbnail' : 
                          config.fields.cover_image ? 'cover_image' :
                          config.fields.featured_image ? 'featured_image' : null;
    const thumbnailUrl = thumbnailField ? (item[thumbnailField] || '/images/placeholder.png') : '/images/placeholder.png';
    
    const viewCount = item.view_count || 0;

    // Determine status badge
    let statusBadge = item.status;
    let statusClass = item.status;

    if (item.draft_content && item.status === 'published') {
        statusBadge = 'has draft';
        statusClass = 'has-draft';
    }

    // Visibility badge
    const visibilityBadge = item.visibility === 'unlisted' ? (
        <span className="cms-guide-status unlisted">unlisted</span>
    ) : null;

    // Category badge (for news)
    const categoryBadge = item.category ? (
        <span className="cms-guide-status category">{item.category}</span>
    ) : null;

    // Description/excerpt field
    const descriptionField = config.fields.description ? 'description' : 
                            config.fields.excerpt ? 'excerpt' : null;
    const description = descriptionField ? item[descriptionField] : '';

    return (
        <div className={`cms-guide-card ${isLockedByOther ? 'cms-card-locked' : ''}`}>
            {/* Lock indicator */}
            {lock && (
                <div className={`cms-lock-indicator ${isLockedByOther ? 'locked-by-other' : 'locked-by-you'}`}>
                    <div className="cms-lock-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        {lock.avatar && (
                            <img 
                                src={`https://cdn.discordapp.com/avatars/${lock.user_id}/${lock.avatar}.png?size=32`} 
                                alt={lock.username}
                                className="cms-lock-avatar"
                            />
                        )}
                        <span className="cms-lock-username">
                            {isLockedByOther ? lock.username : 'You'}
                        </span>
                    </div>
                </div>
            )}
            
            <img src={thumbnailUrl} alt={item.title} className="cms-guide-thumbnail" />
            <div className="cms-guide-info">
                <div className="cms-guide-header">
                    <h3 className="cms-guide-title">{item.title}</h3>
                    <div className="cms-guide-header-meta">
                        <span className={`cms-guide-status ${statusClass}`}>{statusBadge}</span>
                        {visibilityBadge}
                        {categoryBadge}
                        <span className="cms-guide-views">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            {viewCount.toLocaleString()}
                        </span>
                    </div>
                </div>
                {description && <p className="cms-guide-description">{description}</p>}
                <div className="cms-guide-footer">
                    <div className="cms-guide-meta">
                        <span>Created: {createdDate}</span>
                        <span>Slug: {item.slug}</span>
                    </div>
                    <div className="cms-guide-actions">
                        <button 
                            className={`cms-btn cms-btn-secondary cms-guide-btn ${isLockedByOther ? 'cms-btn-disabled' : ''}`}
                            onClick={onEdit}
                            disabled={isLockedByOther}
                            title={isLockedByOther ? `Being edited by ${lock.username}` : 'Edit'}
                        >
                            {isLockedByOther ? 'Locked' : 'Edit'}
                        </button>
                        <button 
                            className="cms-btn cms-btn-danger cms-guide-btn" 
                            onClick={onDelete}
                            disabled={isLockedByOther}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

