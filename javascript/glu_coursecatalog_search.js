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

    // Fuerza perpage=100 también cuando se llega desde menú o tabs.
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
        { label: 'worker rights', slug: 'workerrights' },
        { label: 'global supply chains', slug: 'globalsupplychains' },
        { label: 'labour history', slug: 'labourhistory' },
        { label: 'public services', slug: 'publicservices' },
        { label: 'labour and environment', slug: 'labourandenvironment' },
        { label: 'wages', slug: 'wages' },
        { label: 'collective bargaining', slug: 'collectivebargaining' },
        { label: 'labour and development', slug: 'labouranddevelopment' },
        { label: 'informal employment', slug: 'informalemployment' },
        { label: 'union transformation', slug: 'uniontransformation' }
    ];

    catalogTabs.sort((a, b) => a.label.localeCompare(b.label));

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
        var isAllCourses = currentSlug === 'courses';

        var wrapper = document.createElement('div');
        wrapper.className = 'glu-catalog-navigation';

        var allCoursesBox = document.createElement('div');
        allCoursesBox.className = 'glu-catalog-allcourses';

        var allCoursesLink = document.createElement('a');
        allCoursesLink.className = 'glu-catalog-allcourses__link';
        allCoursesLink.href = buildCatalogUrl('courses');

        if (isAllCourses) {
            allCoursesLink.classList.add('is-active');
            allCoursesLink.setAttribute('aria-current', 'page');
            allCoursesLink.textContent = 'Viewing all';
        } else {
            allCoursesLink.textContent = '← Back to all courses';
        }

        allCoursesBox.appendChild(allCoursesLink);

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

        wrapper.appendChild(allCoursesBox);
        wrapper.appendChild(tabsWrapper);

        var title = main.querySelector('h1');

        if (title) {
            title.insertAdjacentElement('afterend', wrapper);
        } else {
            main.prepend(wrapper);
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

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function absoluteUrl(url) {
        if (!url) {
            return '';
        }

        try {
            return new URL(url, wwwroot).href;
        } catch (error) {
            return url;
        }
    }

    function getCourseIdFromCard(card) {
        var link = card.querySelector('.stretched-link');

        if (!link) {
            return null;
        }

        try {
            var url = new URL(link.getAttribute('href'), wwwroot);
            return url.searchParams.get('id');
        } catch (error) {
            return null;
        }
    }

    function looksLikeInitials(text) {
        var value = cleanText(text);

        // Evita tomar avatares con iniciales como si fueran docentes: GC, MD, GT, etc.
        return /^[A-ZÁÉÍÓÚÑ]{1,4}$/.test(value);
    }

    function normalizeLanguageText(text) {
        var value = cleanText(text);

        value = value.replace(/^course\s+language\s*:\s*/i, '');
        value = value.replace(/^language\s*:\s*/i, '');

        return cleanText(value);
    }

    function removeLanguageFromCardDescription(card, language) {
        if (!card || !language) {
            return;
        }

        var desc = card.querySelector('.card-text');

        if (!desc) {
            return;
        }

        var currentText = cleanText(desc.textContent);
        var cleanLanguage = cleanText(language);

        if (!currentText || !cleanLanguage) {
            return;
        }

        /*
         * El Course Catalog convierte el summary a texto plano.
         * Entonces:
         * <p class="glu-course-language-meta">English</p>
         * puede quedar visible como:
         * "English What is the course about?..."
         */
        var escapedLanguage = cleanLanguage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var pattern = new RegExp('^' + escapedLanguage + '\\s+', 'i');

        if (pattern.test(currentText)) {
            desc.textContent = currentText.replace(pattern, '');
        }
    }

    function uniqueTeachers(teachers) {
        var seen = {};
        var result = [];

        teachers.forEach(function (teacher) {
            var key = normalize(teacher.name);

            if (!key || seen[key]) {
                return;
            }

            seen[key] = true;
            result.push(teacher);
        });

        return result;
    }

    function extractTeachersFromDocument(doc) {
        var region = doc.querySelector('#region-main');

        if (!region) {
            return [];
        }

        /*
         * Primero intenta leer el bloque dinámico de Course Instructors
         * que ya se muestra en enrol/index.php.
         */
        var preferredSelectors = [
            '.glu-course-instructors a[href*="/user/view.php"]',
            '.glu-enrol-instructors a[href*="/user/view.php"]',
            '.glu-instructors a[href*="/user/view.php"]',
            '.course-instructors a[href*="/user/view.php"]',
            '.glu-course-team a[href*="/user/view.php"]',
            '.glu-enrol-trainer__name-link[href*="/user/view.php"]',
            '.glu-enrol-trainers a[href*="/user/view.php"]'
        ];

        var links = [];

        preferredSelectors.forEach(function (selector) {
            links = links.concat(Array.from(region.querySelectorAll(selector)));
        });

        /*
         * Fallback: si no encuentra por clase custom,
         * busca links a perfiles dentro del contenido principal.
         */
        if (!links.length) {
            links = Array.from(region.querySelectorAll('a[href*="/user/view.php"]'));
        }

        var teachers = links.map(function (link) {
            return {
                name: cleanText(link.textContent),
                url: absoluteUrl(link.getAttribute('href'))
            };
        }).filter(function (teacher) {
            return teacher.name &&
                teacher.name.length > 1 &&
                teacher.name.length < 80 &&
                teacher.name.toLowerCase() !== 'view profile' &&
                !looksLikeInitials(teacher.name);
        });

        return uniqueTeachers(teachers);
    }

    function extractLanguageFromDocument(doc) {
        var languageMeta = doc.querySelector('.glu-course-language-meta');

        if (!languageMeta) {
            return '';
        }

        return normalizeLanguageText(languageMeta.textContent);
    }

    function extractLanguageFromCard(card) {
        var languageMeta = card.querySelector('.glu-course-language-meta');

        if (!languageMeta) {
            return '';
        }

        return normalizeLanguageText(languageMeta.textContent);
    }

    function normalizePinOrder(value) {
        var order = parseInt(value, 10);

        if (isNaN(order) || order < 1) {
            return null;
        }

        return order;
    }

    function extractPinOrderFromDocument(doc) {
        var pinMeta = doc.querySelector('.glu-course-language-meta[data-glu-pin]');

        if (!pinMeta) {
            return null;
        }

        return normalizePinOrder(pinMeta.getAttribute('data-glu-pin'));
    }

    function extractPinOrderFromCard(card) {
        var pinMeta = card.querySelector('.glu-course-language-meta[data-glu-pin]');

        if (!pinMeta) {
            return null;
        }

        return normalizePinOrder(pinMeta.getAttribute('data-glu-pin'));
    }

    function renderTeachersInCard(card, teachers) {
        if (!teachers.length) {
            return;
        }

        card.dataset.gluInstructors = teachers.map(function (teacher) {
            return teacher.name;
        }).join(' ');

        var oldTeam = card.querySelector('.glu-catalog-card__team');

        if (oldTeam) {
            oldTeam.remove();
        }

        var team = document.createElement('p');
        team.className = 'glu-catalog-card__team';

        var label = document.createElement('span');
        label.className = 'glu-catalog-card__team-label';
        label.textContent = 'Course team: ';

        team.appendChild(label);

        teachers.forEach(function (teacher, index) {
            var link = document.createElement('a');
            link.href = teacher.url;
            link.textContent = teacher.name;

            team.appendChild(link);

            if (index < teachers.length - 1) {
                team.appendChild(document.createTextNode(', '));
            }
        });

        var title = card.querySelector('.card-title');
        var desc = card.querySelector('.card-text');
        var body = card.querySelector('.card-body');

        if (desc) {
            desc.insertAdjacentElement('beforebegin', team);
        } else if (title) {
            title.insertAdjacentElement('afterend', team);
        } else if (body) {
            body.prepend(team);
        }
    }

    function renderLanguageInCard(card, language) {
        if (!language) {
            return;
        }

        card.dataset.gluLanguage = language;

        removeLanguageFromCardDescription(card, language);

        var oldLanguage = card.querySelector('.glu-catalog-card__language');

        if (oldLanguage) {
            oldLanguage.remove();
        }

        var languageLine = document.createElement('p');
        languageLine.className = 'glu-catalog-card__language';

        var label = document.createElement('span');
        label.className = 'glu-catalog-card__language-label';
        label.textContent = 'Course language: ';

        var value = document.createElement('span');
        value.className = 'glu-catalog-card__language-value';
        value.textContent = language;

        languageLine.appendChild(label);
        languageLine.appendChild(value);

        var team = card.querySelector('.glu-catalog-card__team');
        var title = card.querySelector('.card-title');
        var desc = card.querySelector('.card-text');
        var body = card.querySelector('.card-body');

        if (team) {
            team.insertAdjacentElement('afterend', languageLine);
        } else if (desc) {
            desc.insertAdjacentElement('beforebegin', languageLine);
        } else if (title) {
            title.insertAdjacentElement('afterend', languageLine);
        } else if (body) {
            body.prepend(languageLine);
        }
    }

    function applyMetadataToCard(card, metadata) {
        metadata = metadata || {};

        var localLanguage = extractLanguageFromCard(card);
        var language = metadata.language || localLanguage || '';

        var localPinOrder = extractPinOrderFromCard(card);
        var pinOrder = normalizePinOrder(metadata.pinOrder) || localPinOrder;

        if (pinOrder) {
            card.dataset.gluPinOrder = String(pinOrder);
        } else {
            delete card.dataset.gluPinOrder;
        }

        if (metadata.teachers && metadata.teachers.length) {
            renderTeachersInCard(card, metadata.teachers);
        }

        if (language) {
            renderLanguageInCard(card, language);
        }
    }

    function extractMetadataFromEnrolPage(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');

        return {
            teachers: extractTeachersFromDocument(doc),
            language: extractLanguageFromDocument(doc),
            pinOrder: extractPinOrderFromDocument(doc)
        };
    }

    function loadMetadataForCard(card) {
        var courseId = getCourseIdFromCard(card);
        var localLanguage = extractLanguageFromCard(card);
        var localPinOrder = extractPinOrderFromCard(card);

        if (!courseId) {
            if (localPinOrder) {
                card.dataset.gluPinOrder = String(localPinOrder);
            }

            if (localLanguage) {
                renderLanguageInCard(card, localLanguage);
            }

            return Promise.resolve();
        }

        // v4 suma prioridad manual (data-glu-pin) además de Course language.
        var cacheKey = 'gluCatalogMetadata:v4:' + courseId;
        var cached = sessionStorage.getItem(cacheKey);

        if (cached) {
            try {
                var cachedMetadata = JSON.parse(cached);

                if (!cachedMetadata.language && localLanguage) {
                    cachedMetadata.language = localLanguage;
                }

                if (!cachedMetadata.pinOrder && localPinOrder) {
                    cachedMetadata.pinOrder = localPinOrder;
                }

                applyMetadataToCard(card, cachedMetadata);
                return Promise.resolve();
            } catch (error) {
                sessionStorage.removeItem(cacheKey);
            }
        }

        return fetch(wwwroot + '/enrol/index.php?id=' + encodeURIComponent(courseId), {
            credentials: 'same-origin'
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Could not load enrol page');
                }

                return response.text();
            })
            .then(function (html) {
                var metadata = extractMetadataFromEnrolPage(html);

                if (!metadata.language && localLanguage) {
                    metadata.language = localLanguage;
                }

                if (!metadata.pinOrder && localPinOrder) {
                    metadata.pinOrder = localPinOrder;
                }

                sessionStorage.setItem(cacheKey, JSON.stringify(metadata));
                applyMetadataToCard(card, metadata);
            })
            .catch(function () {
                if (localLanguage) {
                    renderLanguageInCard(card, localLanguage);
                }
            });
    }

    function loadMetadataInBatches(cards) {
        var index = 0;
        var active = 0;
        var maxConcurrent = 4;

        return new Promise(function (resolve) {
            function next() {
                if (index >= cards.length && active === 0) {
                    resolve();
                    return;
                }

                while (active < maxConcurrent && index < cards.length) {
                    var card = cards[index];

                    index++;
                    active++;

                    loadMetadataForCard(card)
                        .finally(function () {
                            active--;
                            next();
                        });
                }
            }

            next();
        });
    }

    function reorderPinnedCards(cards) {
        // La prioridad manual se aplica solo en la vista general de All courses.
        if (getCurrentSlug() !== 'courses') {
            return;
        }

        var items = cards.map(function (card, index) {
            var pinOrder = normalizePinOrder(card.dataset.gluPinOrder);

            return {
                card: card,
                originalIndex: index,
                pinOrder: pinOrder
            };
        });

        var hasPinnedCourses = items.some(function (item) {
            return item.pinOrder !== null;
        });

        if (!hasPinnedCourses) {
            return;
        }

        items.sort(function (a, b) {
            var aPinned = a.pinOrder !== null;
            var bPinned = b.pinOrder !== null;

            if (aPinned && !bPinned) {
                return -1;
            }

            if (!aPinned && bPinned) {
                return 1;
            }

            if (aPinned && bPinned && a.pinOrder !== b.pinOrder) {
                return a.pinOrder - b.pinOrder;
            }

            // Mismo pin (por ejemplo dos cursos con data-glu-pin="1"):
            // conserva entre ellos el orden que ya trae el catálogo.
            return a.originalIndex - b.originalIndex;
        });

        var firstWrapper = getCardWrapper(items[0].card);

        if (!firstWrapper || !firstWrapper.parentElement) {
            return;
        }

        var parent = firstWrapper.parentElement;

        var sameParent = items.every(function (item) {
            return getCardWrapper(item.card).parentElement === parent;
        });

        if (!sameParent) {
            return;
        }

        items.forEach(function (item) {
            parent.appendChild(getCardWrapper(item.card));
        });
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

        loadMetadataInBatches(cards).then(function () {
            reorderPinnedCards(cards);

            var input = document.querySelector('.glu-catalog-search__input');

            if (input && input.value) {
                input.dispatchEvent(new Event('input'));
            }
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

                var instructors = card.dataset.gluInstructors || '';
                var language = card.dataset.gluLanguage || '';

                var allText = normalize(
                    titleText + ' ' + description + ' ' + imageAlt + ' ' + instructors + ' ' + language
                );

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