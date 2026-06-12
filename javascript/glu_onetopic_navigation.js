document.addEventListener('DOMContentLoaded', function () {
    var isCoursePage =
        document.body.id.indexOf('page-course-view') !== -1 ||
        document.body.classList.contains('path-course-view');

    var isModulePage =
        document.body.id.indexOf('page-mod-') === 0 ||
        Array.from(document.body.classList).some(function (className) {
            return className.indexOf('path-mod-') === 0;
        });

    if (!isCoursePage && !isModulePage) {
        return;
    }

    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function getSectionNumberFromUrl(url) {
        if (!url) {
            return null;
        }

        try {
            var parsedUrl = new URL(url, wwwroot);

            if (parsedUrl.pathname.indexOf('/course/view.php') === -1) {
                return null;
            }

            return parsedUrl.searchParams.get('section') || '0';
        } catch (error) {
            return null;
        }
    }

    function getCurrentSectionFromUrl() {
        return getSectionNumberFromUrl(window.location.href);
    }

    function getCurrentSectionFromCustomIndex() {
        var activeLink =
            document.querySelector('.glu-custom-courseindex__link.is-active') ||
            document.querySelector('.glu-custom-courseindex__item.is-active > .glu-custom-courseindex__row .glu-custom-courseindex__link');

        if (!activeLink) {
            return null;
        }

        return getSectionNumberFromUrl(activeLink.getAttribute('href'));
    }

    function getCurrentSectionFromNativeCourseIndex() {
        var drawer = document.querySelector('#theme_boost-drawers-courseindex');

        if (!drawer) {
            return null;
        }

        var activeLink =
            drawer.querySelector('.courseindex .active a[href*="/course/view.php"]') ||
            drawer.querySelector('.courseindex a.active[href*="/course/view.php"]') ||
            drawer.querySelector('.courseindex .pageitem a[href*="/course/view.php"]') ||
            drawer.querySelector('.courseindex a[aria-current="true"]');

        if (activeLink) {
            var sectionFromLink = getSectionNumberFromUrl(activeLink.getAttribute('href'));

            if (sectionFromLink !== null) {
                return sectionFromLink;
            }
        }

        var activeNode =
            drawer.querySelector('.courseindex .active') ||
            drawer.querySelector('.courseindex .pageitem');

        if (activeNode) {
            var sectionNode = activeNode.closest('[data-number], [data-sectionnumber], [data-section-id]');

            if (sectionNode) {
                return sectionNode.getAttribute('data-number') ||
                    sectionNode.getAttribute('data-sectionnumber') ||
                    sectionNode.getAttribute('data-section-id');
            }
        }

        return null;
    }

    function getCurrentSection() {
        return getCurrentSectionFromUrl() ||
            getCurrentSectionFromCustomIndex() ||
            getCurrentSectionFromNativeCourseIndex();
    }

    function getOrderedCourseSections() {
        var links = Array.from(document.querySelectorAll(
            '.glu-custom-courseindex__link[href*="/course/view.php"]'
        ));

        if (!links.length) {
            return [];
        }

        var seen = {};
        var sections = [];

        links.forEach(function (link) {
            var href = link.getAttribute('href');
            var section = getSectionNumberFromUrl(href);

            if (section === null) {
                return;
            }

            /*
             * Evitar duplicados: en Onetopic a veces el capítulo padre
             * y el primer hijo apuntan a la misma sección.
             */
            if (seen[section]) {
                return;
            }

            seen[section] = true;

            sections.push({
                section: section,
                href: new URL(href, wwwroot).href,
                title: cleanText(link.textContent)
            });
        });

        return sections;
    }

    function buildLabel(text, type) {
        var fragment = document.createDocumentFragment();

        if (type === 'previous') {
            var prevIcon = document.createElement('span');
            prevIcon.className = 'glu-unit-navigation-arrow';
            prevIcon.setAttribute('aria-hidden', 'true');
            prevIcon.textContent = '‹';
            fragment.appendChild(prevIcon);
        }

        var label = document.createElement('span');
        label.className = 'glu-unit-navigation-label';
        label.textContent = text;
        fragment.appendChild(label);

        if (type === 'next') {
            var nextIcon = document.createElement('span');
            nextIcon.className = 'glu-unit-navigation-arrow';
            nextIcon.setAttribute('aria-hidden', 'true');
            nextIcon.textContent = '›';
            fragment.appendChild(nextIcon);
        }

        return fragment;
    }

    function setUnitNavigationLink(link, text, type, href) {
        if (!link) {
            return;
        }

        link.innerHTML = '';
        link.appendChild(buildLabel(text, type));

        if (href) {
            link.href = href;
        }

        link.removeAttribute('title');
        link.setAttribute('aria-label', text);

        link.classList.add('glu-unit-navigation-link');
        link.classList.remove('glu-unit-navigation-link--previous', 'glu-unit-navigation-link--next');

        if (type === 'previous') {
            link.classList.add('glu-unit-navigation-link--previous');
        }

        if (type === 'next') {
            link.classList.add('glu-unit-navigation-link--next');
        }
    }

    function hideExtraLinks(links) {
        links.forEach(function (link) {
            link.classList.add('glu-unit-navigation-extra');
            link.setAttribute('aria-hidden', 'true');
            link.setAttribute('tabindex', '-1');
        });
    }

    function renameCourseSectionNavigation() {
        if (!isCoursePage) {
            return;
        }

        var previousLinks = document.querySelectorAll(
            '.section-navigation .prevsection a, .section-navigation .prevsection > a'
        );

        var nextLinks = document.querySelectorAll(
            '.section-navigation .nextsection a, .section-navigation .nextsection > a'
        );

        previousLinks.forEach(function (link) {
            setUnitNavigationLink(link, 'Previous Unit', 'previous');
        });

        nextLinks.forEach(function (link) {
            setUnitNavigationLink(link, 'Next Unit', 'next');
        });
    }

    function normalizeModuleActivityNavigation() {
        if (!isModulePage) {
            return false;
        }

        var sections = getOrderedCourseSections();
        var currentSection = getCurrentSection();

        if (!sections.length || currentSection === null) {
            return false;
        }

        var currentIndex = sections.findIndex(function (item) {
            return String(item.section) === String(currentSection);
        });

        if (currentIndex === -1) {
            return false;
        }

        var previousTarget = sections[currentIndex - 1] || null;
        var nextTarget = sections[currentIndex + 1] || null;

        var navigations = document.querySelectorAll('.activity-navigation');

        if (!navigations.length) {
            return false;
        }

        navigations.forEach(function (nav) {
            var row = nav.querySelector('.row') || nav;

            nav.classList.add('glu-activity-navigation-ready');

            var columns = Array.from(row.children).filter(function (child) {
                return child.nodeType === 1;
            });

            if (!columns.length) {
                return;
            }

            var jumpColumn = columns.find(function (column) {
                return column.querySelector(
                    'select, .urlselect, form[action*="/course/jumpto.php"], form[action*="jumpto"]'
                );
            });

            if (jumpColumn) {
                jumpColumn.classList.add('glu-activity-navigation-jump');
            }

            var previousColumn = columns[0];
            var nextColumn = columns[columns.length - 1];

            if (previousColumn) {
                previousColumn.classList.add('glu-activity-navigation-previous');

                var previousLinks = Array.from(previousColumn.querySelectorAll('a[href]'));

                if (previousTarget && previousLinks.length) {
                    setUnitNavigationLink(previousLinks[0], 'Previous Unit', 'previous', previousTarget.href);
                    hideExtraLinks(previousLinks.slice(1));
                    previousColumn.classList.remove('glu-activity-navigation-empty');
                } else {
                    previousColumn.classList.add('glu-activity-navigation-empty');
                }
            }

            if (nextColumn) {
                nextColumn.classList.add('glu-activity-navigation-next');

                var nextLinks = Array.from(nextColumn.querySelectorAll('a[href]'));

                if (nextTarget && nextLinks.length) {
                    setUnitNavigationLink(nextLinks[0], 'Next Unit', 'next', nextTarget.href);
                    hideExtraLinks(nextLinks.slice(1));
                    nextColumn.classList.remove('glu-activity-navigation-empty');
                } else {
                    nextColumn.classList.add('glu-activity-navigation-empty');
                }
            }
        });

        return true;
    }

    function applyNavigation() {
        renameCourseSectionNavigation();

        if (!isModulePage) {
            return;
        }

        normalizeModuleActivityNavigation();
    }

    applyNavigation();

    /*
     * En páginas de actividad, el Course chapters puede generarse después
     * porque se reconstruye desde la página del curso.
     */
    var attempts = 0;
    var interval = window.setInterval(function () {
        attempts++;

        applyNavigation();

        if (attempts >= 12) {
            window.clearInterval(interval);
        }
    }, 250);
});