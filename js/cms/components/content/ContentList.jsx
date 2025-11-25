/**
 * Generic Content List Component
 * Works with any content type based on configuration
 */

import { activeContentType, activeContentList, isLoadingContent } from '../../store/state.js';
import { getContentTypeConfig } from '../../config/contentTypes.js';
import { Button } from '../ui/Button.jsx';
import { LoadingSpinner } from '../ui/Loading.jsx';
import { ContentCard } from './ContentCard.jsx';

export function ContentList({ onCreateNew, onEdit, onDelete }) {
    const contentType = activeContentType.value;
    const items = activeContentList.value;
    const isLoading = isLoadingContent.value;
    const config = getContentTypeConfig(contentType);

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
                <Button variant="primary" onClick={onCreateNew}>
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
                    {items.map(item => (
                        <ContentCard
                            key={item.id}
                            item={item}
                            contentType={contentType}
                            config={config}
                            onEdit={() => onEdit(item)}
                            onDelete={() => onDelete(item)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

