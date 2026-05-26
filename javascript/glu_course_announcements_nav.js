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

    function findAnnouncementsLinkInDocument(doc) {
        var links = Array.from(doc.querySelectorAll('a[href*="/mod/forum/view.php"]'));

        return links.find(function (link) {
            var text = cleanText(link.textContent).toLowerCase();

            return text === 'avisos' ||
                text === 'anuncios' ||
                text === 'announcements' ||
                text === 'news forum';
        }) || null;
    }

    function hideOriginalAnnouncements(link) {
        if (!link) {
            return;
        }

        var activity = link.closest(
            'li.activity, .activity, .activity-item, [data-for="cmitem"], .modtype_forum'
        );

        if (activity) {
            activity.classList.add('glu-announcements-original-hidden');
        }
    }

    function addAnnouncementsToTopNav(link) {
        var topNav = getTopCourseNav();

        if (!topNav || !link || !link.href) {
            return;
        }

        if (topNav.querySelector('.glu-announcements-navitem')) {
            return;
        }

        var item = document.createElement('li');
        item.className = 'nav-item glu-announcements-navitem';

        var navLink = document.createElement('a');
        navLink.className = 'nav-link';
        navLink.href = link.href;
        navLink.textContent = cleanText(link.textContent) || 'Avisos';

        item.appendChild(navLink);

        var moreItem = topNav.querySelector('.dropdownmoremenu, .nav-item.dropdown');

        if (moreItem) {
            topNav.insertBefore(item, moreItem);
        } else {
            topNav.appendChild(item);
        }
    }

    function apply(link) {
        if (!link) {
            return;
        }

        addAnnouncementsToTopNav(link);
        hideOriginalAnnouncements(link);
    }

    var currentLink = findAnnouncementsLinkInDocument(document);

    if (currentLink) {
        apply(currentLink);
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
        apply({
            href: cachedUrl,
            textContent: cachedText || 'Avisos'
        });
        return;
    }

    fetch(wwwroot + '/course/view.php?id=' + courseId, {
        credentials: 'same-origin'
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Could not load course page');
            }

            return response.text();
        })
        .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var link = findAnnouncementsLinkInDocument(doc);

            if (!link) {
                return;
            }

            window.sessionStorage.setItem(cacheKey, link.href);
            window.sessionStorage.setItem(cacheKey + '_text', cleanText(link.textContent));

            apply(link);
        })
        .catch(function () {
            return;
        });
});