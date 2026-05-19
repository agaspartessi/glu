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

    function getDirectContent(sectionElement) {
        if (!sectionElement) {
            return null;
        }

        var children = Array.from(sectionElement.children);

        var directContent = children.find(function (child) {
            return child.classList.contains('courseindex-item-content') ||
                child.classList.contains('courseindex-sectioncontent') ||
                child.classList.contains('collapse') ||
                (child.id && child.id.indexOf('courseindexcollapse') === 0);
        });

        if (directContent) {
            return directContent;
        }

        var ownItem = getOwnCourseIndexItem(sectionElement);

        if (!ownItem) {
            return null;
        }

        var toggle = ownItem.querySelector('[aria-controls], [aria-owns], a[href^="#courseindexcollapse"]');
        var collapseId = null;

        if (toggle) {
            collapseId =
                toggle.getAttribute('aria-controls') ||
                toggle.getAttribute('aria-owns') ||
                (toggle.getAttribute('href') || '').replace('#', '');
        }

        if (!collapseId) {
            return null;
        }

        var content = document.getElementById(collapseId);

        if (!content) {
            return null;
        }

        if (content.closest('.courseindex-section[data-number]') !== sectionElement) {
            return null;
        }

        return content;
    }

    function getNearestParentCourseIndexSection(element) {
        var parent = element.parentElement;

        while (parent && parent !== courseIndex) {
            if (parent.classList && parent.classList.contains('courseindex-section')) {
                return parent;
            }

            parent = parent.parentElement;
        }

        return null;
    }

    function getFirstDirectSubsection(sectionElement) {
        var content = getDirectContent(sectionElement);

        if (!content) {
            return null;
        }

        var candidates = Array.from(
            content.querySelectorAll('.courseindex-section[data-number]')
        );

        var directSubsections = candidates.filter(function (candidate) {
            return getNearestParentCourseIndexSection(candidate) === sectionElement;
        });

        return directSubsections.length ? directSubsections[0] : null;
    }

    function getRedirectTargetForSection(sectionElement) {
        var ownLink = getOwnSectionLink(sectionElement);
        var firstSubsection = getFirstDirectSubsection(sectionElement);

        if (!ownLink || !firstSubsection) {
            return null;
        }

        var firstSubsectionLink = getOwnSectionLink(firstSubsection);

        if (!firstSubsectionLink) {
            return null;
        }

        var ownSectionNumber = getSectionNumberFromUrl(ownLink.href);
        var targetSectionNumber = getSectionNumberFromUrl(firstSubsectionLink.href);

        if (!ownSectionNumber || !targetSectionNumber) {
            return null;
        }

        if (ownSectionNumber === targetSectionNumber) {
            return null;
        }

        return firstSubsectionLink.href;
    }

    function prepareCourseIndexParentLinks() {
        var sections = courseIndex.querySelectorAll('.courseindex-section[data-number]');

        sections.forEach(function (sectionElement) {
            var ownLink = getOwnSectionLink(sectionElement);
            var targetHref = getRedirectTargetForSection(sectionElement);

            if (!ownLink || !targetHref) {
                return;
            }

            ownLink.dataset.gluTargetHref = targetHref;
            ownLink.classList.add('glu-courseindex-parent-redirect');
            ownLink.setAttribute('title', 'Go to first subsection');
        });
    }

    function handleCourseIndexClick(event) {
        var link = event.target.closest(
            '.courseindex a.courseindex-link[href*="/course/view.php"][href*="section="]'
        );

        if (!link) {
            return;
        }

        var sectionElement = link.closest('.courseindex-section[data-number]');

        if (!sectionElement) {
            return;
        }

        /*
         * Importante:
         * solo actúa cuando el clic es sobre el link propio de la sección padre.
         * No toca actividades, recursos ni subsections internas.
         */
        var ownLink = getOwnSectionLink(sectionElement);

        if (link !== ownLink) {
            return;
        }

        var targetHref = getRedirectTargetForSection(sectionElement);

        if (!targetHref) {
            return;
        }

        event.preventDefault();
        window.location.href = targetHref;
    }

    renameSectionNavigation();
    prepareCourseIndexParentLinks();

    // Segunda pasada liviana por si el índice terminó de renderizar unos ms después.
    window.setTimeout(prepareCourseIndexParentLinks, 500);

    courseIndex.addEventListener('click', handleCourseIndexClick, true);
});