document.addEventListener('DOMContentLoaded', function () {
    var tabsRoot = document.querySelector('#tabs-tree-start');
    var drawer = document.querySelector('#theme_boost-drawers-courseindex');
    var nativeCourseIndex = drawer ? drawer.querySelector('.courseindex') : null;

    if (!tabsRoot || !drawer || !nativeCourseIndex) {
        return;
    }

    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

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

    function getCurrentSectionNumber() {
        return getSectionNumberFromUrl(window.location.href);
    }

    function getDirectLink(tabItem) {
        var children = Array.from(tabItem.children);

        return children.find(function (child) {
            return child.matches &&
                child.matches('a.nav-link[href*="/course/view.php"][href*="section="]');
        }) || null;
    }

    function getTabLevel(tabItem) {
        var match = tabItem.className.match(/tab_level_(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }

    function tabIsActive(tabItem, link) {
        return tabItem.classList.contains('active') ||
            link.classList.contains('active') ||
            link.getAttribute('aria-selected') === 'true' ||
            !!tabItem.querySelector(':scope > a.nav-link.active');
    }

    function readTabs() {
        var allItems = Array.from(
            tabsRoot.querySelectorAll('li[class*="tab_level_"]')
        );

        return allItems.map(function (tabItem, index) {
            var link = getDirectLink(tabItem);
            var level = getTabLevel(tabItem);

            if (!link || level === null) {
                return null;
            }

            var section = getSectionNumberFromUrl(link.href);

            if (!section) {
                return null;
            }

            return {
                domIndex: index,
                level: level,
                section: section,
                title: cleanText(link.textContent),
                href: link.href,
                active: tabIsActive(tabItem, link),
                children: []
            };
        }).filter(Boolean);
    }

    function findActiveRoot(roots, children, currentSection) {
        var activeRoot = roots.find(function (item) {
            return item.active;
        });

        if (activeRoot) {
            return activeRoot;
        }

        /*
         * En Onetopic, cuando el primer subtab se llama Index,
         * muchas veces tiene el mismo section que el padre.
         */
        var activeChild = children.find(function (item) {
            return item.active;
        });

        if (activeChild) {
            activeRoot = roots.find(function (root) {
                return String(root.section) === String(activeChild.section);
            });

            if (activeRoot) {
                return activeRoot;
            }
        }

        if (currentSection) {
            activeRoot = roots.find(function (item) {
                return String(item.section) === String(currentSection);
            });

            if (activeRoot) {
                return activeRoot;
            }
        }

        return roots[0] || null;
    }

    function buildTree(items) {
        var currentSection = getCurrentSectionNumber();

        var roots = items.filter(function (item) {
            item.children = [];
            return item.level === 0;
        });

        var children = items.filter(function (item) {
            item.children = [];
            return item.level > 0;
        });

        var activeRoot = findActiveRoot(roots, children, currentSection);

        if (!activeRoot) {
            return roots;
        }

        var rootInTree = roots.find(function (item) {
            return String(item.section) === String(activeRoot.section);
        });

        if (!rootInTree) {
            return roots;
        }

        /*
         * Importante:
         * Onetopic renderiza SOLO los hijos del padre activo.
         * Por eso todos los tab_level_1 visibles deben ir debajo del padre activo,
         * no debajo del último tab_level_0 del DOM.
         */
        var stack = {
            0: rootInTree
        };

        children.forEach(function (child) {
            var parent = stack[child.level - 1] || rootInTree;

            parent.children.push(child);
            stack[child.level] = child;

            Object.keys(stack).forEach(function (level) {
                if (parseInt(level, 10) > child.level) {
                    delete stack[level];
                }
            });
        });

        return roots;
    }

    function itemOrDescendantIsActive(item, currentSection) {
        if (item.active || String(item.section) === String(currentSection)) {
            return true;
        }

        return item.children.some(function (child) {
            return itemOrDescendantIsActive(child, currentSection);
        });
    }

    function createTreeItem(item, currentSection) {
        var li = document.createElement('li');
        li.className = 'glu-custom-courseindex__item';

        var hasChildren = item.children && item.children.length;
        var isActive = item.active || String(item.section) === String(currentSection);
        var hasActiveDescendant = itemOrDescendantIsActive(item, currentSection);

        if (hasChildren) {
            li.classList.add('has-children');
        }

        if (isActive) {
            li.classList.add('is-active');
        }

        if (hasActiveDescendant) {
            li.classList.add('has-active-descendant');
        }

        var row = document.createElement('div');
        row.className = 'glu-custom-courseindex__row';

        if (hasChildren) {
            var toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'glu-custom-courseindex__toggle';
            toggle.setAttribute('aria-label', 'Expand/collapse section');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.innerHTML = '▾';

            toggle.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();

                var collapsed = li.classList.toggle('is-collapsed');
                toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
                toggle.innerHTML = collapsed ? '▸' : '▾';
            });

            row.appendChild(toggle);
        } else {
            var spacer = document.createElement('span');
            spacer.className = 'glu-custom-courseindex__toggle-spacer';
            row.appendChild(spacer);
        }

        var link = document.createElement('a');
        link.className = 'glu-custom-courseindex__link';
        link.href = hasChildren ? item.children[0].href : item.href;
        link.textContent = item.title;

        if (isActive) {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
        }

        row.appendChild(link);
        li.appendChild(row);

        if (hasChildren) {
            var ul = document.createElement('ul');
            ul.className = 'glu-custom-courseindex__children';

            item.children.forEach(function (child) {
                ul.appendChild(createTreeItem(child, currentSection));
            });

            li.appendChild(ul);
        }

        return li;
    }

    function render(tree) {
        var currentSection = getCurrentSectionNumber();

        var old = drawer.querySelector('.glu-custom-courseindex');
        if (old) {
            old.remove();
        }

        var nav = document.createElement('nav');
        nav.className = 'glu-custom-courseindex';
        nav.setAttribute('aria-label', 'Course index');

        var title = document.createElement('div');
        title.className = 'glu-custom-courseindex__title';
        title.textContent = 'Course index';

        var list = document.createElement('ul');
        list.className = 'glu-custom-courseindex__list';

        tree.forEach(function (item) {
            list.appendChild(createTreeItem(item, currentSection));
        });

        nav.appendChild(title);
        nav.appendChild(list);

        nativeCourseIndex.insertAdjacentElement('beforebegin', nav);
        nativeCourseIndex.classList.add('glu-native-courseindex-hidden');

        document.body.classList.add('glu-onetopic-custom-index-ready');
    }

    var items = readTabs();

    if (!items.length) {
        return;
    }

    render(buildTree(items));
});