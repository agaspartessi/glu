document.addEventListener('DOMContentLoaded', function () {
    var isCoursePage =
        document.body.id.indexOf('page-course-view') !== -1 ||
        document.body.classList.contains('path-course-view');

    var courseIndex = document.querySelector('.courseindex');

    if (!isCoursePage || !courseIndex) {
        return;
    }

    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    function setLinkText(link, text) {
        if (!link) {
            return;
        }

        if (link.textContent.trim() !== text) {
            link.textContent = text;
        }

        link.setAttribute('title', text);
        link.setAttribute('aria-label', text);
        link.classList.add('glu-unit-navigation-link');
    }

    function renameSectionNavigation() {
        var previousLinks = document.querySelectorAll(
            '.section-navigation .prevsection a, .section-navigation .prevsection > a'
        );

        var nextLinks = document.querySelectorAll(
            '.section-navigation .nextsection a, .section-navigation .nextsection > a'
        );

        previousLinks.forEach(function (link) {
            setLinkText(link, 'Previous Unit');
        });

        nextLinks.forEach(function (link) {
            setLinkText(link, 'Next Unit');
        });
    }

    function getSectionNumberFromUrl(url) {
        if (!url) {
            return null;
        }

        try {
            var parsedUrl = new URL(url, wwwroot);
            return parsedUrl.searchParams.get('section');
        } catch (error) {
            return null;
        }
    }

    function getOwnCourseIndexItem(sectionElement) {
        if (!sectionElement) {
            return null;
        }

        var children = Array.from(sectionElement.children);

        return children.find(function (child) {
            return child.classList.contains('courseindex-item') ||
                child.classList.contains('courseindex-section-title') ||
                child.getAttribute('data-for') === 'section_title';
        }) || null;
    }

    function getOwnSectionLink(sectionElement) {
        var ownItem = getOwnCourseIndexItem(sectionElement);

        if (!ownItem) {
            return null;
        }

        return ownItem.querySelector(
            'a.courseindex-link[href*="/course/view.php"][href*="section="]'
        );
    }

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    /*
     * Marca en el Course Index qué secciones son tabs padre o child tabs
     * según la estructura real de OneTopic.
     *
     * No mueve elementos: solo agrega clases para poder maquetar con CSS.
     */
    function markOnetopicChildTabsInCourseIndex() {
        var levelBySection = {};

        var tabLinks = document.querySelectorAll(
            '#tabs-tree-start li[class*="tab_level_"] a[href*="/course/view.php"][href*="section="], ' +
            '.format-onetopic-tabs li[class*="tab_level_"] a[href*="/course/view.php"][href*="section="], ' +
            '.format-onetopic li[class*="tab_level_"] a[href*="/course/view.php"][href*="section="], ' +
            'ul[class*="onetopic"] li[class*="tab_level_"] a[href*="/course/view.php"][href*="section="]'
        );

        tabLinks.forEach(function (link) {
            var tabItem = link.closest('li[class*="tab_level_"]');

            if (!tabItem) {
                return;
            }

            var match = tabItem.className.match(/tab_level_(\d+)/);
            var sectionNumber = getSectionNumberFromUrl(link.href);

            if (!match || !sectionNumber) {
                return;
            }

            levelBySection[sectionNumber] = parseInt(match[1], 10);
        });

        Object.keys(levelBySection).forEach(function (sectionNumber) {
            var level = levelBySection[sectionNumber];

            var courseIndexSections = courseIndex.querySelectorAll(
                '.courseindex-section[data-number="' + sectionNumber + '"]'
            );

            courseIndexSections.forEach(function (sectionElement) {
                sectionElement.classList.add('glu-onetopic-tab-level-' + level);

                if (level > 0) {
                    sectionElement.classList.add('glu-onetopic-child-tab');
                } else {
                    sectionElement.classList.add('glu-onetopic-parent-tab');
                }
            });
        });
    }

    /*
     * Obtiene el primer child tab de un tab padre.
     *
     * Esto se basa en el orden que entrega OneTopic:
     * un padre tab_level_0 seguido por sus child tabs tab_level_1.
     */
    function buildParentToFirstChildMapFromOnetopicTabs() {
        var targets = {};
        var currentParentSection = null;

        var tabItems = document.querySelectorAll(
            '#tabs-tree-start li[class*="tab_level_"], ' +
            '.format-onetopic-tabs li[class*="tab_level_"], ' +
            '.format-onetopic li[class*="tab_level_"], ' +
            'ul[class*="onetopic"] li[class*="tab_level_"]'
        );

        tabItems.forEach(function (tabItem) {
            var link = tabItem.querySelector(
                'a[href*="/course/view.php"][href*="section="]'
            );

            if (!link) {
                return;
            }

            var match = tabItem.className.match(/tab_level_(\d+)/);
            var sectionNumber = getSectionNumberFromUrl(link.href);

            if (!match || !sectionNumber) {
                return;
            }

            var level = parseInt(match[1], 10);

            if (level === 0) {
                currentParentSection = sectionNumber;
                return;
            }

            if (level > 0 && currentParentSection && !targets[currentParentSection]) {
                targets[currentParentSection] = {
                    href: link.href,
                    label: cleanText(link.textContent)
                };
            }
        });

        return targets;
    }

    /*
     * Solo modifica links del Course Index lateral.
     * No toca tabs superiores, recursos ni actividades.
     */
    function prepareCourseIndexParentLinks() {
        var targets = buildParentToFirstChildMapFromOnetopicTabs();

        Object.keys(targets).forEach(function (sectionNumber) {
            var sectionElement = courseIndex.querySelector(
                '.courseindex-section[data-number="' + sectionNumber + '"]'
            );

            if (!sectionElement) {
                return;
            }

            var ownLink = getOwnSectionLink(sectionElement);

            if (!ownLink) {
                return;
            }

            ownLink.dataset.gluTargetHref = targets[sectionNumber].href;
            ownLink.classList.add('glu-courseindex-parent-redirect');

            if (targets[sectionNumber].label) {
                ownLink.setAttribute(
                    'title',
                    'Go to first child tab: ' + targets[sectionNumber].label
                );
            }
        });
    }

    function handleCourseIndexClick(event) {
        var link = event.target.closest(
            '.courseindex a.courseindex-link[href*="/course/view.php"][href*="section="]'
        );

        if (!link || !link.dataset.gluTargetHref) {
            return;
        }

        event.preventDefault();
        window.location.href = link.dataset.gluTargetHref;
    }

    renameSectionNavigation();
    markOnetopicChildTabsInCourseIndex();
    prepareCourseIndexParentLinks();

    /*
     * Segunda pasada liviana por si Moodle termina de renderizar el índice
     * unos milisegundos después. No usamos MutationObserver.
     */
    window.setTimeout(function () {
        markOnetopicChildTabsInCourseIndex();
        prepareCourseIndexParentLinks();
    }, 500);

    courseIndex.addEventListener('click', handleCourseIndexClick, true);
});