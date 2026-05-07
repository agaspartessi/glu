document.addEventListener('DOMContentLoaded', function () {
    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    var catalogUrl = wwwroot + '/local/coursecatalog/view.php?slug=courses&sort=name_asc&view=grid&perpage=100';

    function isAuthenticatedUser() {
        if (window.M && M.cfg && Number(M.cfg.userid) > 1) {
            return true;
        }

        if (document.body.classList.contains('notloggedin')) {
            return false;
        }

        if (document.querySelector('a[href*="/login/index.php"]')) {
            return false;
        }

        return Boolean(document.querySelector('.usermenu, [data-region="usermenu"], .userbutton'));
    }

    function isHomeLink(link) {
        var text = (link.textContent || '').trim().toLowerCase();
        var href = link.getAttribute('href') || '';

        if (text !== 'home') {
            return false;
        }

        var url;

        try {
            url = new URL(href, wwwroot);
        } catch (error) {
            return false;
        }

        return (
            url.origin === window.location.origin &&
            (
                url.pathname === '/' ||
                url.pathname === '/index.php'
            )
        );
    }

    function rewriteHomeLink() {
        if (!isAuthenticatedUser()) {
            return;
        }

        var links = document.querySelectorAll(
            '.primary-navigation a, .navbar-nav a, nav.navbar a, header a.nav-link'
        );

        links.forEach(function (link) {
            if (isHomeLink(link)) {
                link.href = catalogUrl;
                link.setAttribute('title', 'All courses');
            }
        });
    }

    rewriteHomeLink();

    // Por si Moodle termina de renderizar algo después.
    setTimeout(rewriteHomeLink, 500);
});