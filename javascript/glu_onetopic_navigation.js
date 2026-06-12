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

    function getCombinedLinkText(link) {
        return cleanText(
            (link.textContent || '') + ' ' +
            (link.getAttribute('title') || '') + ' ' +
            (link.getAttribute('aria-label') || '') + ' ' +
            (link.id || '') + ' ' +
            (link.className || '')
        ).toLowerCase();
    }

    function isPreviousLink(link) {
        if (link.dataset.gluUnitNavigation === 'previous') {
            return true;
        }

        var text = getCombinedLinkText(link);
        var parent = link.closest(
            '.prevsection, .activityprev, .previous, .prev, [class*="prev"], [id*="prev"]'
        );

        return (
            text.indexOf('previous') !== -1 ||
            text.indexOf('prev') !== -1 ||
            parent !== null
        );
    }

    function isNextLink(link) {
        if (link.dataset.gluUnitNavigation === 'next') {
            return true;
        }

        var text = getCombinedLinkText(link);
        var parent = link.closest(
            '.nextsection, .activitynext, .next, [class*="next"], [id*="next"]'
        );

        return (
            text.indexOf('next') !== -1 ||
            parent !== null
        );
    }

    function setLinkText(link, text, type) {
        if (!link) {
            return;
        }

        link.innerHTML = '';

        var label = document.createElement('span');
        label.className = 'glu-unit-navigation-label';
        label.textContent = text;

        link.appendChild(label);

        /*
         * Sacamos title para evitar el tooltip nativo del navegador,
         * que aparecía como un cuadrito duplicado debajo del botón.
         */
        link.removeAttribute('title');

        link.setAttribute('aria-label', text);
        link.dataset.gluUnitNavigation = type;

        link.classList.add('glu-unit-navigation-link');

        if (type === 'previous') {
            link.classList.add('glu-unit-navigation-link--previous');
        }

        if (type === 'next') {
            link.classList.add('glu-unit-navigation-link--next');
        }
    }

    function normalizeLinkGroup(links, text, type) {
        if (!links.length) {
            return;
        }

        links.forEach(function (link, index) {
            if (index === 0) {
                link.classList.remove('glu-unit-navigation-extra');
                link.removeAttribute('aria-hidden');
                link.removeAttribute('tabindex');
                setLinkText(link, text, type);
            } else {
                link.classList.add('glu-unit-navigation-extra');
                link.setAttribute('aria-hidden', 'true');
                link.setAttribute('tabindex', '-1');
            }
        });
    }

    function renameCourseSectionNavigation() {
        var previousLinks = Array.from(document.querySelectorAll(
            '.section-navigation .prevsection a, ' +
            '.section-navigation .prevsection > a'
        ));

        var nextLinks = Array.from(document.querySelectorAll(
            '.section-navigation .nextsection a, ' +
            '.section-navigation .nextsection > a'
        ));

        previousLinks.forEach(function (link) {
            setLinkText(link, 'Previous Unit', 'previous');
        });

        nextLinks.forEach(function (link) {
            setLinkText(link, 'Next Unit', 'next');
        });
    }

    function renameModuleActivityNavigation() {
        var navigationAreas = document.querySelectorAll('.activity-navigation');

        navigationAreas.forEach(function (nav) {
            var links = Array.from(nav.querySelectorAll('a'));

            var previousLinks = links.filter(function (link) {
                return isPreviousLink(link);
            });

            var nextLinks = links.filter(function (link) {
                return isNextLink(link);
            });

            normalizeLinkGroup(previousLinks, 'Previous Unit', 'previous');
            normalizeLinkGroup(nextLinks, 'Next Unit', 'next');
        });
    }

    function applyNavigationLabels() {
        renameCourseSectionNavigation();
        renameModuleActivityNavigation();
    }

    applyNavigationLabels();

    // Por si Moodle termina de renderizar la navegación después.
    window.setTimeout(applyNavigationLabels, 500);
    window.setTimeout(applyNavigationLabels, 1200);
});