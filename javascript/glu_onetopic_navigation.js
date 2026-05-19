document.addEventListener('DOMContentLoaded', function () {
    var isCoursePage =
        document.body.id.indexOf('page-course-view') !== -1 ||
        document.body.classList.contains('path-course-view');

    var isOnetopic =
        document.body.classList.contains('format-onetopic') ||
        document.querySelector('.format-onetopic') ||
        document.querySelector('.section-navigation');

    if (!isCoursePage || !isOnetopic) {
        return;
    }

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

    renameSectionNavigation();
});