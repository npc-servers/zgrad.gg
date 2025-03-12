function copyLink(ruleId) {
    var url = window.location.href.split('#')[0] + '#' + ruleId;
    // Legacy fallback for clipboard
    if (window.clipboardData && window.clipboardData.setData) {
        window.clipboardData.setData('Text', url);
        showToast('Link copied to clipboard!');
    } else {
        // Create temporary input element
        var tempInput = document.createElement('input');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-1000px';
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            showToast('Link copied to clipboard!');
        } catch (err) {
            showToast('Failed to copy link. Please copy manually: ' + url);
        }
        document.body.removeChild(tempInput);
    }
}

function copyText(button) {
    var ruleCard = findParentByClass(button, 'rule-card');
    var title = ruleCard.getElementsByClassName('rule-title')[0].textContent;
    var description = ruleCard.getElementsByClassName('rule-description')[0].textContent;
    var text = title + '\n' + description;

    // Legacy fallback for clipboard
    if (window.clipboardData && window.clipboardData.setData) {
        window.clipboardData.setData('Text', text);
        showToast('Rule copied to clipboard!');
    } else {
        // Create temporary input element
        var tempInput = document.createElement('textarea');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-1000px';
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            showToast('Rule copied to clipboard!');
        } catch (err) {
            showToast('Failed to copy text. Please copy manually.');
        }
        document.body.removeChild(tempInput);
    }
}

function showToast(message) {
    // Remove existing toast if any
    var existingToast = document.querySelector('.toast');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }

    // Create and show new toast
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Force reflow to enable transition
    toast.offsetHeight;
    toast.className = 'toast visible';

    // Remove toast after delay
    setTimeout(function() {
        if (toast.parentNode) {
            document.body.removeChild(toast);
        }
    }, 3000);
}

// Helper function to find parent element with class
function findParentByClass(element, className) {
    while (element && !hasClass(element, className)) {
        element = element.parentNode;
    }
    return element;
}

// Helper function for class manipulation
function hasClass(el, className) {
    if (el.classList) {
        return el.classList.contains(className);
    }
    return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
}

function addClass(el, className) {
    if (el.classList) {
        el.classList.add(className);
    } else {
        el.className += ' ' + className;
    }
}

function removeClass(el, className) {
    if (el.classList) {
        el.classList.remove(className);
    } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
}

// Helper function to get elements by class name (for older IE)
function getElementsByClassName(className) {
    if (document.getElementsByClassName) {
        return document.getElementsByClassName(className);
    } else {
        var elements = document.getElementsByTagName('*');
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            if (hasClass(elements[i], className)) {
                result.push(elements[i]);
            }
        }
        return result;
    }
}

// Initialize rules
function initRules() {
    var ruleCards = document.getElementsByClassName('rule-card');
    var i;

    // Add hover event listeners to rule cards
    for (i = 0; i < ruleCards.length; i++) {
        ruleCards[i].onmouseover = function() {
            if (!hasClass(this, 'expanded')) {
                addClass(this, 'expanded');
            }
        };
        
        ruleCards[i].onmouseout = function() {
            var hash = window.location.hash.substring(1);
            // Only collapse if not clicked (no clicked class) and not hash-targeted
            if (hasClass(this, 'expanded') && !hasClass(this, 'clicked') && this.id !== hash) {
                removeClass(this, 'expanded');
            }
        };

        ruleCards[i].onclick = function() {
            if (hasClass(this, 'clicked')) {
                removeClass(this, 'clicked');
                removeClass(this, 'expanded');
            } else {
                addClass(this, 'clicked');
                addClass(this, 'expanded');
            }
        };
    }

    // Check URL hash and expand corresponding rule
    function checkHash() {
        var hash = window.location.hash;
        if (hash) {
            var targetRule = document.getElementById(hash.substring(1));
            if (targetRule) {
                addClass(targetRule, 'expanded');
                addClass(targetRule, 'clicked');
            }
        }
    }

    // Handle hash changes
    if (window.addEventListener) {
        window.addEventListener('hashchange', checkHash, false);
    } else {
        window.attachEvent('onhashchange', checkHash);
    }

    // Check hash on page load
    checkHash();
}

// Initialize when DOM is ready
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', initRules, false);
} else {
    window.attachEvent('onload', initRules);
} 