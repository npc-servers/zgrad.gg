/**
 * Helper utilities
 */

export function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatStepCardsHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const stepCards = doc.querySelectorAll('[data-type="step-card"]');

    stepCards.forEach(card => {
        const hasStepHeader = Array.from(card.children).some(
            child => child.classList && child.classList.contains('step-header')
        );
        if (hasStepHeader) {
            card.classList.add('step-card');
            return;
        }

        const h3 = card.querySelector('h3');
        if (!h3) return;

        const title = h3.textContent;

        const stepHeader = document.createElement('div');
        stepHeader.className = 'step-header';

        const stepTitle = document.createElement('h3');
        stepTitle.className = 'step-title';
        stepTitle.textContent = title;

        stepHeader.appendChild(stepTitle);

        const stepDescription = document.createElement('div');
        stepDescription.className = 'step-description';

        const children = Array.from(card.children);
        children.forEach(child => {
            if (child !== h3) {
                stepDescription.appendChild(child.cloneNode(true));
            }
        });

        card.innerHTML = '';
        card.appendChild(stepHeader);
        card.appendChild(stepDescription);

        card.classList.add('step-card');
    });

    return doc.body.innerHTML;
}

