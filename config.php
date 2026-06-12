<?php
defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/lib.php');

$THEME->name = 'glu';
$THEME->parents = ['boost'];
$THEME->sheets = [];
$THEME->editor_sheets = [];
$THEME->yuicssmodules = [];
$THEME->rendererfactory = 'theme_overridden_renderer_factory';
$THEME->enable_dock = false;
$THEME->hidefromselector = false;

$THEME->scss = function($theme) {
    return theme_glu_get_main_scss_content($theme);
};

$THEME->javascripts_footer = ['glu_coursecatalog_search','glu_home_catalog_preview','glu_loggedin_routes','glu_course_subsections','glu_onetopic_navigation','glu_onetopic_custom_index','glu_course_announcements_nav','glu_section0_openforum_nav'];