var task = {
    options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
    },
    all: ['*.js', 'src/**/*.js', 'test/**/*.js']
};

module.exports = task;