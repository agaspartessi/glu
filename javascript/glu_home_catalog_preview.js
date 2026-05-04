document.addEventListener('DOMContentLoaded', function () {
    if (document.body.id !== 'page-site-index') {
        return;
    }

    document.body.classList.add('glu-home-catalog-preview-page');

    var main = document.querySelector('#region-main');

    if (!main || document.querySelector('.glu-home-catalog-preview')) {
        return;
    }

    var wwwroot = window.M && M.cfg && M.cfg.wwwroot
        ? M.cfg.wwwroot
        : window.location.origin;

    var catalogUrl = wwwroot + '/local/coursecatalog/view.php?slug=courses&sort=name_asc&view=grid';

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

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function createCourseCard(course) {
        var article = document.createElement('article');
        article.className = 'glu-home-catalog-card';

        var imageLink = document.createElement('a');
        imageLink.className = 'glu-home-catalog-card__image';
        imageLink.href = course.href;
        imageLink.setAttribute('aria-label', course.title);

        if (course.image) {
            var img = document.createElement('img');
            img.src = course.image;
            img.alt = course.alt || course.title;
            img.loading = 'lazy';
            imageLink.appendChild(img);
        } else {
            var placeholder = document.createElement('div');
            placeholder.className = 'glu-home-catalog-card__placeholder';
            placeholder.textContent = 'GLU';
            imageLink.appendChild(placeholder);
        }

        var body = document.createElement('div');
        body.className = 'glu-home-catalog-card__body';

        var title = document.createElement('h3');
        title.className = 'glu-home-catalog-card__title';

        var titleLink = document.createElement('a');
        titleLink.href = course.href;
        titleLink.textContent = course.title;

        title.appendChild(titleLink);

        var desc = document.createElement('p');
        desc.className = 'glu-home-catalog-card__desc';
        desc.textContent = course.description;

        var button = document.createElement('a');
        button.className = 'glu-home-catalog-card__button';
        button.href = course.href;
        button.textContent = 'View course →';

        body.appendChild(title);

        if (course.description) {
            body.appendChild(desc);
        }

        body.appendChild(button);

        article.appendChild(imageLink);
        article.appendChild(body);

        return article;
    }

    function renderCourses(courses) {
        var section = document.createElement('section');
        section.className = 'glu-home-catalog-preview';
        section.setAttribute('aria-labelledby', 'glu-home-catalog-title');

        var header = document.createElement('div');
        header.className = 'glu-home-catalog-preview__header';

        var title = document.createElement('h2');
        title.id = 'glu-home-catalog-title';
        title.className = 'glu-home-catalog-preview__title';
        title.textContent = 'Available courses';

        var subtitle = document.createElement('p');
        subtitle.className = 'glu-home-catalog-preview__subtitle';
        subtitle.textContent = 'Browse our academic catalog';

        header.appendChild(title);
        header.appendChild(subtitle);

        var grid = document.createElement('div');
        grid.className = 'glu-home-catalog-preview__grid';

        courses.forEach(function (course) {
            grid.appendChild(createCourseCard(course));
        });

        var footer = document.createElement('div');
        footer.className = 'glu-home-catalog-preview__footer';

        var allCourses = document.createElement('a');
        allCourses.className = 'glu-home-catalog-preview__all';
        allCourses.href = wwwroot + '/local/coursecatalog/view.php?slug=courses';
        allCourses.textContent = 'View all courses';

        footer.appendChild(allCourses);

        section.appendChild(header);
        section.appendChild(grid);
        section.appendChild(footer);

        var nativeCourseList = main.querySelector(
            '#frontpage-available-course-list, .frontpage-course-list-all, .courses.frontpage-course-list-all'
        );

        if (nativeCourseList) {
            nativeCourseList.remove();
        }

        var oldCta = main.querySelector('.glu-view-all-courses, .glu-all-courses-cta');

        if (oldCta) {
            oldCta.remove();
        }

        var intro = main.querySelector('.glu-home-intro');

        if (intro) {
            intro.insertAdjacentElement('afterend', section);
        } else {
            main.appendChild(section);
        }
    }

    fetch(catalogUrl, {
        credentials: 'same-origin'
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Could not load course catalog');
            }

            return response.text();
        })
        .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');

            var cards = Array.from(doc.querySelectorAll('#region-main .card')).filter(function (card) {
                return card.querySelector('.stretched-link');
            });

            var courses = cards.slice(0, 3).map(function (card) {
                var link = card.querySelector('.stretched-link');
                var title = card.querySelector('.card-title');
                var description = card.querySelector('.card-text, .small.text-muted, .card-body .small');
                var image = card.querySelector('img.card-img-top, img');

                return {
                    title: cleanText(title ? title.textContent : link.textContent),
                    href: absoluteUrl(link ? link.getAttribute('href') : '#'),
                    description: cleanText(description ? description.textContent : ''),
                    image: absoluteUrl(image ? image.getAttribute('src') : ''),
                    alt: cleanText(image ? image.getAttribute('alt') : '')
                };
            });

            if (!courses.length) {
                throw new Error('No courses found');
            }

            renderCourses(courses);
        })
        .catch(function () {
            var section = document.createElement('section');
            section.className = 'glu-home-catalog-preview glu-home-catalog-preview--fallback';

            section.innerHTML =
                '<div class="glu-home-catalog-preview__footer">' +
                '<a class="glu-home-catalog-preview__all" href="' + wwwroot + '/local/coursecatalog/view.php?slug=courses">' +
                'View all courses' +
                '</a>' +
                '</div>';

            var intro = main.querySelector('.glu-home-intro');

            if (intro) {
                intro.insertAdjacentElement('afterend', section);
            } else {
                main.appendChild(section);
            }
        });
});