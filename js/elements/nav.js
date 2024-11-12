document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 0) {
            navbar.classList.add('blur');
        } else {
            navbar.classList.remove('blur');
        }
    });
});