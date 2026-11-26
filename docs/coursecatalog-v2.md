# Course Catalog en Moodle 5.1

## Decisión previa a la implementación

El plugin llama a $OUTPUT->render_from_template('local_coursecatalog/coursecatalog', $ctx) después de aplicar sus controles de acceso, ordenar, paginar y resolver los enlaces de cada tarjeta. El contexto conserva courseid aunque el resumen visible ya perdió sus atributos HTML.

El renderer del theme enriquecerá exclusivamente ese contexto. Leerá en lote los resúmenes de los IDs seleccionados mediante la API DML de Moodle, extraerá los marcadores y precargará los contactos con la API de cursos. Para All courses aplicará una ordenación estable antes de renderizar. El navegador recibirá la metadata con el HTML y podrá decorar y filtrar las tarjetas sin consultar páginas de inscripción. Las categorías conservarán su secuencia original. La vista previa del Home pedirá sus tres cursos en el orden nativo.

El diseño evita un endpoint público nuevo y no copia la plantilla del plugin. El límite es la página entregada por el plugin (máximo 100). Con más de 100 cursos, una prioridad global entre páginas requiere intervenir antes de la paginación. Al actualizar el plugin, comprobar nombre de plantilla, courseid y estructura de tarjetas.
