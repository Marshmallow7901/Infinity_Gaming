function getCartItems() {
    var raw = localStorage.getItem('cartItems');
    if (!raw) {
        return [];
    }

    try {
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveCartItems(items) {
    localStorage.setItem('cartItems', JSON.stringify(items));
}

function getCartSummary(items) {
    var safeItems = Array.isArray(items) ? items : [];
    var quantity = 0;
    var subtotal = 0;

    safeItems.forEach(function (item) {
        var price = Number(item.price || 0);
        var qty = Number(item.quantity || 1);
        quantity += qty;
        subtotal += (price * qty);
    });

    return {
        quantity: quantity,
        subtotal: subtotal
    };
}

function normalizePath(pathValue) {
    var value = decodeURIComponent(pathValue || '').toLowerCase();
    return value.split('/').pop() || value;
}

document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    var nav = document.querySelector('nav');
    var mobileMenu = document.getElementById('mobile-menu');
    var navMenu = document.getElementById('nav-menu');
    var navLinks = navMenu ? Array.from(navMenu.querySelectorAll('a')) : [];
    var checkoutNavLink = navMenu ? navMenu.querySelector('a[href$="Checkout.html"]') : null;
    var toastRoot = null;

    function showToast(message, isError) {
        if (!toastRoot) {
            toastRoot = document.createElement('div');
            toastRoot.className = 'cart-toast-root';
            body.appendChild(toastRoot);
        }

        var toast = document.createElement('div');
        toast.className = 'cart-toast' + (isError ? ' cart-toast-error' : '');
        toast.textContent = message;
        toastRoot.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('show');
        });

        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 260);
        }, 2400);
    }

    function updateCheckoutNavBadge() {
        if (!checkoutNavLink) {
            return;
        }

        var summary = getCartSummary(getCartItems());
        if (summary.quantity > 0) {
            checkoutNavLink.textContent = 'Checkout (' + summary.quantity + ')';
            checkoutNavLink.title = 'Cart total: R' + summary.subtotal.toFixed(2);
        } else {
            checkoutNavLink.textContent = 'Checkout';
            checkoutNavLink.removeAttribute('title');
        }
    }

    function setupActiveNavLink() {
        if (!navLinks.length) {
            return;
        }

        var currentPath = normalizePath(window.location.pathname);
        navLinks.forEach(function (link) {
            var href = link.getAttribute('href') || '';
            var linkPath = normalizePath(href);
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
            var clickInsideMenu = navMenu.contains(event.target);
            var clickOnToggle = mobileMenu.contains(event.target);
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
        var revealTargets = Array.from(document.querySelectorAll(
            '.hero-content, .container, .left-column, .right-column, .slideshow-container, .shop .title, .product-box, .event, .sub-hero-inner, .plans-section, .championships-section, .form-section, .faq-section, .contact-wrapper form, .api-feed, .feed-card'
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

        var observer = new IntersectionObserver(function (entries, obs) {
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
        var images = Array.from(document.querySelectorAll('img'));
        images.forEach(function (img) {
            var insideNav = !!img.closest('nav');
            var inHero = !!img.closest('.hero, .sub-hero');
            if (!insideNav && !inHero) {
                img.setAttribute('loading', 'lazy');
            } else {
                img.setAttribute('fetchpriority', 'high');
            }
            img.setAttribute('decoding', 'async');
        });
    }

    function setupBackToTopButton() {
        var button = document.createElement('button');
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

    function setupProductAddToCart() {
        var addToCartButton = document.getElementById('addToCartButton');
        if (!addToCartButton) {
            return;
        }

        addToCartButton.addEventListener('click', function (event) {
            event.preventDefault();

            var productContainer = document.querySelector('.product-container');
            if (!productContainer) {
                return;
            }

            var nameElement = productContainer.querySelector(':scope > h1') || productContainer.querySelector('h1');
            var productName = nameElement ? nameElement.textContent.trim() : 'Gaming Item';

            var strongPrice = productContainer.querySelector('strong');
            var priceText = strongPrice ? strongPrice.textContent : '';
            if (!priceText) {
                var fallbackPriceText = productContainer.textContent.match(/R\s*[\d\s,.]+/i);
                priceText = fallbackPriceText ? fallbackPriceText[0] : '';
            }

            var normalizedPrice = priceText.replace(/[^\d.]/g, '');
            var parsedPrice = Number.parseFloat(normalizedPrice);
            var price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
            var pagePath = String(window.location.pathname || '').toLowerCase();
            var productType = pagePath.indexOf('/pcs/') !== -1 ? 'physical' : 'digital';

            if (price <= 0) {
                showToast('Could not detect product price. Please refresh and try again.', true);
                return;
            }

            var cartItems = getCartItems();
            var existingIndex = cartItems.findIndex(function (item) {
                return item.name === productName;
            });

            if (existingIndex >= 0) {
                cartItems[existingIndex].quantity = Number(cartItems[existingIndex].quantity || 1) + 1;
                cartItems[existingIndex].type = cartItems[existingIndex].type || productType;
            } else {
                cartItems.push({
                    name: productName,
                    price: price,
                    quantity: 1,
                    type: productType
                });
            }

            saveCartItems(cartItems);
            var summary = getCartSummary(cartItems);
            localStorage.setItem('totalPrice', summary.subtotal.toFixed(2));
            updateCheckoutNavBadge();

            addToCartButton.disabled = true;
            var previousText = addToCartButton.textContent;
            addToCartButton.textContent = 'Added';
            setTimeout(function () {
                addToCartButton.disabled = false;
                addToCartButton.textContent = previousText;
            }, 700);

            showToast(productName + ' added. Cart total: R' + summary.subtotal.toFixed(2));
        });
    }

    function renderFeedList(target, items, type) {
        target.innerHTML = '';

        if (!Array.isArray(items) || !items.length) {
            target.innerHTML = '<p class="feed-empty">No live items right now. Please check again soon.</p>';
            return;
        }

        items.forEach(function (item) {
            var card = document.createElement('article');
            card.className = 'feed-item';

            if (type === 'games') {
                card.innerHTML =
                    '<h3>' + item.title + '</h3>' +
                    '<p>' + item.subtitle + '</p>' +
                    '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer" class="feed-link">View Game</a>';
            } else {
                var thumbHtml = item.thumbnail ? '<img src="' + item.thumbnail + '" alt="" class="feed-thumb" loading="lazy" />' : '';
                card.innerHTML = thumbHtml + '<h3>' + item.title + '</h3><p>' + item.subtitle + '</p>';
                var readBtn = document.createElement('button');
                readBtn.className = 'feed-read-btn';
                readBtn.textContent = 'Read Story';
                (function (data) {
                    readBtn.addEventListener('click', function () {
                        try { sessionStorage.setItem('ig_news_article', JSON.stringify(data)); } catch (e) {}
                        window.location.href = getPageHref('News.html');
                    });
                })(item);
                card.appendChild(readBtn);
            }

            target.appendChild(card);
        });
    }

    function loadGamingFeeds() {
        var gamesTarget = document.getElementById('new-games-feed');
        var newsTarget = document.getElementById('gaming-news-feed');

        if (!gamesTarget && !newsTarget) {
            return;
        }

        if (gamesTarget) {
            gamesTarget.innerHTML = feedSkeleton();
        }
        if (newsTarget) {
            newsTarget.innerHTML = feedSkeleton();
        }

        var gamesRequest = fetch('https://www.freetogame.com/api/games?platform=pc')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Games API error');
                }
                return response.json();
            })
            .then(function (data) {
                return data.slice(0, 6).map(function (game) {
                    return {
                        title: game.title,
                        subtitle: (game.genre || 'Game') + ' · ' + (game.platform || 'PC'),
                        url: game.game_url || 'https://www.freetogame.com'
                    };
                });
            })
            .catch(function () {
                return [
                    { title: 'Seasonal Game Drop', subtitle: 'New curated picks this week', url: 'Games.html' },
                    { title: 'Indie Spotlight', subtitle: 'Fresh indie PC experiences', url: 'Games.html' },
                    { title: 'Top Multiplayer Picks', subtitle: 'Queue up with friends tonight', url: 'Games.html' }
                ];
            });

        var newsRequest = fetch('https://www.reddit.com/r/gaming/new.json?limit=6')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('News API error');
                }
                return response.json();
            })
            .then(function (data) {
                var posts = data && data.data && Array.isArray(data.data.children) ? data.data.children : [];
                return posts.slice(0, 6).map(function (entry) {
                    var post = entry.data || {};
                    var rawThumb = post.thumbnail || '';
                    var hasThumb = rawThumb.indexOf('http') === 0 && rawThumb !== 'self' && rawThumb !== 'nsfw' && rawThumb !== 'default';
                    return {
                        title: post.title || 'Gaming Update',
                        subtitle: 'r/gaming · by ' + (post.author || 'community'),
                        url: post.permalink ? ('https://www.reddit.com' + post.permalink) : 'https://www.reddit.com/r/gaming/',
                        articleUrl: post.url || '',
                        thumbnail: hasThumb ? rawThumb : '',
                        selftext: post.selftext || '',
                        score: post.score || 0,
                        numComments: post.num_comments || 0,
                        createdUtc: post.created_utc || 0
                    };
                });
            })
            .catch(function () {
                return [
                    { title: 'Infinity Tournament Prep', subtitle: 'r/gaming · by InfinityGaming', url: 'Upcoming Events.html', articleUrl: 'Upcoming Events.html', thumbnail: '', selftext: 'Championship qualifiers for the Infinity Gaming Tournament have been announced. Check the Events page for full details.', score: 0, numComments: 0, createdUtc: 0 },
                    { title: 'Hardware Watch: New GPU & CPU Launches', subtitle: 'r/gaming · by IG_Tech', url: 'Gaming pcs.html', articleUrl: 'Gaming pcs.html', thumbnail: '', selftext: 'The latest GPU and CPU hardware launches are incoming. Visit our Gaming PCs page to see top recommendations and current stock.', score: 0, numComments: 0, createdUtc: 0 },
                    { title: 'Esports Pulse: Major Matchups This Month', subtitle: 'r/gaming · by IG_Esports', url: 'Upcoming Events.html', articleUrl: 'Upcoming Events.html', thumbnail: '', selftext: 'Catch all the major esports matchups and tournaments happening this month. Head to the Upcoming Events page for the full schedule.', score: 0, numComments: 0, createdUtc: 0 }
                ];
            });

        Promise.all([gamesRequest, newsRequest]).then(function (results) {
            if (gamesTarget) {
                renderFeedList(gamesTarget, results[0], 'games');
            }
            if (newsTarget) {
                renderFeedList(newsTarget, results[1], 'news');
            }
        });
    }

    function setupPageReadyState() {
        requestAnimationFrame(function () {
            body.classList.add('page-ready');
        });
    }

    function safeParse(key, fallback) {
        try {
            var value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function normalizeGameKey(name) {
        return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function getPageHref(fileName) {
        var path = String(window.location.pathname || '').toLowerCase();
        if (path.indexOf('/pages/sub folder product official page/') !== -1) {
            return '../' + fileName;
        }
        if (path.indexOf('/pages/') !== -1) {
            return fileName;
        }
        return 'Pages/' + fileName;
    }

    // ─── Minimal JWT session (frontend demo) ───────────────────────
    var TOKEN_KEY = 'ig_auth_jwt';
    function getAssetBase() {
        var path = String(window.location.pathname || '').toLowerCase();
        return path.indexOf('sub folder product official page') !== -1 ? '../../' : '../';
    }


    function b64urlEncode(text) {
        return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function b64urlDecode(text) {
        var normalized = text.replace(/-/g, '+').replace(/_/g, '/');
        while (normalized.length % 4 !== 0) {
            normalized += '=';
        }
        return decodeURIComponent(escape(atob(normalized)));
    }

    function createFrontendJWT(payload) {
        var header = { alg: 'HS256', typ: 'JWT' };
        var h = b64urlEncode(JSON.stringify(header));
        var p = b64urlEncode(JSON.stringify(payload));
        var s = b64urlEncode(h + '.' + p + '.ig-demo-signature').slice(0, 24);
        return h + '.' + p + '.' + s;
    }

    function parseJWT(token) {
        var parts = String(token || '').split('.');
        if (parts.length !== 3) {
            return null;
        }
        try {
            return JSON.parse(b64urlDecode(parts[1]));
        } catch (error) {
            return null;
        }
    }

    function getSessionUser() {
        var token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            return null;
        }
        var payload = parseJWT(token);
        if (!payload) {
            return null;
        }
        var now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp <= now) {
            localStorage.removeItem(TOKEN_KEY);
            return null;
        }
        return payload;
    }

    function signInUser(profile) {
        var now = Math.floor(Date.now() / 1000);
        var payload = {
            sub: String(profile.email || 'guest@infinity.local').toLowerCase(),
            name: profile.name || 'Infinity Gamer',
            role: 'gamer',
            iat: now,
            exp: now + (60 * 60 * 24 * 7)
        };
        localStorage.setItem(TOKEN_KEY, createFrontendJWT(payload));
        localStorage.setItem('currentUserProfile', JSON.stringify(profile));
        return payload;
    }

    function signOutUser() {
        localStorage.removeItem(TOKEN_KEY);
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function ensureDashboardNavLink() {
        if (!navMenu) {
            return;
        }
        var exists = navMenu.querySelector('a[href$="Dashboard.html"]');
        if (exists) {
            return;
        }
        var li = document.createElement('li');
        li.innerHTML = '<a href="' + getPageHref('Dashboard.html') + '" id="dashboard-nav-link">Dashboard</a>';
        navMenu.appendChild(li);
    }

    function ensureAccountNavLink() {
        if (!navMenu) {
            return;
        }
        var exists = navMenu.querySelector('a[href$="Account.html"]');
        if (exists) {
            return;
        }
        var li = document.createElement('li');
        li.innerHTML = '<a href="' + getPageHref('Account.html') + '" id="account-nav-link">Account</a>';
        navMenu.appendChild(li);
    }

    function ensureAdminNavLink() {
        // Admin access is via the site-wide footer only — not injected in the nav.
    }

    function ensureMarketplaceNavLinks() {
        ensureDashboardNavLink();
        ensureAccountNavLink();
        ensureAdminNavLink();
    }

    function updateDashboardNavState() {
        var dashboardLink = document.getElementById('dashboard-nav-link');
        if (!dashboardLink) {
            return;
        }
        var user = getSessionUser();
        dashboardLink.textContent = user ? 'Dashboard' : 'Dashboard';
        dashboardLink.title = user ? ('Signed in as ' + (user.name || user.sub || 'gamer')) : 'Sign in to view dashboard';
    }

    function updateAccountNavState() {
        var accountLink = document.getElementById('account-nav-link');
        if (!accountLink) {
            return;
        }
        var user = getSessionUser();
        accountLink.title = user ? ('Manage profile for ' + (user.name || 'gamer')) : 'Create a profile and manage preferences';
    }

    function updateAdminNavState() {
        var adminLink = document.getElementById('admin-nav-link');
        if (!adminLink) {
            return;
        }
        var session = safeParse('ig_admin_session', null);
        adminLink.title = (session && session.active) ? 'Admin mode enabled' : 'Store admin controls';
    }

    // ─── Wishlist helpers ────────────────────────────────────────────
    function getWishlist() {
        return safeParse('wishlistItems', []);
    }

    function saveWishlist(items) {
        localStorage.setItem('wishlistItems', JSON.stringify(items));
    }

    function isWishlisted(name) {
        return getWishlist().some(function (i) { return i.name === name; });
    }

    function toggleWishlist(name, price) {
        var list = getWishlist();
        var idx = list.findIndex(function (i) { return i.name === name; });
        if (idx >= 0) {
            list.splice(idx, 1);
            saveWishlist(list);
            return false;
        }
        list.push({ name: name, price: price || 0 });
        saveWishlist(list);
        return true;
    }

    function updateWishlistNavBadge() {
        var wishlistLink = document.getElementById('wishlist-nav-link');
        if (!wishlistLink) { return; }
        var count = getWishlist().length;
        wishlistLink.textContent = count > 0 ? 'Wishlist (' + count + ')' : 'Wishlist';
    }

    function applyWishlistButtonState(btn) {
        var game = btn.getAttribute('data-game') || '';
        var active = isWishlisted(game);
        btn.innerHTML = active ? '&#9829;' : '&#9825;';
        btn.classList.toggle('wishlisted', active);
        btn.title = active ? 'Remove from wishlist' : 'Add to wishlist';
    }

    function setupWishlistButtons() {
        var buttons = Array.from(document.querySelectorAll('.wishlist-btn'));
        buttons.forEach(function (btn) {
            applyWishlistButtonState(btn);
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var game = btn.getAttribute('data-game') || '';
                var priceEl = btn.closest('.product-box') && btn.closest('.product-box').querySelector('.price');
                var priceText = priceEl ? priceEl.textContent.replace(/[^\d.]/g, '') : '0';
                var price = parseFloat(priceText) || 0;
                var added = toggleWishlist(game, price);
                applyWishlistButtonState(btn);
                updateWishlistNavBadge();
                showToast(added ? (game + ' added to wishlist.') : (game + ' removed from wishlist.'), false);
            });
        });
    }

    // ─── Wishlist page renderer ─────────────────────────────────────
    function setupWishlistPage() {
        var grid = document.getElementById('wishlist-grid');
        var emptyMsg = document.getElementById('wishlist-empty');
        if (!grid) { return; }

        function render() {
            var list = getWishlist();
            grid.innerHTML = '';
            if (!list.length) {
                if (emptyMsg) { emptyMsg.style.display = ''; }
                return;
            }
            if (emptyMsg) { emptyMsg.style.display = 'none'; }
            list.forEach(function (item) {
                var card = document.createElement('div');
                card.className = 'product-box';
                card.innerHTML =
                    '<button class="wishlist-btn wishlisted" data-game="' + item.name + '" aria-label="Remove from wishlist">&#9829;</button>' +
                    '<h2 class="product-title">' + item.name + '</h2>' +
                    '<span class="price">R' + Number(item.price || 0).toFixed(2) + '</span>' +
                    '<button class="btn-remove-wishlist" data-game="' + item.name + '">Remove</button>';
                grid.appendChild(card);
            });

            grid.querySelectorAll('.btn-remove-wishlist').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var name = btn.getAttribute('data-game');
                    toggleWishlist(name, 0);
                    updateWishlistNavBadge();
                    render();
                });
            });

            grid.querySelectorAll('.wishlist-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var name = btn.getAttribute('data-game');
                    toggleWishlist(name, 0);
                    updateWishlistNavBadge();
                    render();
                });
            });
        }

        render();
    }

    // ─── Game ratings ───────────────────────────────────────────────
    function getGameRatings() {
        return safeParse('gameRatings', {});
    }

    function saveRating(game, val) {
        var ratings = getGameRatings();
        ratings[game] = val;
        localStorage.setItem('gameRatings', JSON.stringify(ratings));
    }

    function getRating(game) {
        return getGameRatings()[game] || 0;
    }

    function refreshStarWidget(widget, val) {
        var stars = Array.from(widget.querySelectorAll('span[data-val]'));
        stars.forEach(function (s) {
            var sv = parseInt(s.getAttribute('data-val'), 10);
            s.classList.toggle('star-on', sv <= val);
        });
    }

    function setupStarRatings() {
        var widgets = Array.from(document.querySelectorAll('.star-rating'));
        widgets.forEach(function (widget) {
            var game = widget.getAttribute('data-game') || '';
            var current = getRating(game);
            refreshStarWidget(widget, current);

            var stars = Array.from(widget.querySelectorAll('span[data-val]'));
            stars.forEach(function (star) {
                star.addEventListener('mouseenter', function () {
                    var hv = parseInt(star.getAttribute('data-val'), 10);
                    refreshStarWidget(widget, hv);
                });
                star.addEventListener('mouseleave', function () {
                    refreshStarWidget(widget, getRating(game));
                });
                star.addEventListener('click', function () {
                    var clicked = parseInt(star.getAttribute('data-val'), 10);
                    var prev = getRating(game);
                    var next = clicked === prev ? 0 : clicked;
                    saveRating(game, next);
                    refreshStarWidget(widget, next);
                    if (next > 0) {
                        showToast('You rated ' + game + ' ' + next + ' star' + (next > 1 ? 's' : '') + '.');
                    }
                });
            });
        });
    }

    function getOwnedGames() {
        return safeParse('ownedGames', {});
    }

    function getOwnedLicense(productName) {
        var owned = getOwnedGames();
        return owned[normalizeGameKey(productName)] || null;
    }

    function getCurrentUserProfile() {
        var session = getSessionUser();
        var profile = safeParse('currentUserProfile', {}) || {};
        return {
            name: profile.name || (session && session.name) || 'Infinity Gamer',
            email: profile.email || (session && session.sub) || 'gamer@infinity.local',
            gamertag: profile.gamertag || ''
        };
    }

    function getGameReviews() {
        return safeParse('gameReviews', {});
    }

    function saveGameReviews(map) {
        localStorage.setItem('gameReviews', JSON.stringify(map || {}));
    }

    function getGameQuestions() {
        return safeParse('productQuestions', {});
    }

    function saveGameQuestions(map) {
        localStorage.setItem('productQuestions', JSON.stringify(map || {}));
    }

    function getNotifications() {
        return safeParse('crmNotifications', []);
    }

    function saveNotifications(items) {
        localStorage.setItem('crmNotifications', JSON.stringify(Array.isArray(items) ? items : []));
    }

    function addNotification(message, type) {
        var list = getNotifications();
        list.unshift({
            id: 'NTF-' + Date.now(),
            message: String(message || ''),
            type: type || 'info',
            createdAt: new Date().toISOString(),
            read: false
        });
        saveNotifications(list.slice(0, 80));
    }

    // ─── Promo / coupon codes ─────────────────────────────────────────
    function getPromoMap() {
        var builtIn = {
            'IGFIRST10': { discount: 10, type: 'percent', label: '10% off', active: true },
            'IGWELCOME': { discount: 50, type: 'fixed', label: 'R50 off', active: true },
            'IGGAMER20': { discount: 20, type: 'percent', label: '20% off', active: true },
            'IGSUMMER': { discount: 15, type: 'percent', label: '15% Summer Sale', active: true }
        };
        var custom = safeParse('igCoupons', {});
        return Object.assign({}, builtIn, custom);
    }

    function saveCoupons(map) {
        var builtInKeys = ['IGFIRST10', 'IGWELCOME', 'IGGAMER20', 'IGSUMMER'];
        var custom = {};
        Object.keys(map || {}).forEach(function (key) {
            if (builtInKeys.indexOf(key) === -1) {
                custom[key] = map[key];
            }
        });
        localStorage.setItem('igCoupons', JSON.stringify(custom));
    }

    // ─── Recently Viewed ──────────────────────────────────────────────
    function getRecentlyViewed() {
        return safeParse('recentlyViewed', []);
    }

    function trackRecentlyViewed(name, price) {
        if (!name) { return; }
        var list = getRecentlyViewed().filter(function (i) { return i.name !== name; });
        list.unshift({ name: name, price: price || 0, href: String(window.location.href), viewedAt: new Date().toISOString() });
        localStorage.setItem('recentlyViewed', JSON.stringify(list.slice(0, 12)));
    }

    function setupRecentlyViewed() {
        var list = getRecentlyViewed();
        if (!list.length) { return; }
        var shopContent = document.querySelector('.shop-content');
        if (!shopContent) { return; }
        var section = document.createElement('section');
        section.className = 'rv-section';
        var grid = document.createElement('div');
        grid.className = 'rv-grid';
        list.slice(0, 6).forEach(function (item) {
            var a = document.createElement('a');
            a.className = 'rv-card';
            a.href = item.href || '#';
            a.innerHTML = '<span class="rv-name">' + escapeHtml(item.name) + '</span><span class="rv-price">R' + Number(item.price || 0).toFixed(2) + '</span>';
            grid.appendChild(a);
        });
        var heading = document.createElement('h3');
        heading.className = 'rv-heading';
        heading.textContent = 'Recently Viewed';
        section.appendChild(heading);
        section.appendChild(grid);
        var parent = shopContent.parentNode;
        if (parent) { parent.insertAdjacentElement('beforeend', section); }
    }

    // ─── Stock badges ──────────────────────────────────────────────────
    function setupStockBadges() {
        var container = document.querySelector('.product-container');
        if (!container || document.getElementById('stock-badge')) { return; }
        var nameEl = container.querySelector('h1');
        var productName = nameEl ? nameEl.textContent.trim() : '';
        if (!productName) { return; }
        var stockMap = safeParse('productStock', {});
        var key = normalizeGameKey(productName);
        if (stockMap[key] === undefined) {
            stockMap[key] = Math.floor(Math.random() * 46) + 5;
            localStorage.setItem('productStock', JSON.stringify(stockMap));
        }
        var stock = stockMap[key];
        var badge = document.createElement('div');
        badge.id = 'stock-badge';
        if (stock <= 0) {
            badge.className = 'stock-badge stock-out';
            badge.textContent = 'Out of Stock';
        } else if (stock <= 5) {
            badge.className = 'stock-badge stock-low';
            badge.textContent = 'Low Stock: ' + stock + ' left';
        } else if (stock <= 15) {
            badge.className = 'stock-badge stock-medium';
            badge.textContent = 'Limited Stock: ' + stock + ' available';
        } else {
            badge.className = 'stock-badge stock-ok';
            badge.textContent = 'In Stock';
        }
        var addBtn = document.getElementById('addToCartButton');
        if (addBtn) { addBtn.insertAdjacentElement('beforebegin', badge); }
    }

    // ─── Site-wide Footer ─────────────────────────────────────────────
    function injectSiteFooter() {
        if (document.querySelector('.site-footer')) { return; }
        var ab = getAssetBase();
        var footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.innerHTML =
            '<div class="footer-inner">'
            // ── Col 1: Brand ──────────────────────────────────────────
            + '<div class="footer-col footer-col--brand">'
            + '<img src="' + ab + 'pics/Web Images/Pictures/Background and Logo Images/Logo with no background.png" alt="Infinity Gaming" class="footer-logo-img" />'
            + '<span class="footer-brand-name">Infinity Gaming</span>'
            + '<p class="footer-tagline">Your ultimate destination for top-tier gaming PCs, the latest titles, and epic events.</p>'
            + '<div class="footer-social">'
            + '<a href="#" class="footer-social-pill" rel="noopener" aria-label="Twitter / X">X</a>'
            + '<a href="#" class="footer-social-pill" rel="noopener" aria-label="Discord">Discord</a>'
            + '<a href="#" class="footer-social-pill" rel="noopener" aria-label="YouTube">YouTube</a>'
            + '<a href="#" class="footer-social-pill" rel="noopener" aria-label="Instagram">Instagram</a>'
            + '</div>'
            + '</div>'
            // ── Col 2: Explore ────────────────────────────────────────
            + '<div class="footer-col">'
            + '<h4>Explore</h4>'
            + '<ul>'
            + '<li><a href="' + getPageHref('Home Page.html') + '">Home</a></li>'
            + '<li><a href="' + getPageHref('Games.html') + '">Games</a></li>'
            + '<li><a href="' + getPageHref('Gaming pcs.html') + '">Gaming PCs</a></li>'
            + '<li><a href="' + getPageHref('Upcoming Events.html') + '">Upcoming Events</a></li>'
            + '<li><a href="' + getPageHref('News.html') + '">Gaming News</a></li>'
            + '<li><a href="' + getPageHref('Subscription.html') + '">Subscribe</a></li>'
            + '<li><a href="' + getPageHref('About us.html') + '">About Us</a></li>'
            + '</ul>'
            + '</div>'
            // ── Col 3: My Account ─────────────────────────────────────
            + '<div class="footer-col">'
            + '<h4>My Account</h4>'
            + '<ul>'
            + '<li><a href="' + getPageHref('Dashboard.html') + '">Dashboard</a></li>'
            + '<li><a href="' + getPageHref('Account.html') + '">Account Settings</a></li>'
            + '<li><a href="' + getPageHref('Wishlist.html') + '">My Wishlist</a></li>'
            + '<li><a href="' + getPageHref('Checkout.html') + '">Checkout</a></li>'
            + '<li><a href="' + getPageHref('Contact us.html') + '">Support</a></li>'
            + '</ul>'
            + '</div>'
            // ── Col 4: Get In Touch + Newsletter ──────────────────────
            + '<div class="footer-col">'
            + '<h4>Get In Touch</h4>'
            + '<address class="footer-address">'
            + '<span class="footer-contact-line"><span class="footer-contact-icon">&#x1F4CD;</span>Cape Town, South Africa</span>'
            + '<span class="footer-contact-line"><span class="footer-contact-icon">&#x1F4DE;</span>+27 21 000 0000</span>'
            + '<span class="footer-contact-line"><span class="footer-contact-icon">&#x2709;</span>hello@infinitygaming.co.za</span>'
            + '</address>'
            + '<h4 style="margin-top:1.25rem">Stay Updated</h4>'
            + '<p class="footer-nl-sub">Get the latest drops &amp; deals delivered.</p>'
            + '<form class="footer-newsletter" id="footer-newsletter" novalidate>'
            + '<input type="email" id="footer-nl-email" placeholder="your@email.com" autocomplete="email" />'
            + '<button type="submit">Subscribe</button>'
            + '</form>'
            + '<p class="footer-nl-msg" id="footer-nl-msg"></p>'
            + '</div>'
            + '</div>'
            + '<hr class="footer-divider" />'
            + '<div class="footer-bottom">'
            + '<p>&copy; 2026 Infinity Gaming &mdash; All rights reserved.</p>'
            + '<nav class="footer-policy-nav" aria-label="Legal links">'
            + '<a href="' + getPageHref('Privacy Policy.html') + '">Privacy Policy</a>'
            + '<span class="footer-dot" aria-hidden="true">&middot;</span>'
            + '<a href="' + getPageHref('Terms of Use.html') + '">Terms of Use</a>'
            + '</nav>'
            + '<a href="' + getPageHref('Admin.html') + '" class="footer-admin-toggle" id="footer-admin-toggle" title="Admin access">Admin</a>'
            + '</div>'
            + '<div id="footer-admin-panel" class="footer-admin-panel" style="display:none;">'
            + '<form class="footer-admin-form" id="footer-admin-form" novalidate>'
            + '<input type="password" id="footer-admin-pass" placeholder="Admin passcode" autocomplete="current-password" />'
            + '<button type="submit" id="footer-admin-submit">Unlock Admin</button>'
            + '<a href="' + getPageHref('Admin.html') + '" id="footer-admin-link" class="footer-admin-link" style="display:none;">Open Admin Panel</a>'
            + '<button type="button" id="footer-admin-signout" class="btn-outline" style="display:none;">Sign Out</button>'
            + '</form>'
            + '<p class="footer-admin-state" id="footer-admin-state"></p>'
            + '</div>';
        body.appendChild(footer);
        setupFooterAdmin();
        setupFooterNewsletter();
    }

    function setupFooterAdmin() {
        var toggle = document.getElementById('footer-admin-toggle');
        var panel = document.getElementById('footer-admin-panel');
        var form = document.getElementById('footer-admin-form');
        var passInput = document.getElementById('footer-admin-pass');
        var submitBtn = document.getElementById('footer-admin-submit');
        var gotoLink = document.getElementById('footer-admin-link');
        var signoutBtn = document.getElementById('footer-admin-signout');
        var stateEl = document.getElementById('footer-admin-state');

        function refreshFooterAdmin() {
            var session = safeParse('ig_admin_session', null);
            var authed = !!(session && session.active);
            if (submitBtn) { submitBtn.textContent = authed ? 'Re-Authenticate' : 'Unlock Admin'; }
            if (gotoLink) {
                gotoLink.href = getPageHref('Admin.html');
                gotoLink.style.display = authed ? '' : 'none';
            }
            if (signoutBtn) { signoutBtn.style.display = authed ? '' : 'none'; }
            if (passInput && !authed) { passInput.value = ''; }
            if (stateEl) {
                stateEl.textContent = authed ? 'Admin session is active.' : '';
                stateEl.className = 'footer-admin-state' + (authed ? ' active' : '');
            }
            if (toggle) {
                toggle.classList.toggle('active', authed);
                toggle.href = getPageHref('Admin.html');
                toggle.textContent = authed ? 'Admin Panel' : 'Admin';
            }
        }

        if (toggle && panel) {
            toggle.addEventListener('click', function (event) {
                var session = safeParse('ig_admin_session', null);
                var authed = !!(session && session.active);
                if (authed) {
                    window.location.href = getPageHref('Admin.html');
                    return;
                }
                event.preventDefault();
                var open = panel.style.display !== 'none';
                panel.style.display = open ? 'none' : '';
                if (!open) { refreshFooterAdmin(); }
            });
        }

        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var pass = passInput ? passInput.value.trim() : '';
                if (pass !== 'IG-ADMIN-2026') {
                    showToast('Invalid admin passcode.', true);
                    return;
                }
                localStorage.setItem('ig_admin_session', JSON.stringify({ active: true, at: new Date().toISOString() }));
                showToast('Admin mode enabled. Use the link below to open the Admin Panel.');
                refreshFooterAdmin();
                updateAdminNavState();
            });
        }

        if (signoutBtn) {
            signoutBtn.addEventListener('click', function () {
                localStorage.setItem('ig_admin_session', JSON.stringify({ active: false }));
                showToast('Admin session ended.');
                refreshFooterAdmin();
                updateAdminNavState();
            });
        }

        refreshFooterAdmin();
    }

    function setupFooterNewsletter() {
        var nlForm = document.getElementById('footer-newsletter');
        var nlMsg = document.getElementById('footer-nl-msg');
        var nlEmail = document.getElementById('footer-nl-email');
        if (!nlForm) { return; }
        nlForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var email = nlEmail ? nlEmail.value.trim() : '';
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (nlMsg) { nlMsg.textContent = 'Please enter a valid email address.'; nlMsg.className = 'footer-nl-msg error'; }
                return;
            }
            var subs = safeParse('ig_newsletter_subs', []);
            if (subs.indexOf(email) === -1) { subs.push(email); }
            localStorage.setItem('ig_newsletter_subs', JSON.stringify(subs));
            if (nlEmail) { nlEmail.value = ''; }
            if (nlMsg) { nlMsg.textContent = 'You\'re subscribed! Welcome to the Infinity Gaming community.'; nlMsg.className = 'footer-nl-msg success'; }
            setTimeout(function () { if (nlMsg) { nlMsg.textContent = ''; nlMsg.className = 'footer-nl-msg'; } }, 5000);
        });
    }

    function getOrderStatusMeta(order) {
        var state = String((order && order.status) || 'processing').toLowerCase();
        var labels = {
            processing: 'Processing',
            packed: 'Packed',
            shipped: 'Shipped',
            intransit: 'In Transit',
            delivered: 'Delivered',
            licenseready: 'License Ready',
            completed: 'Completed'
        };
        return {
            key: state,
            label: labels[state] || 'Processing'
        };
    }

    function setupProductSocialProof(productName) {
        var container = document.querySelector('.product-container');
        if (!container || !productName || document.getElementById('product-social-proof')) {
            return;
        }

        var gameKey = normalizeGameKey(productName);
        var panel = document.createElement('section');
        panel.id = 'product-social-proof';
        panel.className = 'social-proof-wrap';
        panel.innerHTML =
            '<div class="social-columns">'
            + '<article class="social-card">'
            + '<h3>Player Reviews</h3>'
            + '<p class="social-sub">Share your experience to help other gamers decide.</p>'
            + '<form id="review-form" class="review-form" novalidate>'
            + '<label for="review-text">Write a review</label>'
            + '<textarea id="review-text" maxlength="300" placeholder="How was performance, gameplay, and value?"></textarea>'
            + '<button type="submit">Post Review</button>'
            + '</form>'
            + '<div id="review-list" class="social-list"></div>'
            + '</article>'
            + '<article class="social-card">'
            + '<h3>Product Q&A</h3>'
            + '<p class="social-sub">Ask questions and get answers from support and the community.</p>'
            + '<form id="qa-form" class="review-form" novalidate>'
            + '<label for="qa-question">Ask a question</label>'
            + '<textarea id="qa-question" maxlength="220" placeholder="Will this run at 144fps on high settings?"></textarea>'
            + '<button type="submit">Submit Question</button>'
            + '</form>'
            + '<div id="qa-list" class="social-list"></div>'
            + '</article>'
            + '</div>';

        container.appendChild(panel);

        var reviewList = panel.querySelector('#review-list');
        var qaList = panel.querySelector('#qa-list');
        var reviewForm = panel.querySelector('#review-form');
        var qaForm = panel.querySelector('#qa-form');
        var reviewInput = panel.querySelector('#review-text');
        var questionInput = panel.querySelector('#qa-question');

        function renderReviews() {
            var map = getGameReviews();
            var items = Array.isArray(map[gameKey]) ? map[gameKey] : [];
            if (!items.length) {
                reviewList.innerHTML = '<p class="social-empty">No reviews yet. Be the first to review.</p>';
                return;
            }

            reviewList.innerHTML = items.slice().reverse().map(function (entry) {
                var stars = Number(entry.rating || 0);
                var starsOut = '';
                for (var i = 1; i <= 5; i++) {
                    starsOut += '<span class="mini-star' + (i <= stars ? ' on' : '') + '">&#9733;</span>';
                }
                return '<article class="social-item">'
                    + '<header><strong>' + escapeHtml(entry.author || 'Gamer') + '</strong>'
                    + '<span>' + new Date(entry.createdAt).toLocaleDateString() + '</span></header>'
                    + '<div class="mini-stars">' + starsOut + (entry.verified ? '<em>Verified Purchase</em>' : '') + '</div>'
                    + '<p>' + escapeHtml(entry.text || '') + '</p>'
                    + '</article>';
            }).join('');
        }

        function renderQuestions() {
            var map = getGameQuestions();
            var items = Array.isArray(map[gameKey]) ? map[gameKey] : [];
            if (!items.length) {
                qaList.innerHTML = '<p class="social-empty">No questions yet.</p>';
                return;
            }
            qaList.innerHTML = items.slice().reverse().map(function (entry) {
                return '<article class="social-item">'
                    + '<header><strong>' + escapeHtml(entry.author || 'Gamer') + '</strong>'
                    + '<span>' + new Date(entry.createdAt).toLocaleDateString() + '</span></header>'
                    + '<p><b>Q:</b> ' + escapeHtml(entry.question || '') + '</p>'
                    + '<p class="answer"><b>A:</b> ' + escapeHtml(entry.answer || 'Pending response from support.') + '</p>'
                    + '</article>';
            }).join('');
        }

        if (reviewForm) {
            reviewForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var text = (reviewInput ? reviewInput.value.trim() : '');
                if (!text) {
                    showToast('Write a review message first.', true);
                    return;
                }
                var map = getGameReviews();
                var items = Array.isArray(map[gameKey]) ? map[gameKey] : [];
                var rating = getRating(productName) || 5;
                var owned = !!getOwnedLicense(productName);
                var profile = getCurrentUserProfile();
                items.push({
                    id: 'RVW-' + Date.now(),
                    author: profile.name,
                    text: text,
                    rating: rating,
                    verified: owned,
                    createdAt: new Date().toISOString()
                });
                map[gameKey] = items;
                saveGameReviews(map);
                addNotification('New review posted for ' + productName + '.', 'social');
                reviewInput.value = '';
                renderReviews();
                showToast('Review posted. Thanks for the feedback.');
            });
        }

        if (qaForm) {
            qaForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var text = (questionInput ? questionInput.value.trim() : '');
                if (!text) {
                    showToast('Type a question first.', true);
                    return;
                }
                var map = getGameQuestions();
                var items = Array.isArray(map[gameKey]) ? map[gameKey] : [];
                var profile = getCurrentUserProfile();
                items.push({
                    id: 'QST-' + Date.now(),
                    author: profile.name,
                    question: text,
                    answer: '',
                    createdAt: new Date().toISOString()
                });
                map[gameKey] = items;
                saveGameQuestions(map);
                addNotification('New Q&A question submitted for ' + productName + '.', 'social');
                questionInput.value = '';
                renderQuestions();
                showToast('Question submitted. Support will respond soon.');
            });
        }

        renderReviews();
        renderQuestions();
    }

    // ─── Product detail page: inject wishlist/rating/license controls ──
    function setupProductPageExtras() {
        var addBtn = document.getElementById('addToCartButton');
        if (!addBtn) { return; }

        var container = document.querySelector('.product-container');
        var nameEl = container && (container.querySelector(':scope > h1') || container.querySelector('h1'));
        var productName = nameEl ? nameEl.textContent.trim() : '';
        if (!productName) { return; }

        var strongPrice = container && container.querySelector('strong');
        var priceText = strongPrice ? strongPrice.textContent.replace(/[^\d.]/g, '') : '0';
        var price = parseFloat(priceText) || 0;
        var isPhysicalPage = String(window.location.pathname || '').toLowerCase().indexOf('/pcs/') !== -1;

    trackRecentlyViewed(productName, price);

        if (!document.querySelector('.wishlist-btn')) {
            var wBtn = document.createElement('button');
            wBtn.type = 'button';
            wBtn.className = 'wishlist-btn wishlist-btn-detail';
            wBtn.setAttribute('data-game', productName);
            wBtn.setAttribute('aria-label', 'Add to wishlist');
            addBtn.insertAdjacentElement('afterend', wBtn);
            applyWishlistButtonState(wBtn);
            wBtn.addEventListener('click', function () {
                var added = toggleWishlist(productName, price);
                applyWishlistButtonState(wBtn);
                updateWishlistNavBadge();
                showToast(added ? (productName + ' added to wishlist.') : (productName + ' removed from wishlist.'), false);
            });
        }

        if (!document.querySelector('.star-rating')) {
            var ratingWrap = document.createElement('div');
            ratingWrap.className = 'star-rating star-rating-detail';
            ratingWrap.setAttribute('data-game', productName);
            ratingWrap.innerHTML = '<span data-val="1">&#9733;</span><span data-val="2">&#9733;</span><span data-val="3">&#9733;</span><span data-val="4">&#9733;</span><span data-val="5">&#9733;</span><span class="star-label"></span>';
            addBtn.closest('.product-description') ? addBtn.closest('.product-description').insertBefore(ratingWrap, addBtn) : addBtn.insertAdjacentElement('beforebegin', ratingWrap);
            var current = getRating(productName);
            refreshStarWidget(ratingWrap, current);
            var label = ratingWrap.querySelector('.star-label');
            if (label && current > 0) { label.textContent = ' Your rating: ' + current + '/5'; }

            Array.from(ratingWrap.querySelectorAll('span[data-val]')).forEach(function (star) {
                star.addEventListener('mouseenter', function () { refreshStarWidget(ratingWrap, parseInt(star.getAttribute('data-val'), 10)); });
                star.addEventListener('mouseleave', function () { refreshStarWidget(ratingWrap, getRating(productName)); });
                star.addEventListener('click', function () {
                    var clicked = parseInt(star.getAttribute('data-val'), 10);
                    var prev = getRating(productName);
                    var next = clicked === prev ? 0 : clicked;
                    saveRating(productName, next);
                    refreshStarWidget(ratingWrap, next);
                    if (label) { label.textContent = next > 0 ? (' Your rating: ' + next + '/5') : ''; }
                    if (next > 0) { showToast('You rated ' + productName + ' ' + next + ' star' + (next > 1 ? 's' : '') + '.'); }
                });
            });
        }

        if (!isPhysicalPage) {
            var license = getOwnedLicense(productName);
            if (license && !document.getElementById('get-license-btn')) {
                var licenseBtn = document.createElement('button');
                licenseBtn.type = 'button';
                licenseBtn.id = 'get-license-btn';
                licenseBtn.className = 'wishlist-btn-detail license-btn';
                licenseBtn.textContent = 'Get License Key';
                addBtn.insertAdjacentElement('afterend', licenseBtn);

                var panel = document.createElement('div');
                panel.className = 'license-panel';
                panel.style.display = 'none';
                panel.innerHTML =
                    '<p><strong>License Key:</strong> <span class="license-key"></span></p>' +
                    '<p class="license-meta">Order: ' + license.orderId + '</p>';
                licenseBtn.insertAdjacentElement('afterend', panel);

                licenseBtn.addEventListener('click', function () {
                    var keyEl = panel.querySelector('.license-key');
                    keyEl.textContent = license.licenseKey;
                    panel.style.display = panel.style.display === 'none' ? '' : 'none';
                });
            }
        }

        setupProductSocialProof(productName);
    }

    // ─── Game search (Games page) ───────────────────────────────────
    function setupGameSearch() {
        var searchInput = document.getElementById('game-search');
        var searchCount = document.getElementById('search-count');
        var cards = Array.from(document.querySelectorAll('.shop-content .product-box'));
        if (!searchInput || !cards.length) { return; }

        var noResultsEl = document.createElement('p');
        noResultsEl.className = 'search-no-results';
        noResultsEl.textContent = 'No games match your search.';
        noResultsEl.style.display = 'none';
        var shopContent = document.querySelector('.shop-content');
        if (shopContent) { shopContent.insertAdjacentElement('afterend', noResultsEl); }

        function filter() {
            var q = searchInput.value.trim().toLowerCase();
            var visible = 0;
            cards.forEach(function (card) {
                var titleEl = card.querySelector('.product-title');
                var title = titleEl ? titleEl.textContent.toLowerCase() : '';
                var match = !q || title.indexOf(q) >= 0;
                card.style.display = match ? '' : 'none';
                if (match) { visible++; }
            });
            noResultsEl.style.display = (q && visible === 0) ? '' : 'none';
            if (searchCount) {
                searchCount.textContent = q ? (visible + ' result' + (visible !== 1 ? 's' : '')) : '';
            }
        }

        searchInput.addEventListener('input', filter);
        searchInput.addEventListener('search', filter);
    }

    function setupSubscriptionForm() {
        var form = document.querySelector('.sub-form');
        if (!form) {
            return;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            var firstName = (document.getElementById('sub-firstname') || {}).value || '';
            var lastName = (document.getElementById('sub-lastname') || {}).value || '';
            var email = (document.getElementById('sub-email') || {}).value || '';
            var gamertag = (document.getElementById('sub-gamertag') || {}).value || '';
            var favouriteGame = (document.getElementById('sub-game') || {}).value || '';
            var planInput = form.querySelector('input[name="plan"]:checked');
            var plan = planInput ? planInput.value : 'pro';

            var prices = { starter: 79, pro: 199, elite: 399 };
            var now = new Date();
            var next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

            var profile = {
                name: (firstName + ' ' + lastName).trim() || 'Infinity Gamer',
                email: email,
                gamertag: gamertag,
                favouriteGame: favouriteGame,
                plan: plan,
                price: prices[plan] || prices.pro,
                status: 'active',
                startDate: now.toISOString(),
                nextBillingDate: next.toISOString()
            };

            localStorage.setItem('subscriptionProfile', JSON.stringify(profile));
            signInUser({ name: profile.name, email: profile.email, gamertag: gamertag });
            updateDashboardNavState();
            showToast('Subscription activated. View it in your dashboard.');
            window.location.href = getPageHref('Dashboard.html');
        });
    }

    function getOrders() {
        return safeParse('ordersHistory', []);
    }

    function setupDashboardPage() {
        var dashboardRoot = document.getElementById('dashboard-root');
        if (!dashboardRoot) {
            return;
        }

        var authGate = document.getElementById('dashboard-auth-gate');
        var appView = document.getElementById('dashboard-app');
        var authForm = document.getElementById('dashboard-auth-form');
        var logoutBtn = document.getElementById('dashboard-logout');

        function renderCards() {
            var user = getSessionUser();
            var orders = getOrders();
            var ownedMap = getOwnedGames();
            var ownedKeys = Object.keys(ownedMap);
            var subscription = safeParse('subscriptionProfile', null);

            var welcomeEl = document.getElementById('dash-welcome');
            var jwtMetaEl = document.getElementById('dash-jwt-meta');
            var ordersEl = document.getElementById('dash-orders');
            var gamesEl = document.getElementById('dash-owned-games');
            var subEl = document.getElementById('dash-subscription');

            if (welcomeEl) {
                welcomeEl.textContent = 'Welcome, ' + ((user && user.name) || 'Gamer');
            }

            if (jwtMetaEl && user) {
                var expiry = user.exp ? new Date(user.exp * 1000).toLocaleString() : 'N/A';
                jwtMetaEl.textContent = 'JWT active for ' + (user.sub || 'user') + ' (expires: ' + expiry + ')';
            }

            if (ordersEl) {
                if (!orders.length) {
                    ordersEl.innerHTML = '<p class="dash-empty">No orders yet.</p>';
                } else {
                    ordersEl.innerHTML = orders.map(function (order) {
                        var statusMeta = getOrderStatusMeta(order);
                        var updatedAt = order.statusUpdatedAt ? new Date(order.statusUpdatedAt).toLocaleString() : new Date(order.createdAt).toLocaleString();
                        var trackingText = order.trackingNumber ? ('Tracking: ' + order.trackingNumber) : 'Tracking: Not assigned';
                        return '<article class="dash-item">'
                            + '<h4>' + order.id + '</h4>'
                            + '<p>Date: ' + new Date(order.createdAt).toLocaleString() + '</p>'
                            + '<p>Total: R' + Number(order.total || 0).toFixed(2) + '</p>'
                            + '<p>Items: ' + Number(order.itemsCount || 0) + '</p>'
                            + '<p>Status: <span class="dash-status dash-status-' + statusMeta.key + '">' + statusMeta.label + '</span></p>'
                            + '<p>' + trackingText + '</p>'
                            + '<p>Last update: ' + updatedAt + '</p>'
                            + '</article>';
                    }).join('');
                }
            }

            if (gamesEl) {
                if (!ownedKeys.length) {
                    gamesEl.innerHTML = '<p class="dash-empty">No owned digital games yet.</p>';
                } else {
                    gamesEl.innerHTML = ownedKeys.map(function (key) {
                        var game = ownedMap[key];
                        return '<article class="dash-item">'
                            + '<h4>' + game.name + '</h4>'
                            + '<p>Order: ' + game.orderId + '</p>'
                            + '<p>Purchased: ' + new Date(game.purchasedAt).toLocaleDateString() + '</p>'
                            + '<p class="dash-license">License: <span>' + game.licenseKey + '</span></p>'
                            + '<button type="button" class="dash-copy" data-key="' + game.licenseKey + '">Copy Key</button>'
                            + '</article>';
                    }).join('');
                }
            }

            if (subEl) {
                if (!subscription) {
                    subEl.innerHTML = '<p class="dash-empty">No active subscription. <a href="' + getPageHref('Subscription.html') + '">Start one now</a>.</p>';
                } else {
                    subEl.innerHTML =
                        '<article class="dash-item">'
                        + '<h4>Plan: ' + String(subscription.plan || 'pro').toUpperCase() + '</h4>'
                        + '<p>Status: <strong>' + (subscription.status || 'active') + '</strong></p>'
                        + '<p>Price: R' + Number(subscription.price || 0).toFixed(2) + '/month</p>'
                        + '<p>Next Billing: ' + (subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A') + '</p>'
                        + '<div class="dash-actions">'
                        + '<button type="button" id="dash-upgrade-plan">Upgrade Plan</button>'
                        + '<button type="button" id="dash-toggle-sub">' + ((subscription.status || 'active') === 'active' ? 'Cancel Subscription' : 'Reactivate Subscription') + '</button>'
                        + '</div>'
                        + '</article>';
                }
            }
        }

        function refreshAuthUI() {
            var user = getSessionUser();
            if (user) {
                authGate.style.display = 'none';
                appView.style.display = '';
                renderCards();
            } else {
                authGate.style.display = '';
                appView.style.display = 'none';
            }
            updateDashboardNavState();
        }

        if (authForm) {
            authForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var nameInput = document.getElementById('dash-name');
                var emailInput = document.getElementById('dash-email');
                var name = (nameInput ? nameInput.value.trim() : '') || 'Infinity Gamer';
                var email = (emailInput ? emailInput.value.trim() : '') || 'gamer@infinity.local';
                signInUser({ name: name, email: email });
                showToast('Signed in. JWT session created.');
                refreshAuthUI();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                signOutUser();
                showToast('Signed out of dashboard session.');
                refreshAuthUI();
            });
        }

        dashboardRoot.addEventListener('click', function (event) {
            var copyBtn = event.target.closest('.dash-copy');
            if (copyBtn) {
                var key = copyBtn.getAttribute('data-key') || '';
                navigator.clipboard.writeText(key).then(function () {
                    showToast('License key copied.');
                }).catch(function () {
                    showToast('Could not copy key. Select and copy manually.', true);
                });
                return;
            }

            if (event.target && event.target.id === 'dash-toggle-sub') {
                var subscription = safeParse('subscriptionProfile', null);
                if (!subscription) {
                    return;
                }
                subscription.status = (subscription.status || 'active') === 'active' ? 'cancelled' : 'active';
                localStorage.setItem('subscriptionProfile', JSON.stringify(subscription));
                showToast('Subscription status updated to ' + subscription.status + '.');
                renderCards();
                return;
            }

            if (event.target && event.target.id === 'dash-upgrade-plan') {
                var sub = safeParse('subscriptionProfile', null);
                if (!sub) {
                    return;
                }
                var order = ['starter', 'pro', 'elite'];
                var prices = { starter: 79, pro: 199, elite: 399 };
                var currentIdx = Math.max(0, order.indexOf(String(sub.plan || 'pro').toLowerCase()));
                var nextPlan = order[(currentIdx + 1) % order.length];
                sub.plan = nextPlan;
                sub.price = prices[nextPlan];
                localStorage.setItem('subscriptionProfile', JSON.stringify(sub));
                showToast('Plan changed to ' + nextPlan.toUpperCase() + '.');
                renderCards();
            }
        });

        refreshAuthUI();
    }

    function setupAccountPage() {
        var root = document.getElementById('account-root');
        if (!root) {
            return;
        }

        var form = document.getElementById('account-form');
        var notifyWrap = document.getElementById('account-notifications');
        var ticketForm = document.getElementById('ticket-form');
        var ticketList = document.getElementById('ticket-list');
        var pointsEl = document.getElementById('loyalty-points');

        function getTickets() {
            return safeParse('crmTickets', []);
        }

        function saveTickets(items) {
            localStorage.setItem('crmTickets', JSON.stringify(Array.isArray(items) ? items : []));
        }

        function calculatePoints() {
            var orders = getOrders();
            return orders.reduce(function (sum, order) {
                return sum + Math.floor(Number(order.total || 0) / 10);
            }, 0);
        }

        function renderNotifications() {
            if (!notifyWrap) {
                return;
            }
            var list = getNotifications();
            if (!list.length) {
                notifyWrap.innerHTML = '<p class="acc-empty">No notifications yet.</p>';
                return;
            }
            notifyWrap.innerHTML = list.slice(0, 8).map(function (item) {
                return '<article class="acc-item">'
                    + '<p>' + escapeHtml(item.message) + '</p>'
                    + '<span>' + new Date(item.createdAt).toLocaleString() + '</span>'
                    + '</article>';
            }).join('');
        }

        function renderTickets() {
            if (!ticketList) {
                return;
            }
            var list = getTickets();
            if (!list.length) {
                ticketList.innerHTML = '<p class="acc-empty">No support tickets yet.</p>';
                return;
            }
            ticketList.innerHTML = list.slice().reverse().map(function (ticket) {
                return '<article class="acc-item">'
                    + '<h4>' + escapeHtml(ticket.subject) + '</h4>'
                    + '<p>' + escapeHtml(ticket.message) + '</p>'
                    + '<span>Status: ' + escapeHtml(ticket.status || 'Open') + ' · ' + new Date(ticket.createdAt).toLocaleDateString() + '</span>'
                    + '</article>';
            }).join('');
        }

        if (pointsEl) {
            pointsEl.textContent = String(calculatePoints());
        }

        var profile = getCurrentUserProfile();
        var nameEl = document.getElementById('acc-name');
        var emailEl = document.getElementById('acc-email');
        var gamertagEl = document.getElementById('acc-gamertag');
        if (nameEl) { nameEl.value = profile.name || ''; }
        if (emailEl) { emailEl.value = profile.email || ''; }
        if (gamertagEl) { gamertagEl.value = profile.gamertag || ''; }

        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                var nextProfile = {
                    name: (nameEl ? nameEl.value.trim() : '') || 'Infinity Gamer',
                    email: (emailEl ? emailEl.value.trim() : '') || 'gamer@infinity.local',
                    gamertag: (gamertagEl ? gamertagEl.value.trim() : '') || ''
                };
                localStorage.setItem('currentUserProfile', JSON.stringify(nextProfile));
                signInUser(nextProfile);
                addNotification('Account profile updated successfully.', 'account');
                showToast('Account saved. CRM profile refreshed.');
                renderNotifications();
                updateAccountNavState();
            });
        }

        if (ticketForm) {
            ticketForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var subjectEl = document.getElementById('ticket-subject');
                var messageEl = document.getElementById('ticket-message');
                var subject = subjectEl ? subjectEl.value.trim() : '';
                var message = messageEl ? messageEl.value.trim() : '';
                if (!subject || !message) {
                    showToast('Add a ticket subject and message.', true);
                    return;
                }

                var tickets = getTickets();
                tickets.push({
                    id: 'TCK-' + Date.now(),
                    subject: subject,
                    message: message,
                    status: 'Open',
                    createdAt: new Date().toISOString()
                });
                saveTickets(tickets);
                addNotification('Support ticket submitted: ' + subject + '.', 'crm');
                ticketForm.reset();
                renderTickets();
                renderNotifications();
                showToast('Support ticket submitted.');
            });
        }

        renderNotifications();
        renderTickets();
    }

    function setupAdminPage() {
        var root = document.getElementById('admin-root');
        if (!root) {
            return;
        }

        var panel = document.getElementById('admin-panel');
        var adminGate = document.getElementById('admin-gate');
        var ordersWrap = document.getElementById('admin-orders');
        var reviewsWrap = document.getElementById('admin-reviews');
        var qaWrap = document.getElementById('admin-qa');
        var analyticsWrap = document.getElementById('admin-analytics');
        var couponsList = document.getElementById('admin-coupons-list');
        var couponForm = document.getElementById('admin-coupon-form');
        var signOutBtn = document.getElementById('admin-signout');

        function isAdminAuthed() {
            var session = safeParse('ig_admin_session', null);
            return !!(session && session.active);
        }

        function setAdminAuthed(active) {
            localStorage.setItem('ig_admin_session', JSON.stringify({ active: !!active, at: new Date().toISOString() }));
            updateAdminNavState();
        }

        function saveOrders(orders) {
            localStorage.setItem('ordersHistory', JSON.stringify(Array.isArray(orders) ? orders : []));
        }

        function renderOrders() {
            if (!ordersWrap) {
                return;
            }
            var orders = getOrders();
            if (!orders.length) {
                ordersWrap.innerHTML = '<p class="admin-empty">No orders to manage yet.</p>';
                return;
            }
            ordersWrap.innerHTML = orders.map(function (order) {
                var meta = getOrderStatusMeta(order);
                return '<article class="admin-item">'
                    + '<h4>' + order.id + '</h4>'
                    + '<p>' + escapeHtml(order.customerName || 'Customer') + ' · R' + Number(order.total || 0).toFixed(2) + '</p>'
                    + '<label>Status</label>'
                    + '<select data-admin-status="' + order.id + '">'
                    + '<option value="processing"' + (meta.key === 'processing' ? ' selected' : '') + '>Processing</option>'
                    + '<option value="packed"' + (meta.key === 'packed' ? ' selected' : '') + '>Packed</option>'
                    + '<option value="shipped"' + (meta.key === 'shipped' ? ' selected' : '') + '>Shipped</option>'
                    + '<option value="intransit"' + (meta.key === 'intransit' ? ' selected' : '') + '>In Transit</option>'
                    + '<option value="delivered"' + (meta.key === 'delivered' ? ' selected' : '') + '>Delivered</option>'
                    + '<option value="licenseready"' + (meta.key === 'licenseready' ? ' selected' : '') + '>License Ready</option>'
                    + '<option value="completed"' + (meta.key === 'completed' ? ' selected' : '') + '>Completed</option>'
                    + '</select>'
                    + '</article>';
            }).join('');
        }

        function renderReviews() {
            if (!reviewsWrap) {
                return;
            }
            var reviews = getGameReviews();
            var keys = Object.keys(reviews);
            if (!keys.length) {
                reviewsWrap.innerHTML = '<p class="admin-empty">No reviews yet.</p>';
                return;
            }
            var blocks = [];
            keys.forEach(function (key) {
                (reviews[key] || []).forEach(function (entry) {
                    blocks.push('<article class="admin-item">'
                        + '<h4>' + escapeHtml(entry.author || 'Gamer') + ' · ' + key + '</h4>'
                        + '<p>' + escapeHtml(entry.text || '') + '</p>'
                        + '<button type="button" data-del-review="' + entry.id + '" data-game="' + key + '">Remove</button>'
                        + '</article>');
                });
            });
            reviewsWrap.innerHTML = blocks.join('');
        }

        function renderQa() {
            if (!qaWrap) {
                return;
            }
            var map = getGameQuestions();
            var keys = Object.keys(map);
            if (!keys.length) {
                qaWrap.innerHTML = '<p class="admin-empty">No Q&A entries yet.</p>';
                return;
            }
            var blocks = [];
            keys.forEach(function (key) {
                (map[key] || []).forEach(function (entry) {
                    blocks.push('<article class="admin-item">'
                        + '<h4>' + key + '</h4>'
                        + '<p><b>Q:</b> ' + escapeHtml(entry.question || '') + '</p>'
                        + '<textarea data-answer-for="' + entry.id + '" data-game="' + key + '" placeholder="Type support answer...">' + escapeHtml(entry.answer || '') + '</textarea>'
                        + '<button type="button" data-save-answer="' + entry.id + '" data-game="' + key + '">Save Answer</button>'
                        + '</article>');
                });
            });
            qaWrap.innerHTML = blocks.join('');
        }

        function renderAdminAnalytics() {
            if (!analyticsWrap) {
                return;
            }
            var orders = getOrders();
            var totalRevenue = orders.reduce(function (sum, order) { return sum + Number(order.total || 0); }, 0);
            var avgOrder = orders.length ? totalRevenue / orders.length : 0;
            var productCounts = {};

            orders.forEach(function (order) {
                (order.items || []).forEach(function (item) {
                    var key = String(item.name || 'Unknown');
                    productCounts[key] = (productCounts[key] || 0) + Number(item.quantity || 1);
                });
            });

            var topProducts = Object.keys(productCounts)
                .map(function (key) { return [key, productCounts[key]]; })
                .sort(function (a, b) { return b[1] - a[1]; })
                .slice(0, 5);

            analyticsWrap.innerHTML =
                '<div class="analytics-stats">'
                + '<div class="stat-box"><span class="stat-num">' + orders.length + '</span><span class="stat-label">Orders</span></div>'
                + '<div class="stat-box"><span class="stat-num">R' + totalRevenue.toFixed(0) + '</span><span class="stat-label">Revenue</span></div>'
                + '<div class="stat-box"><span class="stat-num">R' + avgOrder.toFixed(0) + '</span><span class="stat-label">Avg Order</span></div>'
                + '</div>'
                + '<h4 style="color:#b9bfdc;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em;margin:0.5rem 0 0.4rem;">Top Products</h4>'
                + (topProducts.length
                    ? '<ul class="top-products-list">' + topProducts.map(function (entry) {
                        return '<li><span>' + escapeHtml(entry[0]) + '</span><strong>' + entry[1] + ' sold</strong></li>';
                    }).join('') + '</ul>'
                    : '<p class="admin-empty">Place some orders first.</p>');
        }

        function renderAdminCoupons() {
            if (!couponsList) {
                return;
            }
            var map = getPromoMap();
            var entries = Object.keys(map);
            if (!entries.length) {
                couponsList.innerHTML = '<p class="admin-empty">No coupons yet.</p>';
                return;
            }
            couponsList.innerHTML = entries.map(function (code) {
                var info = map[code];
                return '<article class="admin-item">'
                    + '<h4>' + escapeHtml(code) + ' &mdash; ' + escapeHtml(info.label || '') + '</h4>'
                    + '<p>' + (info.type === 'percent' ? info.discount + '% off' : 'R' + info.discount + ' off')
                    + ' &nbsp;|&nbsp; Status: <strong style="color:' + (info.active ? '#22c55e' : '#ef4444') + '">' + (info.active ? 'Active' : 'Disabled') + '</strong></p>'
                    + '<button type="button" data-toggle-coupon="' + escapeHtml(code) + '">' + (info.active ? 'Disable' : 'Enable') + '</button>'
                    + '</article>';
            }).join('');
        }

        function refreshUi() {
            var authed = isAdminAuthed();
            if (adminGate) {
                adminGate.style.display = authed ? 'none' : '';
            }
            if (panel) {
                panel.style.display = authed ? '' : 'none';
            }
            if (authed) {
                renderAdminAnalytics();
                renderOrders();
                renderReviews();
                renderQa();
                renderAdminCoupons();
            }
        }

        if (signOutBtn) {
            signOutBtn.addEventListener('click', function () {
                setAdminAuthed(false);
                showToast('Admin session ended. Use the footer Admin button to re-authenticate.');
                refreshUi();
            });
        }

        if (couponForm) {
            couponForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var codeInput = document.getElementById('coupon-code-input');
                var amountInput = document.getElementById('coupon-amount-input');
                var typeSelect = document.getElementById('coupon-type-select');
                var code = (codeInput ? codeInput.value.trim().toUpperCase() : '');
                var amount = parseFloat(amountInput ? amountInput.value : 0) || 0;
                var type = typeSelect ? typeSelect.value : 'percent';

                if (!code || amount <= 0) {
                    showToast('Enter a code and discount amount.', true);
                    return;
                }

                var builtInKeys = ['IGFIRST10', 'IGWELCOME', 'IGGAMER20', 'IGSUMMER'];
                if (builtInKeys.indexOf(code) !== -1) {
                    showToast('Cannot override a built-in coupon code.', true);
                    return;
                }

                var map = getPromoMap();
                map[code] = {
                    discount: amount,
                    type: type,
                    label: amount + (type === 'percent' ? '% off' : ' rand off'),
                    active: true
                };
                saveCoupons(map);
                showToast('Coupon ' + code + ' created.');
                couponForm.reset();
                renderAdminCoupons();
            });
        }

        root.addEventListener('change', function (event) {
            var statusSelect = event.target.closest('select[data-admin-status]');
            if (!statusSelect) {
                return;
            }

            var orderId = statusSelect.getAttribute('data-admin-status');
            var nextStatus = statusSelect.value;
            var orders = getOrders();

            orders.forEach(function (order) {
                if (order.id === orderId) {
                    order.status = nextStatus;
                    order.statusUpdatedAt = new Date().toISOString();
                    if (!Array.isArray(order.statusHistory)) {
                        order.statusHistory = [];
                    }
                    order.statusHistory.push({ status: nextStatus, at: order.statusUpdatedAt });
                    addNotification('Order ' + orderId + ' updated to ' + getOrderStatusMeta(order).label + '.', 'order');
                }
            });

            saveOrders(orders);
            showToast('Order status updated.');
        });

        root.addEventListener('click', function (event) {
            var delReview = event.target.closest('button[data-del-review]');
            if (delReview) {
                var reviewId = delReview.getAttribute('data-del-review');
                var reviewGame = delReview.getAttribute('data-game');
                var reviewMap = getGameReviews();
                reviewMap[reviewGame] = (reviewMap[reviewGame] || []).filter(function (entry) { return entry.id !== reviewId; });
                saveGameReviews(reviewMap);
                renderReviews();
                showToast('Review removed.');
                return;
            }

            var saveAnswer = event.target.closest('button[data-save-answer]');
            if (saveAnswer) {
                var qId = saveAnswer.getAttribute('data-save-answer');
                var qGame = saveAnswer.getAttribute('data-game');
                var area = root.querySelector('textarea[data-answer-for="' + qId + '"][data-game="' + qGame + '"]');
                var answerText = area ? area.value.trim() : '';
                var qMap = getGameQuestions();
                (qMap[qGame] || []).forEach(function (entry) {
                    if (entry.id === qId) {
                        entry.answer = answerText;
                        entry.answeredAt = new Date().toISOString();
                    }
                });
                saveGameQuestions(qMap);
                addNotification('Support answered a question for ' + qGame + '.', 'social');
                showToast('Answer saved.');
                renderQa();
                return;
            }

            var toggleCoupon = event.target.closest('button[data-toggle-coupon]');
            if (toggleCoupon) {
                var code = toggleCoupon.getAttribute('data-toggle-coupon');
                var builtInKeys = ['IGFIRST10', 'IGWELCOME', 'IGGAMER20', 'IGSUMMER'];
                if (builtInKeys.indexOf(code) !== -1) {
                    showToast('Built-in coupons cannot be toggled here.', true);
                    return;
                }

                var custom = safeParse('igCoupons', {});
                if (custom[code]) {
                    custom[code].active = !custom[code].active;
                    localStorage.setItem('igCoupons', JSON.stringify(custom));
                    renderAdminCoupons();
                    showToast('Coupon ' + code + ' ' + (custom[code].active ? 'enabled' : 'disabled') + '.');
                }
            }
        });

        refreshUi();
    }

    // ─── Skeleton loaders for feeds ─────────────────────────────────
    function feedSkeleton() {
        var html = '';
        for (var i = 0; i < 3; i++) {
            html += '<div class="skel-item"><div class="skel-line skel-title"></div><div class="skel-line skel-sub"></div><div class="skel-line skel-link"></div></div>';
        }
        return html;
    }

    setupActiveNavLink();
    ensureMarketplaceNavLinks();
    setupMobileMenu();
    setupNavbarScrollState();
    setupRevealAnimations();
    optimizeImages();
    setupBackToTopButton();
    setupProductAddToCart();
    updateCheckoutNavBadge();
    updateWishlistNavBadge();
    updateDashboardNavState();
    updateAccountNavState();
    updateAdminNavState();
    setupWishlistButtons();
    setupStarRatings();
    setupWishlistPage();
    setupProductPageExtras();
    setupGameSearch();
    setupSubscriptionForm();
    setupDashboardPage();
    setupAccountPage();
    setupAdminPage();
    setupStockBadges();
    setupRecentlyViewed();
    loadGamingFeeds();
    injectSiteFooter();
    setupPageReadyState();
});
