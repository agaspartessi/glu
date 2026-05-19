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

    function getCollapseContent(parentSection) {
        var parentTitle = parentSection.querySelector(
            '.courseindex-section-title, [data-for="section_title"]'
        );

        if (!parentTitle) {
            return null;
        }

        var collapseId = parentTitle.getAttribute('aria-owns');

        if (collapseId) {
            return document.getElementById(collapseId);
        }

        return parentSection.querySelector(
            '.courseindex-item-content, .courseindex-sectioncontent, .collapse'
        );
    }

    function getParentSectionLink(parentSection) {
        return parentSection.querySelector(
            ':scope > .courseindex-item .courseindex-section-title a.courseindex-link[href*="/course/view.php"][href*="section="], ' +
            ':scope > .courseindex-item [data-for="section_title"] a.courseindex-link[href*="/course/view.php"][href*="section="], ' +
            ':scope > .courseindex-section-title a.courseindex-link[href*="/course/view.php"][href*="section="], ' +
            ':scope > [data-for="section_title"] a.courseindex-link[href*="/course/view.php"][href*="section="]'
        );
    }

    function getFirstSubsectionLink(parentSection) {
        var content = getCollapseContent(parentSection);

        if (!content) {
            return null;
        }

        /*
         * Busca la primera subsection real dentro del Course Index.
         * No toma actividades ni recursos: solo links de secciones/subsecciones.
         */
        var subsectionLinks = content.querySelectorAll(
            '.courseindex-section[data-number] .courseindex-section-title a.courseindex-link[href*="/course/view.php"][href*="section="], ' +
            '.courseindex-section[data-number] [data-for="section_title"] a.courseindex-link[href*="/course/view.php"][href*="section="]'
        );

        if (!subsectionLinks.length) {
            return null;
        }

        return subsectionLinks[0];
    }

    function buildCourseIndexTargets() {
        var targets = {};

        var parentSections = courseIndex.querySelectorAll(
            '.courseindex-section[data-number]'
        );

        parentSections.forEach(function (parentSection) {
            var parentNumber = parentSection.getAttribute('data-number');

            if (!parentNumber || parentNumber === '0') {
                return;
            }

            var parentLink = getParentSectionLink(parentSection);
            var firstSubsectionLink = getFirstSubsectionLink(parentSection);

            if (!parentLink || !firstSubsectionLink) {
                return;
            }

            var parentSectionNumber = getSectionNumberFromUrl(parentLink.href);
            var firstSubsectionNumber = getSectionNumberFromUrl(firstSubsectionLink.href);

            if (!parentSectionNumber || !firstSubsectionNumber) {
                return;
            }

            if (parentSectionNumber === firstSubsectionNumber) {
                return;
            }

            targets[parentSectionNumber] = firstSubsectionLink.href;
        });

        return targets;
    }

    function rewriteCourseIndexParentLinks() {
        var targets = buildCourseIndexTargets();

        Object.keys(targets).forEach(function (sectionNumber) {
            var parentLinks = courseIndex.querySelectorAll(
                '.courseindex-section-title a.courseindex-link[href*="/course/view.php"][href*="section=' + sectionNumber + '"], ' +
                '[data-for="section_title"] a.courseindex-link[href*="/course/view.php"][href*="section=' + sectionNumber + '"]'
            );

            parentLinks.forEach(function (link) {
                if (!link.dataset.gluOriginalHref) {
                    link.dataset.gluOriginalHref = link.href;
                }

                link.dataset.gluTargetHref = targets[sectionNumber];
                link.href = targets[sectionNumber];
                link.classList.add('glu-courseindex-parent-redirect');
            });
        });
    }

    function handleCourseIndexParentClick(event) {
        var link = event.target.closest(
            '.courseindex .courseindex-section-title a.courseindex-link, ' +
            '.courseindex [data-for="section_title"] a.courseindex-link'
        );

        if (!link || !link.dataset.gluTargetHref) {
            return;
        }

        event.preventDefault();
        window.location.href = link.dataset.gluTargetHref;
    }

    renameSectionNavigation();
    rewriteCourseIndexParentLinks();

    /*
     * Corre una segunda vez por si Moodle terminó de renderizar
     * el Course Index unos milisegundos después.
     * No usamos MutationObserver para evitar ralentización.
     */
    window.setTimeout(rewriteCourseIndexParentLinks, 500);

    document.addEventListener('click', handleCourseIndexParentClick, true);
});