document.addEventListener('DOMContentLoaded', function () {
    if (document.body.id !== 'page-course-view-onetopic') {
        return;
    }

    const subsectionSelectors = [
        '.activity.subsection .course-section.delegated-section',
        '.activity.subsection li.section.course-section',
        '.modtype_subsection .course-section.delegated-section',
        '.modtype_subsection li.section.course-section'
    ];

    const subsections = Array.from(
        document.querySelectorAll(subsectionSelectors.join(', '))
    ).filter(function (section) {
        return !section.classList.contains('glu-subsection-tab');
    });

    subsections.forEach(function (section) {
        const header =
            section.querySelector(':scope > .section-item') ||
            section.querySelector(':scope > .content > .sectionname') ||
            section.querySelector(':scope .sectionname') ||
            section.querySelector(':scope h3, :scope h4');

        if (!header) {
            return;
        }

        section.classList.add('glu-subsection-tab');

        header.classList.add('glu-subsection-tab__header');
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');

        const content = document.createElement('div');
        content.className = 'glu-subsection-tab__content';

        while (header.nextSibling) {
            content.appendChild(header.nextSibling);
        }

        section.appendChild(content);

        const toggle = function (event) {
            if (
                event &&
                event.target.closest(
                    'a, button, input, select, textarea, .dropdown, .dropdown-menu, .action-menu, [data-toggle], [data-bs-toggle]'
                )
            ) {
                return;
            }

            const isOpen = section.classList.toggle('glu-subsection-is-open');
            header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        header.addEventListener('click', toggle);

        header.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle(event);
            }
        });
    });
});