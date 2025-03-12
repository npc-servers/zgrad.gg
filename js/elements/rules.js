function copyLink(ruleId) {
    const url = window.location.href.split('#')[0] + '#' + ruleId;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
    });
}

function copyText(button) {
    const ruleCard = button.closest('.rule-card');
    const title = ruleCard.querySelector('.rule-title').textContent;
    const description = ruleCard.querySelector('.rule-description').textContent;
    const text = `${title}\n${description}`;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Rule copied to clipboard!');
    });
}

function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create and show new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Collapse all rules except the target
function collapseAllExcept(targetId) {
    document.querySelectorAll('.rule-card').forEach(card => {
        if (card.id !== targetId) {
            card.classList.remove('expanded');
        }
    });
}

// Initialize rules functionality
function initRules() {
    // Set animation order for rule cards
    document.querySelectorAll('.rule-card').forEach((card, index) => {
        card.style.setProperty('--animation-order', index);
    });

    // Handle rule card clicks
    document.querySelectorAll('.rule-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't toggle if clicking on action buttons
            if (!e.target.closest('.rule-actions')) {
                card.classList.toggle('expanded');
                collapseAllExcept(card.id);
            }
        });
    });

    // Handle hash changes and initial load
    function handleHashChange() {
        const hash = window.location.hash;
        if (hash) {
            const targetRule = document.querySelector(hash);
            if (targetRule) {
                // Collapse all rules first
                collapseAllExcept(targetRule.id);
                // Expand the target rule
                targetRule.classList.add('expanded');
                // Scroll into view with some delay to ensure smooth transition
                setTimeout(() => {
                    targetRule.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('load', handleHashChange);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initRules); 