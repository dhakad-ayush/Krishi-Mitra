// Wait for the document to be fully loaded
document.addEventListener("DOMContentLoaded", function() {

    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            // Add the 'scrolled' class if user scrolls more than 50px
            navbar.classList.add('scrolled');
        } else {
            // Remove the 'scrolled' class if user is at the top
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Initialize AOS (Animate on Scroll)
    AOS.init({
        duration: 800, // Animation duration in milliseconds
        once: true,    // Whether animation should happen only once
    });

});