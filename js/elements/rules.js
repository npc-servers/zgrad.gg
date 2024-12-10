// Highlight rule if it's linked to
function highlightLinkedRule() {
    const hash = window.location.hash;
    if (hash) {
        const rule = document.querySelector(hash);
        if (rule) {
            rule.classList.add('highlighted');
            rule.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Extract rule number from hash (e.g., #rule1 -> 1)
            const ruleNumber = hash.replace('#rule', '');
            updateMetaTags(ruleNumber);
        }
    } else {
        // No hash, reset to default meta tags
        updateMetaTags(null);
    }
}

// Run on page load and when hash changes
window.addEventListener('load', highlightLinkedRule);
window.addEventListener('hashchange', highlightLinkedRule);

function copyLink(ruleNumber) {
    const url = `${window.location.origin}${window.location.pathname}#rule${ruleNumber}`;
    
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).catch(() => {
            fallbackCopyLink(url);
        });
    } else {
        fallbackCopyLink(url);
    }

    // Visual feedback
    const button = document.querySelector(`#rule${ruleNumber} .link-button`);
    button.classList.add('copied');
    setTimeout(() => {
        button.classList.remove('copied');
    }, 1000);
}

function fallbackCopyLink(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Failed to copy link');
    }
    document.body.removeChild(textarea);
}

// Function to update meta tags based on rule number
function updateMetaTags(ruleNumber) {
    if (!ruleNumber) {
        // Reset to default meta tags
        document.querySelector('meta[property="og:title"]').content = "ZGRAD - Server Guidelines";
        document.querySelector('meta[property="og:description"]').content = "Learn about ZGRAD's server rules and guidelines. Understand our community standards to ensure a fair and enjoyable gaming experience for everyone.";
        return;
    }

    // Get rule-specific meta tags
    const ruleTitle = document.querySelector(`meta[property="og:rule${ruleNumber}:title"]`);
    const ruleDescription = document.querySelector(`meta[property="og:rule${ruleNumber}:description"]`);

    if (ruleTitle && ruleDescription) {
        // Update the general meta tags with rule-specific content
        document.querySelector('meta[property="og:title"]').content = ruleTitle.content;
        document.querySelector('meta[property="og:description"]').content = ruleDescription.content;
    }
} 