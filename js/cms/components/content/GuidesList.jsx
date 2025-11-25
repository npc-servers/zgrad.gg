/**
 * Guides List View Component
 */

import { guides, isLoadingGuides } from '../../store/state.js';
import { GuideCard } from './GuideCard.jsx';
import { LoadingSpinner, EmptyState } from '../ui/Loading.jsx';
import { Button } from '../ui/Button.jsx';

export function GuidesList({ onCreateNew, onEditGuide, onDeleteGuide }) {
    const guidesList = guides.value;
    const loading = isLoadingGuides.value;

    if (loading) {
        return <LoadingSpinner message="Loading guides..." />;
    }

    return (
        <div className="cms-view" id="guidesView">
            <div className="cms-content-header">
                <h1 className="cms-content-title">My Guides</h1>
                <Button variant="primary" color="blue" onClick={onCreateNew}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"></path>
                    </svg>
                    Create New Guide
                </Button>
            </div>

            <div className="cms-guides-list">
                {guidesList.length === 0 ? (
                    <EmptyState message="No guides yet. Create your first guide!" />
                ) : (
                    guidesList.map(guide => (
                        <GuideCard
                            key={guide.id}
                            guide={guide}
                            onEdit={onEditGuide}
                            onDelete={onDeleteGuide}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

