# Course Catalog en Moodle 5.1

## Decisión previa a la implementación

El plugin llama a $OUTPUT->render_from_template('local_coursecatalog/coursecatalog', $ctx) después de aplicar sus controles de acceso, ordenar, paginar y resolver los enlaces de cada tarjeta. El contexto conserva courseid aunque el resumen visible ya perdió sus atributos HTML.

El renderer del theme enriquecerá exclusivamente ese contexto. Leerá en lote los resúmenes de los IDs seleccionados mediante la API DML de Moodle, extraerá los marcadores y precargará los contactos con la API de cursos. Para All courses aplicará una ordenación estable antes de renderizar. El navegador recibirá la metadata con el HTML y podrá decorar y filtrar las tarjetas sin consultar páginas de inscripción. Las categorías conservarán su secuencia original. La vista previa del Home pedirá sus tres cursos en el orden nativo.

El diseño evita un endpoint público nuevo y no copia la plantilla del plugin. El límite es la página entregada por el plugin (máximo 100). Con más de 100 cursos, una prioridad global entre páginas requiere intervenir antes de la paginación. Al actualizar el plugin, comprobar nombre de plantilla, courseid y estructura de tarjetas.

## Validación del 26/11/2026

Se tomaron copias de la grilla ascendente, la lista descendente y las 33 fichas públicas de información de curso. Los pins reales iban del 1 al 33, sin empates ni ausencias. La grilla HTML original llegaba en orden alfabético. Una consulta anónima de inscripción terminó en el login. El JS de main aceptaba ese HTML como respuesta válida y podía persistir metadata vacía en sessionStorage.

Se ejecutó el renderer de la rama con PHP 8.4 y DOM, los resúmenes de esas fichas y dobles de las APIs de Moodle. Las dos vistas coincidieron en los 33 puestos con un orden esperado calculado independientemente. Los primeros tres fueron Workers in Informal Employment: Organising and Bargaining Collectively, Labour History y Just and Green: Labour's Ecological Question. También se probaron empates, 2 frente a 10, eliminación de pins y conservación del orden de categoría. Se recuperaron 33 etiquetas de idioma.

En Chromium se reprodujeron las tarjetas capturadas, con respuestas HTTP locales y el resultado del renderer. En frío se observaron 33 solicitudes a enrol/index.php con main y cero con v2.0, en ambas vistas. Se verificaron escritorio (1280 px), viewport móvil (390 px), búsqueda con y sin resultados, navegación por categorías (10 enlaces), tamaño de página del formulario, etiquetas de idioma y presencia de una entrada de caché v4 deliberadamente obsoleta. El Home produjo tres tarjetas en orden nativo y mantuvo el enlace al catálogo completo.

Estos resultados aíslan la lógica del theme. El navegador no cargó todos los assets ni el Additional HTML del campus. No se midieron segundos de carga en staging, desplazamiento visual con CSS real, coste de los filtros de Moodle ni sesiones reales de estudiante en la rama.

## Instalación y aceptación en una copia de Moodle 5.1

1. Usar un clon de pruebas con las mismas versiones de Course Catalog y del theme, los ajustes de idioma, Additional HTML y Raw SCSS de producción. Desde el checkout del theme (normalmente public/theme/glu), ejecutar `git status --short` y `git rev-parse HEAD`. Guardar el SHA instalado para rollback. Si hay cambios locales, resguardarlos antes de cambiar de rama.
2. Ejecutar `git fetch origin v2.0` y `git switch --detach origin/v2.0` en ese checkout. Desde la raíz de Moodle ejecutar `php admin/cli/purge_caches.php` con el usuario habitual del servicio. La rama no incluye migraciones de datos.
3. En DevTools, Network, activar Preserve log. Abrir All courses como visitante y como estudiante, en grid/list y con ambos sentidos de orden. Comparar el mismo conjunto de cursos, primero en ventana privada y después al recargar. Verificar que el HTML de respuesta ya contiene el orden correcto y el atributo data-glu-catalog-metadata. Filtrar Fetch/XHR por enrol/index.php. Esperado: cero descargas de metadata.
4. En una copia de un curso de prueba, cambiar, duplicar y quitar data-glu-pin. Recargar la misma sesión sin borrar el almacenamiento. Confirmar el cambio en All courses, el desempate según el orden seleccionado y el orden original dentro de las categorías. Probar búsquedas por título, idioma y docente, los enlaces de perfil y el Home.
5. Comparar main y v2.0 en el mismo servidor, red y sesión, con varias cargas frías y calientes. Registrar TTFB del documento, cantidad de solicitudes y filmstrip de Performance hasta que el orden se estabilice. Revisar idioma alternativo, móvil, Safari y Firefox, y cualquier traducción o estilo agregado desde administración.
6. Para rollback, desde el directorio del theme ejecutar `git switch --detach SHA_GUARDADO` sustituyendo el marcador por el SHA anterior. Volver a purgar cachés desde la raíz de Moodle. Si el despliegue usa releases inmutables, reactivar el release anterior completo.

## Límites

La precarga de contactos utiliza el caché propio de Moodle y las reglas de visibilidad de la información del curso. Los pins se leen en cada renderizado. Una intervención externa que sobrescriba el HTML o reordene tarjetas puede alterar el resultado. La página aún debe generar imágenes, conteos y textos del plugin. Los enlaces antiguos que abren una página parcial pueden requerir una redirección para ver el conjunto completo. El Home limita las tarjetas solicitadas a tres, aunque el plugin puede calcular datos de más cursos antes de paginar.
