<?php
namespace theme_glu\output;

defined('MOODLE_INTERNAL') || die();

/** Adds GLU metadata only to the Course Catalog template. */
class core_renderer extends \theme_boost\output\core_renderer {
    public function render_from_template($templatename, $context) {
        global $CFG, $DB;

        if ($templatename !== 'local_coursecatalog/coursecatalog' || empty($context->courses)
                || optional_param('gluhomepreview', false, PARAM_BOOL)) {
            return parent::render_from_template($templatename, $context);
        }

        $ids = array_column($context->courses, 'courseid');
        if (count($ids) !== count($context->courses)) {
            return parent::render_from_template($templatename, $context);
        }

        $records = $DB->get_records_list('course', 'id', $ids, '', 'id,visible,category,summary,summaryformat');
        $records = array_filter($records, static function ($course) {
            return $course->visible;
        });
        $showcontacts = empty($CFG->forcelogin) || (isloggedin() && !isguestuser());
        if ($showcontacts) {
            \core_course_category::preload_course_contacts($records);
        }

        $metadata = [];
        $pins = [];
        foreach ($records as $record) {
            [$pin, $language] = self::summary_metadata($record);
            $pins[$record->id] = $pin;
            $teachers = [];
            if ($showcontacts && \core_course_category::can_view_course_info($record)) {
                $course = new \core_course_list_element($record);
                foreach ($course->get_course_contacts() as $contact) {
                    $url = new \moodle_url('/user/view.php', ['id' => $contact['user']->id, 'course' => $record->id]);
                    $teachers[] = ['name' => $contact['username'], 'url' => $url->out(false)];
                }
            }
            $metadata[$record->id] = ['language' => $language, 'teachers' => $teachers];
        }

        $context = clone $context;
        if (($context->sort['slug'] ?? '') === 'courses') {
            // PHP 8 preserves the original order for equal keys, including unpinned courses.
            usort($context->courses, static function ($left, $right) use ($pins) {
                return ($pins[$left->courseid] ?? PHP_INT_MAX) <=> ($pins[$right->courseid] ?? PHP_INT_MAX);
            });
        }
        $marker = \html_writer::tag('span', '', ['hidden' => 'hidden',
            'data-glu-catalog-metadata' => json_encode($metadata, JSON_INVALID_UTF8_SUBSTITUTE)]);
        return $marker . parent::render_from_template($templatename, $context);
    }

    private static function summary_metadata(\stdClass $course): array {
        if (stripos($course->summary, 'data-glu-pin') === false
                && stripos($course->summary, 'glu-course-language-meta') === false) {
            return [null, ''];
        }
        $xpath = self::summary_xpath($course->summary);
        $rawpin = trim($xpath->evaluate('string((//*[@data-glu-pin])[1]/@data-glu-pin)'));
        $pin = filter_var($rawpin, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => PHP_INT_MAX - 1]]);
        // Apply Moodle language filters in the course context before reading the visible label.
        $formatted = format_text($course->summary, $course->summaryformat, [
            'context' => \context_course::instance($course->id),
        ]);
        $language = self::summary_xpath($formatted)->evaluate(
            'string((//*[contains(concat(" ", normalize-space(@class), " "), " glu-course-language-meta ")])[1])'
        );
        return [$pin === false ? null : $pin, trim($language)];
    }

    private static function summary_xpath(string $html): \DOMXPath {
        $doc = new \DOMDocument();
        $doc->loadHTML('<meta charset="utf-8"><body>' . $html . '</body>',
            LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        return new \DOMXPath($doc);
    }
}
