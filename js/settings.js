/**
 * @file        settings.js
 *              All available web application settings 
 *              are collected here.
 * 
 * @author      FFDP P1ramidka
 * @version     0.3 
 * @license     MIT
 */

SETTINGS = {
    //Max particles count
    max_particles: 300,
    //Waiting time between frames
    delta_wait: 1000 / 60,
    //Natural particles size
    particle_size: 2,
    //Show date and time?
    td_show: true,
    //Show FPS?
    fps_show: false,
    //Display audio visualization?
    draw_audio: true,
    //r, g, b - white walue
    white_border: 230,
    //Style settings of fps display
    fps: {
        color: "#000000",
        font_size: 16,
        font_family: "monospace"
    },
    //Style settings of date display
    date: {
        color: "#000000",
        font_size: 72,
        font_family: "Linetoline"
    },
    //Style settings of time display
    time: {
        color: "#000000",
        font_size: 34,
        font_family: "Linetoline"
    }
  }