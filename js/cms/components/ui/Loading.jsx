/**
 * Loading and Empty State Components
 */

export function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div className="cms-loading">
            <div className="cms-spinner"></div>
            <p>{message}</p>
        </div>
    );
}

export function EmptyState({ message = 'No items found' }) {
    return (
        <div className="cms-empty">
            <p>{message}</p>
        </div>
    );
}

export function ErrorState({ message = 'Something went wrong' }) {
    return (
        <div className="cms-error">
            <p>{message}</p>
        </div>
    );
}

