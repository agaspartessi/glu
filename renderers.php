<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/renderer.php');

class theme_glu_core_course_renderer extends core_course_renderer {

    /**
     * Agrega una tira de docentes arriba del nombre del curso,
     * sólo en /enrol/index.php?id=XX.
     */
    public function enrolment_options(stdClass $course, array $widgets, ?\core\url $returnurl = null) {
        if ($this->page->pagetype !== 'enrol-index') {
            return parent::enrolment_options($course, $widgets, $returnurl);
        }

        $courselistitem = new core_course_list_element($course);
        $teamstrip = $this->render_glu_course_team_strip($courselistitem);

        return $teamstrip . parent::enrolment_options($course, $widgets, $returnurl);
    }

    /**
     * Reemplaza los course contacts nativos sólo en /enrol/index.php.
     * En el resto del sitio deja el comportamiento original de Moodle.
     */
    protected function course_contacts(core_course_list_element $course) {
        if ($this->page->pagetype !== 'enrol-index') {
            return parent::course_contacts($course);
        }

        $contactsdata = $this->get_glu_course_contacts_data($course);

        if (empty($contactsdata)) {
            return '';
        }

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

        foreach ($contactsdata as $contactdata) {
            $content .= $this->render_glu_trainer_card(
                $contactdata['user'],
                $contactdata['roletext'],
                $contactdata['profileurl']
            );
        }

        $content .= html_writer::end_tag('div');
        $content .= html_writer::end_tag('section');

        return $content;
    }

    /**
     * Tira superior con nombres separados por coma.
     */
    private function render_glu_course_team_strip(core_course_list_element $course): string {
        $contactsdata = $this->get_glu_course_contacts_data($course);

        if (empty($contactsdata)) {
            return '';
        }

        $links = [];

        foreach ($contactsdata as $contactdata) {
            $user = $contactdata['user'];

            $links[] = html_writer::link(
                $contactdata['profileurl'],
                s(fullname($user)),
                ['class' => 'glu-enrol-course-team-strip__link']
            );
        }

        $content = html_writer::start_tag('section', [
            'class' => 'glu-enrol-course-team-strip',
            'aria-label' => 'Course team',
        ]);

        $content .= html_writer::tag('p', 'Course team', [
            'class' => 'glu-enrol-course-team-strip__eyebrow',
        ]);

        $content .= html_writer::tag('p', implode(', ', $links), [
            'class' => 'glu-enrol-course-team-strip__names',
        ]);

        $content .= html_writer::end_tag('section');

        return $content;
    }

    /**
     * Centraliza la obtención dinámica de docentes/contactos del curso.
     */
    private function get_glu_course_contacts_data(core_course_list_element $course): array {
        $contacts = $course->get_course_contacts();

        if (empty($contacts)) {
            return [];
        }

        $coursecontext = context_course::instance($course->id);
        $contactsdata = [];
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
                    if (function_exists('role_get_name')) {
                        $rolenames[] = role_get_name($role, $coursecontext, ROLENAME_ALIAS);
                    } else if (!empty($role->displayname)) {
                        $rolenames[] = format_string($role->displayname);
                    } else if (!empty($role->name)) {
                        $rolenames[] = format_string($role->name);
                    }
                }
            }

            $roletext = !empty($rolenames)
                ? implode(', ', $rolenames)
                : get_string('teacher');

            $profileurl = new moodle_url('/user/view.php', [
                'id' => $user->id,
                'course' => $course->id,
            ]);

            $contactsdata[] = [
                'user' => $user,
                'roletext' => $roletext,
                'profileurl' => $profileurl,
            ];
        }

        return $contactsdata;
    }

    /**
     * Card visual para cada trainer.
     */
    private function render_glu_trainer_card(stdClass $user, string $roletext, moodle_url $profileurl): string {
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

        $namehtml = html_writer::link($profileurl, s($fullname), [
            'class' => 'glu-enrol-trainer__name-link',
        ]);

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