document.addEventListener('DOMContentLoaded', function () {
    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    var catalogUrl = wwwroot + '/local/coursecatalog/view.php?slug=courses&sort=name_asc&view=grid&perpage=100';

    function isAuthenticatedUser() {
        if (document.body.classList.contains('notloggedin')) {
            return false;
        }

        if (document.querySelector('a[href*="/login/index.php"]')) {
            return false;
        }

        return true;
    }

    function isSiteHome() {
        return document.body.id === 'page-site-index';
    }

    function isRedirectDisabled() {
        var url = new URL(window.location.href);

        return (
            url.searchParams.get('glu_no_redirect') === '1' ||
            url.searchParams.get('edit') === 'on' ||
            document.body.classList.contains('editing')
        );
    }

    function hideLoggedInHomeLink() {
        if (!isAuthenticatedUser()) {
            return;
        }

        var links = document.querySelectorAll('.primary-navigation a, .navbar-nav a, a.nav-link');

        links.forEach(function (link) {
            var text = (link.textContent || '').trim().toLowerCase();
            var href = link.getAttribute('href') || '';

            var url;

            try {
                url = new URL(href, wwwroot);
            } catch (error) {
                return;
            }

            var isHomeLink =
                (text === 'home' || text === 'site home') &&
                url.origin === window.location.origin &&
                (
                    url.pathname === '/' ||
                    url.pathname === '/index.php' ||
                    url.pathname === '/?redirect=0'
                );

            if (isHomeLink) {
                var item = link.closest('li.nav-item') || link.closest('.nav-item') || link.parentElement;

                if (item) {
                    item.style.display = 'none';
                } else {
                    link.style.display = 'none';
                }
            }
        });
    }

    function normalizeAllCoursesLinks() {
        var links = document.querySelectorAll('a[href*="/local/coursecatalog/view.php"][href*="slug=courses"]');

        links.forEach(function (link) {
            link.href = catalogUrl;

            var text = (link.textContent || '').trim().toLowerCase();

            if (text === 'courses') {
                link.textContent = 'All courses';
            }
        });
    }

    hideLoggedInHomeLink();
    normalizeAllCoursesLinks();

    if (isSiteHome() && isAuthenticatedUser() && !isRedirectDisabled()) {
        window.location.replace(catalogUrl);
    }
});