'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: ['*.js', 'src/**/*.js', 'test/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    require('time-grunt')(grunt);

    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['jshint:all']);
};