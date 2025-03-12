(function() {
    function needsLegacyVersion() {
        var testDiv = document.createElement('div');
        
        // Test for flexbox support
        var hasFlexbox = false;
        var flexProperties = [
            'flex',
            '-webkit-flex',
            '-moz-flex',
            '-ms-flex'
        ];
        for (var i = 0; i < flexProperties.length; i++) {
            if (typeof testDiv.style[flexProperties[i]] !== 'undefined') {
                hasFlexbox = true;
                break;
            }
        }
        
        // Test for backdrop-filter support
        var hasBackdropFilter = false;
        var backdropProperties = [
            'backdropFilter',
            'webkitBackdropFilter',
            'mozBackdropFilter',
            'msBackdropFilter'
        ];
        for (var i = 0; i < backdropProperties.length; i++) {
            if (typeof testDiv.style[backdropProperties[i]] !== 'undefined') {
                hasBackdropFilter = true;
                break;
            }
        }

        // Test for CSS variables support
        var hasVars = false;
        try {
            hasVars = window.CSS && window.CSS.supports && (
                window.CSS.supports('--test', '0') ||
                window.CSS.supports('var(--test)', '0')
            );
        } catch(e) {
            hasVars = false;
        }

        // Test for modern clipboard API
        var hasModernClipboard = !!navigator.clipboard;

        // Test for CSS Grid support
        var hasGrid = false;
        var gridProperties = [
            'grid',
            '-ms-grid',
            '-webkit-grid'
        ];
        for (var i = 0; i < gridProperties.length; i++) {
            if (typeof testDiv.style[gridProperties[i]] !== 'undefined') {
                hasGrid = true;
                break;
            }
        }

        // If any of these modern features are missing, use legacy version
        return !(hasFlexbox && hasBackdropFilter && hasVars && hasModernClipboard && hasGrid);
    }

    // Check if we need to redirect
    if (needsLegacyVersion()) {
        // Get current path and replace with legacy version
        var currentPath = window.location.pathname;
        var currentHash = window.location.hash;
        
        // Only redirect if we're not already on the legacy version
        if (currentPath.indexOf('/legacy/') === -1) {
            var legacyPath = currentPath.replace('rules.html', 'legacy/rules.html');
            window.location.href = legacyPath + currentHash;
        }
    }
})(); 