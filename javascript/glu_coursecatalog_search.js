(function () {
    var catalogPath = '/local/coursecatalog/view.php';

    function normalizeCatalogUrl(rawUrl) {
        var url;

        try {
            url = new URL(rawUrl, window.location.origin);
        } catch (error) {
            return rawUrl;
        }

        if (url.pathname.indexOf(catalogPath) === -1) {
            return rawUrl;
        }

        if (url.searchParams.get('slug') !== 'courses') {
            return rawUrl;
        }

        url.searchParams.set('perpage', '100');

        if (!url.searchParams.get('sort')) {
            url.searchParams.set('sort', 'name_asc');
        }

        if (!url.searchParams.get('view')) {
            url.searchParams.set('view', 'grid');
        }

        return url.toString();
    }

    // Si estoy en Course Catalog sin perpage=100, redirijo.
    if (window.location.pathname.indexOf(catalogPath) !== -1) {
        var currentUrl = new URL(window.location.href);

        if (
            currentUrl.searchParams.get('slug') === 'courses' &&
            currentUrl.searchParams.get('perpage') !== '100'
        ) {
            window.location.replace(normalizeCatalogUrl(window.location.href));
            return;
        }
    }

    // Reescribo links del menú/nav para que apunten directo a la URL completa.
    document.addEventListener('DOMContentLoaded', function () {
        var links = document.querySelectorAll('a[href*="/local/coursecatalog/view.php"][href*="slug=courses"]');

        links.forEach(function (link) {
            link.href = normalizeCatalogUrl(link.href);
        });
    });
})();

document.addEventListener('DOMContentLoaded', function () {
    var isCatalogPage =
        window.location.pathname.indexOf('/local/coursecatalog/view.php') !== -1 ||
        document.body.classList.contains('path-local-coursecatalog') ||
        document.body.id.indexOf('page-local-coursecatalog') !== -1;

    if (!isCatalogPage) {
        return;
    }

    document.body.classList.add('glu-coursecatalog-page');

    var main = document.querySelector('#region-main');

    if (!main || document.querySelector('.glu-catalog-search')) {
        return;
    }

    function getCourseCards() {
        return Array.from(main.querySelectorAll('.card')).filter(function (card) {
            return card.querySelector('.stretched-link');
        });
    }

    function getCardWrapper(card) {
        var parentCol = card.parentElement && card.parentElement.classList.contains('col')
            ? card.parentElement
            : null;

        return parentCol || card;
    }

    function normalize(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    function prepareCards() {
        var cards = getCourseCards();

        cards.forEach(function (card) {
            card.classList.add('glu-catalog-card');

            var buttons = card.querySelectorAll('.btn');

            buttons.forEach(function (button) {
                button.textContent = 'View course →';
                button.classList.add('glu-catalog-card__button');
            });
        });
    }

    var searchBlock = document.createElement('div');
    searchBlock.className = 'glu-catalog-search';

    searchBlock.innerHTML =
        '<p class="glu-catalog-search__eyebrow">Browse our academic catalog</p>' +
        '<form class="glu-catalog-search__form" role="search">' +
        '<input ' +
        'class="glu-catalog-search__input" ' +
        'type="search" ' +
        'placeholder="Search courses..." ' +
        'aria-label="Search courses">' +
        '<button ' +
        'class="glu-catalog-search__button" ' +
        'type="submit" ' +
        'aria-label="Search courses">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="M21 20.3 16.7 16a8 8 0 1 0-1.4 1.4l4.3 4.3 1.4-1.4ZM5 11a6 6 0 1 1 12 0A6 6 0 0 1 5 11Z"></path>' +
        '</svg>' +
        '</button>' +
        '</form>' +
        '<p class="glu-catalog-search__status" aria-live="polite"></p>';

    var title = main.querySelector('h1');

    if (title) {
        title.insertAdjacentElement('afterend', searchBlock);
    } else {
        main.prepend(searchBlock);
    }

    var input = searchBlock.querySelector('.glu-catalog-search__input');
    var form = searchBlock.querySelector('.glu-catalog-search__form');
    var status = searchBlock.querySelector('.glu-catalog-search__status');

    function filterCourses() {
        var query = normalize(input.value);
        var cards = getCourseCards();
        var visible = 0;

        cards.forEach(function (card) {
            var titleText = card.querySelector('.card-title')
                ? card.querySelector('.card-title').textContent
                : '';

            var description = card.querySelector('.card-text')
                ? card.querySelector('.card-text').textContent
                : '';

            var imageAlt = card.querySelector('img')
                ? card.querySelector('img').getAttribute('alt')
                : '';

            var allText = normalize(titleText + ' ' + description + ' ' + imageAlt);
            var match = !query || allText.indexOf(query) !== -1;

            var wrapper = getCardWrapper(card);
            wrapper.style.display = match ? '' : 'none';

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
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        filterCourses();
    });

    input.addEventListener('input', filterCourses);

    prepareCards();
});