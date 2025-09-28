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
    b.appendChild(c);
}

loadScript(function() {
    beTracker.t({
        hash: "93604ee7498aa8b63d0dbb2c30c33183"
    });
});
