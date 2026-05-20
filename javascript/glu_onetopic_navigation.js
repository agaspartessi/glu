document.addEventListener('DOMContentLoaded', function () {
    var isCoursePage =
        document.body.id.indexOf('page-course-view') !== -1 ||
        document.body.classList.contains('path-course-view');

    var courseIndex = document.querySelector('#theme_boost-drawers-courseindex .courseindex, .courseindex');

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

        link.textContent = text;
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

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
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

    function getCourseIndexSection(sectionNumber) {
        return courseIndex.querySelector(
            '.courseindex-section[data-number="' + sectionNumber + '"]'
        );
    }

    function getCollapseContent(sectionElement) {
        var ownItem = getOwnCourseIndexItem(sectionElement);

        if (!ownItem) {
            return null;
        }

        var toggle = ownItem.querySelector(
            '[aria-controls], [aria-owns], a[href^="#courseindexcollapse"]'
        );

        var collapseId = null;

        if (toggle) {
            collapseId =
                toggle.getAttribute('aria-controls') ||
                toggle.getAttribute('aria-owns') ||
                (toggle.getAttribute('href') || '').replace('#', '');
        }

        if (collapseId) {
            var contentById = document.getElementById(collapseId);

            if (contentById) {
                return contentById;
            }
        }

        var children = Array.from(sectionElement.children);

        return children.find(function (child) {
            return child.classList.contains('courseindex-item-content') ||
                child.classList.contains('collapse') ||
                child.classList.contains('show') ||
                (child.id && child.id.indexOf('courseindexcollapse') === 0);
        }) || null;
    }

    function getOnetopicTabItems() {
        return Array.from(document.querySelectorAll(
            '#tabs-tree-start li[class*="tab_level_"], ' +
            '.format-onetopic-tabs li[class*="tab_level_"], ' +
            '.format-onetopic li[class*="tab_level_"], ' +
            'ul[class*="onetopic"] li[class*="tab_level_"]'
        )).filter(function (item) {
            return item.querySelector('a[href*="/course/view.php"][href*="section="]');
        });
    }

    function buildOnetopicMap() {
        var map = {
            levelBySection: {},
            parentByChild: {},
            firstChildByParent: {},
            hrefBySection: {},
            labelBySection: {}
        };

        var currentByLevel = {};

        getOnetopicTabItems().forEach(function (tabItem) {
            var link = tabItem.querySelector(
                'a[href*="/course/view.php"][href*="section="]'
            );

            var match = tabItem.className.match(/tab_level_(\d+)/);
            var sectionNumber = getSectionNumberFromUrl(link.href);

            if (!match || !sectionNumber) {
                return;
            }

            var level = parseInt(match[1], 10);

            map.levelBySection[sectionNumber] = level;
            map.hrefBySection[sectionNumber] = link.href;
            map.labelBySection[sectionNumber] = cleanText(link.textContent);

            if (level === 0) {
                currentByLevel = {};
                currentByLevel[0] = sectionNumber;
                return;
            }

            var parentSection = currentByLevel[level - 1] || currentByLevel[0];

            if (parentSection) {
                map.parentByChild[sectionNumber] = parentSection;

                if (!map.firstChildByParent[parentSection]) {
                    map.firstChildByParent[parentSection] = sectionNumber;
                }
            }

            currentByLevel[level] = sectionNumber;

            Object.keys(currentByLevel).forEach(function (storedLevel) {
                if (parseInt(storedLevel, 10) > level) {
                    delete currentByLevel[storedLevel];
                }
            });
        });

        return map;
    }

    function markOnetopicLevels() {
        var map = buildOnetopicMap();

        Object.keys(map.levelBySection).forEach(function (sectionNumber) {
            var level = map.levelBySection[sectionNumber];
            var sectionElement = getCourseIndexSection(sectionNumber);

            if (!sectionElement) {
                return;
            }

            sectionElement.classList.add('glu-onetopic-tab-level-' + level);

            if (level > 0) {
                sectionElement.classList.add('glu-onetopic-child-tab');
            } else {
                sectionElement.classList.add('glu-onetopic-parent-tab');
            }
        });
    }

    function moveChildTabsInsideParents() {
        var map = buildOnetopicMap();

        Object.keys(map.parentByChild).forEach(function (childSectionNumber) {
            var parentSectionNumber = map.parentByChild[childSectionNumber];

            var parentSection = getCourseIndexSection(parentSectionNumber);
            var childSection = getCourseIndexSection(childSectionNumber);

            if (!parentSection || !childSection) {
                return;
            }

            if (parentSection.contains(childSection)) {
                return;
            }

            var parentContent = getCollapseContent(parentSection);

            if (!parentContent) {
                return;
            }

            var wrapper = Array.from(parentContent.children).find(function (child) {
                return child.classList.contains('glu-onetopic-child-tabs-wrapper');
            });

            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'glu-onetopic-child-tabs-wrapper';
                parentContent.insertBefore(wrapper, parentContent.firstChild);
            }

            childSection.classList.add('glu-onetopic-child-tab-moved');
            wrapper.appendChild(childSection);
        });
    }

    function prepareCourseIndexParentLinks() {
        var map = buildOnetopicMap();

        Object.keys(map.firstChildByParent).forEach(function (parentSectionNumber) {
            var firstChildSectionNumber = map.firstChildByParent[parentSectionNumber];

            var parentSection = getCourseIndexSection(parentSectionNumber);
            var parentLink = getOwnSectionLink(parentSection);

            var targetHref = map.hrefBySection[firstChildSectionNumber];
            var targetLabel = map.labelBySection[firstChildSectionNumber];

            if (!parentLink || !targetHref) {
                return;
            }

            parentLink.dataset.gluTargetHref = targetHref;
            parentLink.classList.add('glu-courseindex-parent-redirect');

            if (targetLabel) {
                parentLink.setAttribute('title', 'Go to first child tab: ' + targetLabel);
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

    function applyCourseIndexFixes() {
        markOnetopicLevels();
        moveChildTabsInsideParents();
        prepareCourseIndexParentLinks();
    }

    renameSectionNavigation();
    applyCourseIndexFixes();

    window.setTimeout(applyCourseIndexFixes, 500);

    courseIndex.addEventListener('click', handleCourseIndexClick, true);
});