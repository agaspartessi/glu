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

    function setUnitNavigationLink(link, text, type) {
        if (!link) {
            return;
        }

        link.innerHTML = '';

        var label = document.createElement('span');
        label.className = 'glu-unit-navigation-label';
        label.textContent = text;

        link.appendChild(label);

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
            return;
        }

        var navigations = document.querySelectorAll('.activity-navigation');

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

            if (jumpColumn && columns.length >= 3) {
                previousColumn = columns[0];
                nextColumn = columns[columns.length - 1];
            }

            previousColumn.classList.add('glu-activity-navigation-previous');
            nextColumn.classList.add('glu-activity-navigation-next');

            var previousLinks = Array.from(previousColumn.querySelectorAll('a[href]'));
            var nextLinks = Array.from(nextColumn.querySelectorAll('a[href]'));

            if (previousLinks.length) {
                setUnitNavigationLink(previousLinks[0], 'Previous Unit', 'previous');
                hideExtraLinks(previousLinks.slice(1));
            }

            if (nextLinks.length) {
                setUnitNavigationLink(nextLinks[0], 'Next Unit', 'next');
                hideExtraLinks(nextLinks.slice(1));
            }
        });
    }

    function applyNavigation() {
        renameCourseSectionNavigation();
        normalizeModuleActivityNavigation();
    }

    applyNavigation();

    window.setTimeout(applyNavigation, 500);
    window.setTimeout(applyNavigation, 1200);
});