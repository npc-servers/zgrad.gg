document.addEventListener('DOMContentLoaded', function() {
    // Start with a very short initial delay
    setTimeout(() => {
        // Check if critical images are loaded
        const criticalImages = Array.from(document.querySelectorAll('.navbar-logo, .large-logo'));
        Promise.all(
            criticalImages.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', resolve);
                });
            })
        ).then(() => {
            // Show content immediately after critical images load
            document.body.classList.add('loaded');
            const loader = document.querySelector('.loader-wrapper');
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 200); // Shorter hide delay
        });

        // Load remaining images in the background
        const remainingImages = Array.from(document.images)
            .filter(img => !criticalImages.includes(img));
        Promise.all(
            remainingImages.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', resolve);
                });
            })
        );
    }, 100); // Very short initial delay
});