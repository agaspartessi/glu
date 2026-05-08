<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/renderer.php');

class theme_glu_core_course_renderer extends core_course_renderer {

    /**
     * Reemplaza los course contacts nativos sólo en /enrol/index.php.
     * En el resto del sitio deja el comportamiento original de Moodle.
     */
    protected function course_contacts(core_course_list_element $course) {
        if ($this->page->pagetype !== 'enrol-index') {
            return parent::course_contacts($course);
        }

        $contacts = $course->get_course_contacts();

        if (empty($contacts)) {
            return '';
        }

        $coursecontext = context_course::instance($course->id);

        $content = html_writer::start_tag('section', [
            'class' => 'glu-enrol-trainers',
            'aria-labelledby' => 'glu-enrol-trainers-title',
        ]);

        $content .= html_writer::start_tag('div', [
            'class' => 'glu-enrol-trainers__header',
        ]);

        $content .= html_writer::tag('p', 'Course team', [
            'class' => 'glu-enrol-trainers__eyebrow',
        ]);

        $content .= html_writer::tag('h2', 'Course instructors', [
            'id' => 'glu-enrol-trainers-title',
            'class' => 'glu-enrol-trainers__title',
        ]);

        $content .= html_writer::end_tag('div');

        $content .= html_writer::start_tag('div', [
            'class' => 'glu-enrol-trainers__grid',
        ]);

        $printedusers = [];

        foreach ($contacts as $coursecontact) {
            $contactuser = $coursecontact['user'] ?? null;

            if (empty($contactuser) || empty($contactuser->id)) {
                continue;
            }

            $userid = (int) $contactuser->id;

            if (isset($printedusers[$userid])) {
                continue;
            }

            $printedusers[$userid] = true;

            $user = core_user::get_user($userid, '*', IGNORE_MISSING);

            if (!$user) {
                continue;
            }

            $rolenames = [];

            if (!empty($coursecontact['roles'])) {
                foreach ($coursecontact['roles'] as $role) {
                    if (!empty($role->displayname)) {
                        $rolenames[] = format_string($role->displayname);
                    } else if (!empty($role->name)) {
                        $rolenames[] = format_string($role->name);
                    }
                }
            }

            $roletext = !empty($rolenames)
                ? implode(', ', $rolenames)
                : get_string('teacher');

            $content .= $this->render_glu_trainer_card($user, $roletext);
        }

        $content .= html_writer::end_tag('div');
        $content .= html_writer::end_tag('section');

        return $content;
    }

    /**
     * Card visual para cada trainer.
     */
    private function render_glu_trainer_card(stdClass $user, string $roletext): string {
        $content = html_writer::start_tag('article', [
            'class' => 'glu-enrol-trainer',
        ]);

        $picture = new user_picture($user);
        $picture->size = 100;
        $picture->class = 'glu-enrol-trainer__photo';

        $content .= html_writer::tag('div', $this->output->render($picture), [
            'class' => 'glu-enrol-trainer__avatar',
        ]);

        $content .= html_writer::start_tag('div', [
            'class' => 'glu-enrol-trainer__content',
        ]);

        $fullname = fullname($user);

        if (isloggedin() && !isguestuser()) {
            $profileurl = core_user::get_profile_url($user, context_system::instance());

            $namehtml = html_writer::link($profileurl, s($fullname), [
                'class' => 'glu-enrol-trainer__name-link',
            ]);
        } else {
            $namehtml = s($fullname);
        }

        $content .= html_writer::tag('h3', $namehtml, [
            'class' => 'glu-enrol-trainer__name',
        ]);

        $content .= html_writer::tag('p', s($roletext), [
            'class' => 'glu-enrol-trainer__role',
        ]);

        if (!empty($user->description)) {
            $usercontext = context_user::instance($user->id, IGNORE_MISSING);

            if ($usercontext) {
                $description = format_text($user->description, $user->descriptionformat ?? FORMAT_HTML, [
                    'context' => $usercontext,
                    'overflowdiv' => false,
                    'filter' => true,
                ]);

                if (trim(strip_tags($description)) !== '') {
                    $content .= html_writer::tag('div', $description, [
                        'class' => 'glu-enrol-trainer__bio',
                    ]);
                }
            }
        }

        $content .= html_writer::end_tag('div');
        $content .= html_writer::end_tag('article');

        return $content;
    }
}