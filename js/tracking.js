/**
 * Metricool Tracking Script
 * Handles analytics tracking for ZGRAD website
 */

function loadScript(a) {
    var b = document.getElementsByTagName("head")[0],
        c = document.createElement("script");
    c.type = "text/javascript";
    c.src = "https://tracker.metricool.com/resources/be.js";
    c.onreadystatechange = a;
    c.onload = a;
    c.onerror = function() {
        console.log('Analytics tracking script blocked or unavailable');
    };
    b.appendChild(c);
}

loadScript(function() {
    try {
        if (typeof beTracker !== 'undefined') {
            beTracker.t({
                hash: "93604ee7498aa8b63d0dbb2c30c33183"
            });
        }
    } catch (error) {
        // Tracking script blocked or failed to load (ad blockers, etc.)
        console.log('Analytics tracking unavailable');
    }
});
