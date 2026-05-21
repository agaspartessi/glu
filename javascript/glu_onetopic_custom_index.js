document.addEventListener('DOMContentLoaded', function () {
    var isCoursePage =
        document.body.id.indexOf('page-course-view') !== -1 ||
        document.body.classList.contains('path-course-view');

    var courseIndexDrawer = document.querySelector('#theme_boost-drawers-courseindex');
    var nativeCourseIndex = document.querySelector('#theme_boost-drawers-courseindex .courseindex');

    if (!isCoursePage || !courseIndexDrawer || !nativeCourseIndex) {
        return;
    }

    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    function getSectionNumberFromUrl(url) {
        if (!url) {
            return null;
        }

        try {
            var parsedUrl = new URL(url, wwwroot);
            return parsedUrl.searchParams.get('section');
        } catch (error) {
            return null;
        }
    }

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function getCurrentSectionNumber() {
        return getSectionNumberFromUrl(window.location.href);
    }

    function getOnetopicTabs() {
        var tabItems = Array.from(document.querySelectorAll(
            '#tabs-tree-start li[class*="tab_level_"], ' +
            '.format-onetopic-tabs li[class*="tab_level_"], ' +
            '.format-onetopic li[class*="tab_level_"], ' +
            'ul[class*="onetopic"] li[class*="tab_level_"]'
        ));

        return tabItems.map(function (item) {
            var link = item.querySelector('a[href*="/course/view.php"][href*="section="]');
            var match = item.className.match(/tab_level_(\d+)/);

            if (!link || !match) {
                return null;
            }

            var sectionNumber = getSectionNumberFromUrl(link.href);

            if (!sectionNumber) {
                return null;
            }

            return {
                level: parseInt(match[1], 10),
                section: sectionNumber,
                title: cleanText(link.textContent),
                href: link.href
            };
        }).filter(Boolean);
    }

    function buildTree(items) {
        var root = [];
        var stack = [];

        items.forEach(function (item) {
            item.children = [];

            if (item.level === 0) {
                root.push(item);
                stack = [item];
                return;
            }

            var parent = stack[item.level - 1] || stack[0];

            if (parent) {
                parent.children.push(item);
            } else {
                root.push(item);
            }

            stack[item.level] = item;

            stack = stack.slice(0, item.level + 1);
        });

        return root;
    }

    function createLink(item, currentSection) {
        var link = document.createElement('a');
        link.className = 'glu-custom-courseindex__link';
        link.href = item.href;
        link.textContent = item.title;

        if (String(item.section) === String(currentSection)) {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
        }

        return link;
    }

    function createTreeItem(item, currentSection) {
        var itemEl = document.createElement('li');
        itemEl.className = 'glu-custom-courseindex__item';

        if (item.children && item.children.length) {
            itemEl.classList.add('has-children');
        }

        if (String(item.section) === String(currentSection)) {
            itemEl.classList.add('is-active');
        }

        var row = document.createElement('div');
        row.className = 'glu-custom-courseindex__row';

        var link = createLink(item, currentSection);

        if (item.children && item.children.length) {
            /*
             * Si la pestaña padre tiene hijos, el link lleva al primer hijo.
             * Esto respeta la lógica que veníamos trabajando:
             * Chapter 1 -> Welcome to the course
             * Chapter 2 -> primera child tab de Chapter 2
             */
            link.href = item.children[0].href;

            var toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'glu-custom-courseindex__toggle';
            toggle.setAttribute('aria-label', 'Expand/collapse section');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.innerHTML = '▾';

            toggle.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();

                var collapsed = itemEl.classList.toggle('is-collapsed');
                toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
                toggle.innerHTML = collapsed ? '▸' : '▾';
            });

            row.appendChild(toggle);
        } else {
            var spacer = document.createElement('span');
            spacer.className = 'glu-custom-courseindex__toggle-spacer';
            row.appendChild(spacer);
        }

        row.appendChild(link);
        itemEl.appendChild(row);

        if (item.children && item.children.length) {
            var childList = document.createElement('ul');
            childList.className = 'glu-custom-courseindex__children';

            item.children.forEach(function (child) {
                childList.appendChild(createTreeItem(child, currentSection));
            });

            itemEl.appendChild(childList);
        }

        return itemEl;
    }

    function renderCustomIndex(tree) {
        var currentSection = getCurrentSectionNumber();

        var wrapper = document.createElement('nav');
        wrapper.className = 'glu-custom-courseindex';
        wrapper.setAttribute('aria-label', 'Course index');

        var title = document.createElement('div');
        title.className = 'glu-custom-courseindex__title';
        title.textContent = 'Course index';

        var list = document.createElement('ul');
        list.className = 'glu-custom-courseindex__list';

        tree.forEach(function (item) {
            list.appendChild(createTreeItem(item, currentSection));
        });

        wrapper.appendChild(title);
        wrapper.appendChild(list);

        nativeCourseIndex.insertAdjacentElement('beforebegin', wrapper);

        /*
         * Solo ocultamos el índice nativo si el custom se pudo construir.
         */
        nativeCourseIndex.classList.add('glu-native-courseindex-hidden');
    }

    var items = getOnetopicTabs();

    if (!items.length) {
        return;
    }

    var tree = buildTree(items);

    if (!tree.length) {
        return;
    }

    renderCustomIndex(tree);
});