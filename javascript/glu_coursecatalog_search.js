document.addEventListener('DOMContentLoaded', function () {
    const isCatalogPage =
        window.location.pathname.includes('/local/coursecatalog/view.php') ||
        document.body.classList.contains('path-local-coursecatalog') ||
        document.body.id.includes('page-local-coursecatalog');

    if (!isCatalogPage) {
        return;
    }

    const main = document.querySelector('#region-main');

    if (!main || document.querySelector('.glu-catalog-search')) {
        return;
    }

    /*
     * Selectores reales del plugin local_coursecatalog.
     * Según el inspector:
     * - cada curso está dentro de un .col
     * - adentro tiene .card
     * - el link principal usa .stretched-link
     */
    const getCourseItems = function () {
        return Array.from(main.querySelectorAll('.row > .col')).filter(function (item) {
            const card = item.querySelector('.card');
            const courseLink = item.querySelector('.card .stretched-link');

            return card && courseLink;
        });
    };

    const firstControlsRow = main.querySelector('.d-flex, .row');

    const searchBlock = document.createElement('div');
    searchBlock.className = 'glu-catalog-search';

    searchBlock.innerHTML = `
        <p class="glu-catalog-search__eyebrow">Browse our academic catalog</p>

        <form class="glu-catalog-search__form" role="search">
            <input
                class="glu-catalog-search__input"
                type="search"
                placeholder="Search courses..."
                aria-label="Search courses">

            <button
                class="glu-catalog-search__button"
                type="submit"
                aria-label="Search courses">
                🔍
            </button>
        </form>

        <p class="glu-catalog-search__status" aria-live="polite"></p>
    `;

    const title = main.querySelector('h1');

    if (title) {
        title.insertAdjacentElement('afterend', searchBlock);
    } else {
        main.prepend(searchBlock);
    }

    const input = searchBlock.querySelector('.glu-catalog-search__input');
    const form = searchBlock.querySelector('.glu-catalog-search__form');
    const status = searchBlock.querySelector('.glu-catalog-search__status');

    const normalize = function (text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    };

    const filterCourses = function () {
        const query = normalize(input.value);
        const courseItems = getCourseItems();

        let visible = 0;

        courseItems.forEach(function (item) {
            const title = item.querySelector('.card-title')?.textContent || '';
            const description = item.querySelector('.card-text')?.textContent || '';
            const allText = normalize(title + ' ' + description);

            const match = !query || allText.includes(query);

            item.style.display = match ? '' : 'none';

            if (match) {
                visible++;
            }
        });

        if (query) {
            status.textContent = visible === 1
                ? '1 course found'
                : visible + ' courses found';
        } else {
            status.textContent = '';
        }
    };

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        filterCourses();
    });

    input.addEventListener('input', filterCourses);
});