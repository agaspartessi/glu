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
        var preferredContainers = [
            '#section-0',
            '[data-sectionid="0"]',
            '[data-number="0"]',
            '#region-main'
        ];

        var forumSelectors =
            'li.activity.modtype_forum a[href*="/mod/forum/view.php"], ' +
            'li.activity.forum a[href*="/mod/forum/view.php"], ' +
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

    function getForumText(link) {
        var text = cleanText(link.textContent);

        if (!text) {
            return 'Announcements';
        }

        /* Limpieza por si Moodle concatena tipo "Avisos Forum". */
        text = text.replace(/\s+forum$/i, '');
        text = text.replace(/\s+foro$/i, '');

        return cleanText(text) || 'Announcements';
    }

    function hideOriginalForum(link) {
        if (!link || typeof link.closest !== 'function') {
            return;
        }

        /*
         * Importante: priorizamos el li.activity completo.
         * Si ocultamos un div interno, queda visible el icono.
         */
        var activityLi = link.closest('li.activity');

        if (activityLi) {
            activityLi.classList.add('glu-announcements-original-hidden');
            return;
        }

        var cmItem = link.closest('[data-for="cmitem"]');

        if (cmItem) {
            cmItem.classList.add('glu-announcements-original-hidden');
            return;
        }

        var activityItem = link.closest('.activity-item');

        if (activityItem) {
            activityItem.classList.add('glu-announcements-original-hidden');
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
        navLink.textContent = linkData.textContent || 'Announcements';

        item.appendChild(navLink);

        var moreItem = topNav.querySelector('.dropdownmoremenu, .nav-item.dropdown');

        if (moreItem) {
            topNav.insertBefore(item, moreItem);
        } else {
            topNav.appendChild(item);
        }
    }

    function hideCurrentPageForum() {
        var currentForum = findFirstForumLinkInDocument(document);

        if (currentForum) {
            hideOriginalForum(currentForum);
        }
    }

    function applyForumLink(link) {
        if (!link || !link.href) {
            return;
        }

        addForumToTopNav({
            href: link.href,
            textContent: getForumText(link)
        });

        hideOriginalForum(link);
        hideCurrentPageForum();
    }

    var currentLink = findFirstForumLinkInDocument(document);

    if (currentLink) {
        applyForumLink(currentLink);
        window.setTimeout(hideCurrentPageForum, 500);
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

        hideCurrentPageForum();
        window.setTimeout(hideCurrentPageForum, 500);
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

            var linkText = getForumText(link);

            window.sessionStorage.setItem(cacheKey, link.href);
            window.sessionStorage.setItem(cacheKey + '_text', linkText);

            addForumToTopNav({
                href: link.href,
                textContent: linkText
            });

            hideCurrentPageForum();
            window.setTimeout(hideCurrentPageForum, 500);
        })
        .catch(function () {
            return;
        });
});