document.addEventListener('DOMContentLoaded', function () {
    var isCatalogPage =
        window.location.pathname.indexOf('/local/coursecatalog/view.php') !== -1 ||
        document.body.classList.contains('path-local-coursecatalog') ||
        document.body.id.indexOf('page-local-coursecatalog') !== -1;

    if (!isCatalogPage) {
        return;
    }

    document.body.classList.add('glu-coursecatalog-page');

    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    var params = new URLSearchParams(window.location.search);

    // Fuerza perpage=100 para que no pagine al navegar por tabs o desde el menú.
    if (params.get('perpage') !== '100') {
        params.set('perpage', '100');

        if (!params.get('sort')) {
            params.set('sort', 'name_asc');
        }

        if (!params.get('view')) {
            params.set('view', 'grid');
        }

        window.location.replace(window.location.pathname + '?' + params.toString());
        return;
    }

    var main = document.querySelector('#region-main');

    if (!main) {
        return;
    }

    var catalogTabs = [
        { label: 'All courses', slug: 'courses' },
        { label: 'Worker rights', slug: 'workerrights' },
        { label: 'Global supply chains', slug: 'globalsupplychains' },
        { label: 'Labour history', slug: 'labourhistory' },
        { label: 'Public services', slug: 'publicservices' },
        { label: 'Labour and environment', slug: 'labourandenvironment' },
        { label: 'Wages', slug: 'wages' },
        { label: 'Collective bargaining', slug: 'collectivebargaining' },
        { label: 'Labour and development', slug: 'labouranddevelopment' },
        { label: 'Informal employment', slug: 'informalemployment' },
        { label: 'Union transformation', slug: 'uniontransformation' }
    ];

    function getCurrentSlug() {
        return params.get('slug') || 'courses';
    }

    function buildCatalogUrl(slug) {
        var urlParams = new URLSearchParams(window.location.search);

        urlParams.set('slug', slug);
        urlParams.set('perpage', '100');

        if (!urlParams.get('sort')) {
            urlParams.set('sort', 'name_asc');
        }

        if (!urlParams.get('view')) {
            urlParams.set('view', 'grid');
        }

        return wwwroot + '/local/coursecatalog/view.php?' + urlParams.toString();
    }

    function renderCategoryTabs() {
        if (document.querySelector('.glu-catalog-tabs')) {
            return;
        }

        var currentSlug = getCurrentSlug();

        var tabsWrapper = document.createElement('nav');
        tabsWrapper.className = 'glu-catalog-tabs';
        tabsWrapper.setAttribute('aria-label', 'Course categories');

        var tabsList = document.createElement('div');
        tabsList.className = 'glu-catalog-tabs__list';

        catalogTabs.forEach(function (tab) {
            var link = document.createElement('a');

            link.className = 'glu-catalog-tabs__link';
            link.href = buildCatalogUrl(tab.slug);
            link.textContent = tab.label;

            if (tab.slug === currentSlug) {
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'page');
            }

            tabsList.appendChild(link);
        });

        tabsWrapper.appendChild(tabsList);

        var title = main.querySelector('h1');

        if (title) {
            title.insertAdjacentElement('afterend', tabsWrapper);
        } else {
            main.prepend(tabsWrapper);
        }
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

    function renderSearch() {
        if (document.querySelector('.glu-catalog-search')) {
            return;
        }

        var searchBlock = document.createElement('div');
        searchBlock.className = 'glu-catalog-search';

        searchBlock.innerHTML =
            '<p class="glu-catalog-search__eyebrow">Browse all courses</p>' +
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

        var tabs = main.querySelector('.glu-catalog-tabs');

        if (tabs) {
            tabs.insertAdjacentElement('afterend', searchBlock);
        } else {
            var title = main.querySelector('h1');

            if (title) {
                title.insertAdjacentElement('afterend', searchBlock);
            } else {
                main.prepend(searchBlock);
            }
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
    }

    renderCategoryTabs();
    renderSearch();
    prepareCards();
});