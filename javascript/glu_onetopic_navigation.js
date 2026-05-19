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

    function renameSectionNavigation() {
        var previousLinks = document.querySelectorAll('.section-navigation .prevsection a');
        var nextLinks = document.querySelectorAll('.section-navigation .nextsection a');

        previousLinks.forEach(function (link) {
            link.textContent = 'Previous Unit';
            link.setAttribute('title', 'Previous Unit');
            link.setAttribute('aria-label', 'Previous Unit');
            link.classList.add('glu-unit-navigation-link');
        });

        nextLinks.forEach(function (link) {
            link.textContent = 'Next Unit';
            link.setAttribute('title', 'Next Unit');
            link.setAttribute('aria-label', 'Next Unit');
            link.classList.add('glu-unit-navigation-link');
        });
    }

    renameSectionNavigation();

    // Por si Moodle / OneTopic vuelve a renderizar parte del contenido.
    var observer = new MutationObserver(function () {
        renameSectionNavigation();
    });

    var main = document.querySelector('#region-main');

    if (main) {
        observer.observe(main, {
            childList: true,
            subtree: true
        });
    }
});