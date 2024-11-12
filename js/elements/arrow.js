document.addEventListener('DOMContentLoaded', function() {
    const downArrow = document.getElementById('downArrow');

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 0) {
            downArrow.classList.add('hide-arrow');
        } else {
            downArrow.classList.remove('hide-arrow');
        }
    });

    downArrow.addEventListener('click', function() {
        const banner = document.querySelector('.banner');
        const bannerBottom = banner.offsetTop + banner.offsetHeight;

        window.scrollTo({
            top: bannerBottom,
            behavior: 'smooth'
        });
    });
});