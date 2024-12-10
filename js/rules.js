// Highlight rule if it's linked to
function highlightLinkedRule() {
    const hash = window.location.hash;
    if (hash) {
        const rule = document.querySelector(hash);
        if (rule) {
            rule.classList.add('highlighted');
            rule.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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