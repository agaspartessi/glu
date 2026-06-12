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

    function getVisibleText(element) {
        if (!element) {
            return '';
        }

        var clone = element.cloneNode(true);

        clone.querySelectorAll(
            '.accesshide, .sr-only, .visually-hidden, .visually-hidden-focusable, [aria-hidden="true"]'
        ).forEach(function (hidden) {
            hidden.remove();
        });

        return cleanText(clone.textContent);
    }

    function getCourseId() {
        try {
            var params = new URLSearchParams(window.location.search);
            var idFromUrl = params.get('id');

            if (idFromUrl) {
                return idFromUrl;
            }
        } catch (e) { }

        if (window.M && M.cfg) {
            return M.cfg.courseId || M.cfg.courseid || null;
        }

        return null;
    }

    function getSecondaryNavList() {
        return document.querySelector('.secondary-navigation ul.nav-tabs') ||
            document.querySelector('.secondary-navigation .moremenu ul.nav-tabs') ||
            document.querySelector('nav.moremenu ul.nav-tabs');
    }

    function findOpenForumInDocument(doc) {
        var section0 =
            doc.querySelector('#section-0') ||
            doc.querySelector('li#section-0') ||
            doc.querySelector('[data-sectionid="0"]') ||
            doc.querySelector('[data-section="0"]') ||
            doc.querySelector('[data-number="0"]');

        var scope = section0 || doc;

        var activities = Array.from(scope.querySelectorAll(
            'li.modtype_hsuforum, ' +
            '.activity.modtype_hsuforum, ' +
            '[data-for="cmitem"].modtype_hsuforum, ' +
            '.modtype_hsuforum'
        ));

        for (var i = 0; i < activities.length; i++) {
            var activity = activities[i];

            var link = activity.querySelector('a[href*="/mod/hsuforum/view.php"]');

            if (!link) {
                continue;
            }

            var nameElement =
                activity.querySelector('.instancename') ||
                activity.querySelector('.activityname') ||
                activity.querySelector('.activity-name') ||
                link;

            var title =
                getVisibleText(nameElement) ||
                cleanText(link.getAttribute('title')) ||
                'Open forum';

            /*
             * Limpieza defensiva:
             * Moodle puede agregar el tipo de actividad como texto oculto.
             */
            title = title
                .replace(/\s*Open forum\s*$/i, '')
                .replace(/\s*Forum\s*$/i, '')
                .trim();

            if (!title) {
                title = 'Open forum';
            }

            return {
                activity: activity,
                href: link.href,
                title: title
            };
        }

        return null;
    }

    function hideOriginalIfPresent(forumData) {
        if (!forumData || !forumData.activity || forumData.activity.ownerDocument !== document) {
            return;
        }

        var activityRoot =
            forumData.activity.closest('li.activity') ||
            forumData.activity.closest('.activity') ||
            forumData.activity.closest('[data-for="cmitem"]') ||
            forumData.activity;

        activityRoot.classList.add('glu-section0-openforum-original-hidden');
    }

    function insertNavItem(forumData) {
        if (!forumData || !forumData.href) {
            return;
        }

        if (document.querySelector('.glu-section0-openforum-navitem')) {
            return;
        }

        var navList = getSecondaryNavList();

        if (!navList) {
            return;
        }

        var li = document.createElement('li');
        li.className = 'nav-item glu-section0-openforum-navitem';
        li.setAttribute('role', 'none');

        var a = document.createElement('a');
        a.className = 'nav-link';
        a.href = forumData.href;
        a.textContent = forumData.title;
        a.setAttribute('role', 'menuitem');
        a.setAttribute('title', forumData.title);
        a.setAttribute('aria-label', forumData.title);

        li.appendChild(a);

        var announcementsItem =
            navList.querySelector('.glu-announcements-navitem') ||
            Array.from(navList.querySelectorAll('li.nav-item')).find(function (item) {
                var text = cleanText(item.textContent).toLowerCase();

                return text.indexOf('announcements') !== -1 ||
                    text.indexOf('avisos') !== -1 ||
                    text.indexOf('novedades') !== -1;
            });

        if (announcementsItem && announcementsItem.parentNode === navList) {
            announcementsItem.insertAdjacentElement('afterend', li);
            return;
        }

        var moreItem =
            navList.querySelector('li[data-key="moremenu"]') ||
            navList.querySelector('.dropdownmoremenu');

        if (moreItem && moreItem.parentNode === navList) {
            navList.insertBefore(li, moreItem);
            return;
        }

        navList.appendChild(li);
    }

    function applyForumNav(forumData) {
        if (!forumData) {
            return;
        }

        insertNavItem(forumData);
        hideOriginalIfPresent(forumData);
    }

    function loadSection0AndApply() {
        var courseId = getCourseId();

        if (!courseId) {
            return;
        }

        var url = wwwroot + '/course/view.php?id=' + encodeURIComponent(courseId) + '&section=0';

        fetch(url, { credentials: 'same-origin' })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Could not load section 0');
                }

                return response.text();
            })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var forumData = findOpenForumInDocument(doc);

                applyForumNav(forumData);
            })
            .catch(function () { });
    }

    var forumData = findOpenForumInDocument(document);

    if (forumData) {
        applyForumNav(forumData);
    } else {
        loadSection0AndApply();
    }
});