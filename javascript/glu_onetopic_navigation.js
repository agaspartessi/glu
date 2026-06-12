document.addEventListener('DOMContentLoaded', function () {
    var isCourseOrModulePage =
        document.body.id.indexOf('page-course-view') !== -1 ||
        document.body.classList.contains('path-course-view') ||
        document.body.id.indexOf('page-mod-') === 0 ||
        Array.from(document.body.classList).some(function (className) {
            return className.indexOf('path-mod-') === 0;
        });

    if (!isCourseOrModulePage) {
        return;
    }

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function setLinkText(link, text) {
        if (!link) {
            return;
        }

        link.textContent = text;
        link.setAttribute('title', text);
        link.setAttribute('aria-label', text);
        link.classList.add('glu-unit-navigation-link');
    }

    function isPreviousLink(link) {
        var text = cleanText(
            link.textContent + ' ' +
            (link.getAttribute('title') || '') + ' ' +
            (link.getAttribute('aria-label') || '')
        ).toLowerCase();

        return (
            text.indexOf('previous') !== -1 ||
            text.indexOf('prev') !== -1
        );
    }

    function isNextLink(link) {
        var text = cleanText(
            link.textContent + ' ' +
            (link.getAttribute('title') || '') + ' ' +
            (link.getAttribute('aria-label') || '')
        ).toLowerCase();

        return text.indexOf('next') !== -1;
    }

    function renameSectionNavigation() {
        var previousLinks = document.querySelectorAll(
            '.section-navigation .prevsection a, ' +
            '.section-navigation .prevsection > a'
        );

        var nextLinks = document.querySelectorAll(
            '.section-navigation .nextsection a, ' +
            '.section-navigation .nextsection > a'
        );

        previousLinks.forEach(function (link) {
            setLinkText(link, 'Previous Unit');
        });

        nextLinks.forEach(function (link) {
            setLinkText(link, 'Next Unit');
        });
    }

    function renameActivityNavigation() {
        var navigationAreas = document.querySelectorAll(
            '.activity-navigation, ' +
            '.section-navigation'
        );

        navigationAreas.forEach(function (nav) {
            var links = nav.querySelectorAll('a');

            links.forEach(function (link) {
                if (isPreviousLink(link)) {
                    setLinkText(link, 'Previous Unit');
                }

                if (isNextLink(link)) {
                    setLinkText(link, 'Next Unit');
                }
            });
        });
    }

    function applyNavigationLabels() {
        renameSectionNavigation();
        renameActivityNavigation();
    }

    applyNavigationLabels();

    // Por si Moodle termina de renderizar navegación después.
    window.setTimeout(applyNavigationLabels, 500);
    window.setTimeout(applyNavigationLabels, 1200);
});