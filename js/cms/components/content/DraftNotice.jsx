/**
 * Draft Notice Component
 * Shows when editing a published guide with draft changes
 */

export function DraftNotice({ guide, onDiscardDraft }) {
    if (!guide || guide.status !== 'published' || !guide.draft_content) {
        return null;
    }

    return (
        <div className="cms-draft-notice">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div>
                <strong>You're editing draft changes</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                    This guide is published, but you have unpublished draft changes. Publishing will update the live guide.
                </p>
            </div>
            <button 
                className="cms-btn cms-btn-secondary cms-btn-sm" 
                onClick={onDiscardDraft}
                style={{ marginLeft: 'auto' }}
            >
                Discard Draft
            </button>
        </div>
    );
}

