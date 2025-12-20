/**
 * Generic Content List Component
 * Works with any content type based on configuration
 * 
 * Note: We access .value inside the render to ensure Preact signals auto-subscribe
 */

import { activeContentType, activeContentList, isLoadingContent, activeLocks, currentUser } from '../../store/state.js';
import { getContentTypeConfig } from '../../config/contentTypes.js';
import { Button } from '../ui/Button.jsx';
import { LoadingSpinner } from '../ui/Loading.jsx';
import { ContentCard } from './ContentCard.jsx';

export function ContentList({ onCreateNew, onEdit, onDelete }) {
    // Access signals directly - Preact will auto-subscribe to changes
    // By accessing .value here, the component re-renders when any of these change
    const contentType = activeContentType.value;
    const items = activeContentList.value;
    const isLoading = isLoadingContent.value;
    const locks = activeLocks.value;
    const user = currentUser.value;
    const config = getContentTypeConfig(contentType);

    // Helper to find lock for an item
    const getLockForItem = (itemId) => {
        return locks.find(lock => 
            lock.content_type === contentType && 
            lock.content_id === itemId
        );
    };

    if (!config) {
        return (
            <div className="cms-view">
                <div className="cms-error">Unknown content type: {contentType}</div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="cms-view">
                <LoadingSpinner message={`Loading ${config.label.toLowerCase()}...`} />
            </div>
        );
    }

    return (
        <div className="cms-view">
            <div className="cms-content-header">
                <h1 className="cms-content-title">{config.icon} {config.label}</h1>
                <Button variant="primary" color="blue" onClick={onCreateNew}>
                    Create New {config.labelSingular}
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="cms-empty-state">
                    <div className="cms-empty-icon">{config.icon}</div>
                    <h2>No {config.label} Yet</h2>
                    <p>Get started by creating your first {config.labelSingular.toLowerCase()}.</p>
                    <Button variant="primary" onClick={onCreateNew}>
                        Create {config.labelSingular}
                    </Button>
                </div>
            ) : (
                <div className="cms-content-grid">
                    {items.map(item => {
                        const lock = getLockForItem(item.id);
                        const isLockedByOther = lock && user && lock.user_id !== user.id;
                        
                        return (
                            <ContentCard
                                key={item.id}
                                item={item}
                                contentType={contentType}
                                config={config}
                                onEdit={() => onEdit(item)}
                                onDelete={() => onDelete(item)}
                                lock={lock}
                                isLockedByOther={isLockedByOther}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

