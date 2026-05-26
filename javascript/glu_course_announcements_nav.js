document.addEventListener('DOMContentLoaded', function () {
    var isCoursePage =
        document.body.id.indexOf('page-course-view') !== -1 ||
        document.body.classList.contains('path-course-view');

    if (!isCoursePage) {
        return;
    }

    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function getCourseId() {
        try {
            var url = new URL(window.location.href);
            return url.searchParams.get('id');
        } catch (error) {
            return null;
        }
    }

    function getTopCourseNav() {
        return document.querySelector(
            '.secondary-navigation nav.moremenu ul.nav-tabs, ' +
            '.secondary-navigation .moremenu ul.nav-tabs, ' +
            '.secondary-navigation ul.nav-tabs'
        );
    }

    function findFirstForumLinkInDocument(doc) {
        /*
         * Busca el primer foro del curso sin depender del idioma.
         * Prioridad:
         * 1. Foro dentro de la sección 0 / General / Course dashboard.
         * 2. Primer foro visible dentro de region-main.
         * 3. Primer foro de toda la página.
         */

        var preferredContainers = [
            '#section-0',
            '[data-sectionid="0"]',
            '[data-number="0"]',
            '#region-main'
        ];

        var forumSelectors =
            '.modtype_forum a[href*="/mod/forum/view.php"], ' +
            'li.activity.modtype_forum a[href*="/mod/forum/view.php"], ' +
            '.activity.modtype_forum a[href*="/mod/forum/view.php"], ' +
            '[data-modname="forum"] a[href*="/mod/forum/view.php"], ' +
            'a[href*="/mod/forum/view.php"]';

        for (var i = 0; i < preferredContainers.length; i++) {
            var container = doc.querySelector(preferredContainers[i]);

            if (!container) {
                continue;
            }

            var forumLink = container.querySelector(forumSelectors);

            if (forumLink) {
                return forumLink;
            }
        }

        return doc.querySelector('a[href*="/mod/forum/view.php"]');
    }

    function hideOriginalForum(link) {
        if (!link || typeof link.closest !== 'function') {
            return;
        }

        var activity = link.closest(
            'li.activity, ' +
            '.activity, ' +
            '.activity-item, ' +
            '[data-for="cmitem"], ' +
            '.modtype_forum'
        );

        if (activity) {
            activity.classList.add('glu-announcements-original-hidden');
        }
    }

    function addForumToTopNav(linkData) {
        var topNav = getTopCourseNav();

        if (!topNav || !linkData || !linkData.href) {
            return;
        }

        if (topNav.querySelector('.glu-announcements-navitem')) {
            return;
        }

        var item = document.createElement('li');
        item.className = 'nav-item glu-announcements-navitem';

        var navLink = document.createElement('a');
        navLink.className = 'nav-link';
        navLink.href = linkData.href;
        navLink.textContent = cleanText(linkData.textContent) || 'Announcements';

        item.appendChild(navLink);

        var moreItem = topNav.querySelector('.dropdownmoremenu, .nav-item.dropdown');

        if (moreItem) {
            topNav.insertBefore(item, moreItem);
        } else {
            topNav.appendChild(item);
        }
    }

    function applyForumLink(link) {
        if (!link || !link.href) {
            return;
        }

        addForumToTopNav({
            href: link.href,
            textContent: link.textContent || 'Announcements'
        });

        hideOriginalForum(link);
    }

    var currentLink = findFirstForumLinkInDocument(document);

    if (currentLink) {
        applyForumLink(currentLink);
        return;
    }

    var courseId = getCourseId();

    if (!courseId) {
        return;
    }

    var cacheKey = 'glu_announcements_url_' + courseId;
    var cachedUrl = window.sessionStorage.getItem(cacheKey);
    var cachedText = window.sessionStorage.getItem(cacheKey + '_text');

    if (cachedUrl) {
        addForumToTopNav({
            href: cachedUrl,
            textContent: cachedText || 'Announcements'
        });

        return;
    }

    fetch(wwwroot + '/course/view.php?id=' + courseId + '&section=0', {
        credentials: 'same-origin'
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Could not load course section 0');
            }

            return response.text();
        })
        .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var link = findFirstForumLinkInDocument(doc);

            if (!link || !link.href) {
                return;
            }

            var linkText = cleanText(link.textContent) || 'Announcements';

            window.sessionStorage.setItem(cacheKey, link.href);
            window.sessionStorage.setItem(cacheKey + '_text', linkText);

            addForumToTopNav({
                href: link.href,
                textContent: linkText
            });
        })
        .catch(function () {
            return;
        });
});