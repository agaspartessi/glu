document.addEventListener('DOMContentLoaded', function () {
    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    var homeUrl = wwwroot + '/';

    function isHomeNavLink(link) {
        var text = (link.textContent || '').trim().toLowerCase();

        if (text !== 'home') {
            return false;
        }

        return link.closest('.primary-navigation, .navbar-nav, nav.navbar, header') !== null;
    }

    function restoreHomeLink() {
        var links = document.querySelectorAll(
            '.primary-navigation a, .navbar-nav a, nav.navbar a, header a.nav-link'
        );

        links.forEach(function (link) {
            if (isHomeNavLink(link)) {
                link.href = homeUrl;
                link.setAttribute('title', 'Home');
                link.setAttribute('aria-label', 'Home');
            }
        });
    }

    restoreHomeLink();

    // Por si Moodle termina de renderizar la navegación después.
    setTimeout(restoreHomeLink, 500);
    setTimeout(restoreHomeLink, 1200);
});