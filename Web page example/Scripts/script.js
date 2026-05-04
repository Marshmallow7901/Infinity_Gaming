document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;
    const nav = document.querySelector('nav');
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = navMenu ? Array.from(navMenu.querySelectorAll('a')) : [];

    function normalizePath(pathValue) {
        const value = decodeURIComponent(pathValue || '').toLowerCase();
        return value.split('/').pop() || value;
    }

    function setupActiveNavLink() {
        if (!navLinks.length) {
            return;
        }

        const currentPath = normalizePath(window.location.pathname);
        navLinks.forEach(function (link) {
            const href = link.getAttribute('href') || '';
            const linkPath = normalizePath(href);
            if (linkPath && currentPath === linkPath) {
                link.classList.add('active-link');
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    function closeMobileMenu() {
        if (!mobileMenu || !navMenu) {
            return;
        }
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    }

    function setupMobileMenu() {
        if (!mobileMenu || !navMenu) {
            return;
        }

        mobileMenu.addEventListener('click', function () {
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navLinks.forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });

        document.addEventListener('click', function (event) {
            const clickInsideMenu = navMenu.contains(event.target);
            const clickOnToggle = mobileMenu.contains(event.target);
            if (!clickInsideMenu && !clickOnToggle && navMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }

    function setupNavbarScrollState() {
        if (!nav) {
            return;
        }

        function onScroll() {
            nav.classList.toggle('scrolled', window.scrollY > 14);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function setupRevealAnimations() {
        const revealTargets = Array.from(document.querySelectorAll(
            '.hero-content, .container, .left-column, .right-column, .slideshow-container, .shop .title, .product-box, .event, .sub-hero-inner, .plans-section, .championships-section, .form-section, .faq-section, .contact-wrapper form'
        ));

        if (!revealTargets.length) {
            return;
        }

        revealTargets.forEach(function (target, index) {
            target.classList.add('reveal-item');
            target.style.setProperty('--reveal-delay', String((index % 10) * 40) + 'ms');
        });

        if (!('IntersectionObserver' in window)) {
            revealTargets.forEach(function (target) {
                target.classList.add('reveal-in');
            });
            return;
        }

        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-in');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -8% 0px'
        });

        revealTargets.forEach(function (target) {
            observer.observe(target);
        });
    }

    function optimizeImages() {
        const images = Array.from(document.querySelectorAll('img'));
        images.forEach(function (img) {
            const insideNav = !!img.closest('nav');
            const inHero = !!img.closest('.hero, .sub-hero');
            if (!insideNav && !inHero) {
                img.setAttribute('loading', 'lazy');
            } else {
                img.setAttribute('fetchpriority', 'high');
            }
            img.setAttribute('decoding', 'async');
        });
    }

    function setupBackToTopButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'to-top-btn';
        button.setAttribute('aria-label', 'Back to top');
        button.innerHTML = '&#8593;';
        body.appendChild(button);

        function updateVisibility() {
            button.classList.toggle('visible', window.scrollY > 420);
        }

        button.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', updateVisibility, { passive: true });
        updateVisibility();
    }

    function setupPageReadyState() {
        requestAnimationFrame(function () {
            body.classList.add('page-ready');
        });
    }

    setupActiveNavLink();
    setupMobileMenu();
    setupNavbarScrollState();
    setupRevealAnimations();
    optimizeImages();
    setupBackToTopButton();
    setupPageReadyState();
});

// Shopping cart functionality
const addToCartButton = document.getElementById('addToCartButton');

if (addToCartButton) {
    addToCartButton.addEventListener('click', function () {
        const productContainer = document.querySelector('.product-container');
        if (!productContainer) {
            return;
        }

        const productName = productContainer.querySelector('h1').textContent;
        const priceText = productContainer.querySelector('strong').textContent;
        const normalizedPrice = priceText.replace(/[^\d.]/g, '');

        const product = {
            name: productName,
            price: parseFloat(normalizedPrice),
            quantity: 1
        };

        const existing = localStorage.getItem('cartItems');
        const cartItems = existing ? JSON.parse(existing) : [];
        cartItems.push(product);

        localStorage.setItem('cartItems', JSON.stringify(cartItems));

        const totalPrice = cartItems.reduce(function (total, item) {
            return total + (item.price * item.quantity);
        }, 0);

        localStorage.setItem('totalPrice', totalPrice.toFixed(2));
        alert('Item added to cart! Total price: R' + totalPrice.toFixed(2));
    });
}
