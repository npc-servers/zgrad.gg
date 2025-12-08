/**
 * CMS Sidebar Component
 */

import { activeContentType, currentView, isAdmin } from '../../store/state.js';
import { getAvailableContentTypes } from '../../config/contentTypes.js';

export function Sidebar({ onViewChange, onContentTypeChange }) {
    const view = currentView.value;
    const activeType = activeContentType.value;
    const userIsAdmin = isAdmin.value;
    
    // Filter content types based on admin status
    const contentTypes = getAvailableContentTypes().filter(type => {
        // If the content type requires admin, only show to admins
        if (type.requiresAdmin && !userIsAdmin) {
            return false;
        }
        return true;
    });

    return (
        <aside className="cms-sidebar">
            <div className="cms-sidebar-section">
                <div className="cms-sidebar-label">Content Types</div>
                {contentTypes.map(type => (
                    <button
                        key={type.id}
                        className={`cms-sidebar-btn ${activeType === type.id && view === 'list' ? 'active' : ''} ${type.requiresAdmin ? 'admin-only' : ''}`}
                        onClick={() => onContentTypeChange(type.id)}
                        title={type.requiresAdmin ? 'Admin Only' : ''}
                    >
                        <span className="cms-nav-icon">{type.icon}</span>
                        <span>{type.label}</span>
                        {type.requiresAdmin && (
                            <span className="admin-badge">Admin</span>
                        )}
                    </button>
                ))}
            </div>
            
            <div className="cms-sidebar-section">
                <div className="cms-sidebar-label">Actions</div>
                <button
                    className="cms-sidebar-btn"
                    onClick={() => onViewChange('new')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"></path>
                    </svg>
                    <span>Create New</span>
                </button>
            </div>
        </aside>
    );
}

