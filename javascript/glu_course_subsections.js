document.addEventListener('DOMContentLoaded', function () {
    if (document.body.id !== 'page-course-view-onetopic') {
        return;
    }

    /*
     * Subsections / delegated sections.
     * Estructura real observada:
     * li.section.course-section.main.clearfix.delegated-section
     *   div.section-item
     *     div.course-section-header
     *     div.content#coursecontentcollapse...
     */
    var subsections = Array.from(document.querySelectorAll(
        'body#page-course-view-onetopic li.course-section.delegated-section, ' +
        'body#page-course-view-onetopic .course-section.delegated-section'
    ));

    subsections.forEach(function (section) {
        if (section.dataset.gluSubsectionReady === '1') {
            return;
        }

        var sectionItem = section.querySelector(':scope > .section-item');
        if (!sectionItem) {
            return;
        }

        var header =
            sectionItem.querySelector(':scope > .course-section-header') ||
            sectionItem.querySelector(':scope > .sectionname') ||
            sectionItem.querySelector(':scope > h3, :scope > h4');

        var content =
            sectionItem.querySelector(':scope > .content[id^="coursecontentcollapse"]') ||
            sectionItem.querySelector(':scope > .content');

        if (!header || !content) {
            return;
        }

        section.dataset.gluSubsectionReady = '1';

        section.classList.add('glu-subsection-tab');
        header.classList.add('glu-subsection-tab__header');
        content.classList.add('glu-subsection-tab__content');

        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');

        function toggleSubsection(event) {
            if (
                event &&
                event.target.closest(
                    'button, input, select, textarea, .dropdown, .dropdown-menu, .action-menu, [data-toggle], [data-bs-toggle], .editing_move, .commands'
                )
            ) {
                return;
            }

            var isOpen = section.classList.toggle('glu-subsection-is-open');
            header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }

        header.addEventListener('click', toggleSubsection);

        header.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleSubsection(event);
            }
        });
    });
});