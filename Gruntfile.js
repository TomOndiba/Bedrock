/* -------------------------- *\
NOTES

1. "jpegtran-bin": "0.2.0" in package.json is only temporary. See: http://stackoverflow.com/questions/19906510/npm-module-grunt-contrib-imagemin-not-found-is-it-installed.

2. Images workflow:
    A. Create/edit vector in Illustrator. Save as .eps in /_images/*? for future use.
    B. Save as .svg in /_images/*?.
    C. When `grunt image` is ran (or Grunt is watching), svgmin will put the minified version into /img/*?
    D. Then svg2png will create a .png in /_images/*?
    E. Then imagemin will create an optimised version in /img/*?
    
    NOTE that without '<?xml version="1.0" encoding="utf-8"?>' svg2png will fail so don't run it on the minified .svg,
    but also check other / old .svg files if the .png fails.
    
3. CSS workflow:
    A. Compose / edit style.scss file in the usual way in /css.
    B. If grunt is running, sass will generate style.css /css.
    C. Then autoprefixer will do it's thing and create style.prefixed.css in /css
    D. Then cssmin will create style.min.css in /css.

\* -------------------------- */

/*var dir_structure = [
    '_images',
    '_scripts',
    '_styles',
    '_videos',
    'public/css',
    'public/css/vendor',
    'public/img',
    'public/js',
    'public/js/vendor',
    'public/vid',
];*/

module.exports = function(grunt) {

    // Extract the 'copy' config from bower.json:
    var bower_config = grunt.file.readJSON('bower.json');
    var copy_config  = bower_config['copy'];
    // Uncomment to verify copy config:
    //grunt.file.write('copy_config.json', JSON.stringify(copy_config));


    // 1. All configuration goes here
    grunt.initConfig({
    
        pkg: grunt.file.readJSON('package.json'),

        // https://github.com/nDmitry/grunt-autoprefixer
        autoprefixer: {
            options: {
                browsers: ['last 2 version']
            },
            single_file: {
                src: '_styles/style.css',
                dest: '_styles/style.prefixed.css'
            }
        },
        
        // https://github.com/yatskevich/grunt-bower-task
        bower: {
            install: {}
        },
        
        // https://github.com/gruntjs/grunt-contrib-compass
        /*compass: {
            dist: {
                options: {
                    sassDir: 'css',
                    cssDir: 'css',
                    environment: 'development'
                }
            }
        },*/
        
        // https://github.com/gruntjs/grunt-contrib-concat
        concat: {
            js: {
                src: [
                    'vendor/jquery.js',
                    'js/bootstrap.js',
                    'js/main.js'
                ],
                dest: 'js/script.js'
            }/*,
            css: {
                src: [
                    'css/normalize.css',
                    'css/foundation.css'
                ],
                dest: 'css/style.css'
            }*/
        },
        
        // https://github.com/gruntjs/grunt-contrib-copy
        copy: {
            main: {
                files: copy_config
            }
        },
        
        // https://github.com/gruntjs/grunt-contrib-cssmin
        cssmin: {
            minify: {
                expand: true,
                cwd: '_styles/',
                src: ['style.prefixed.css'],
                dest: 'public/css/',
                ext: '.min.css'
            }
        },

        // https://github.com/gruntjs/grunt-contrib-imagemin
        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: '_images/',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: 'public/img/'
                }]
            }
        },
        
        // https://github.com/gruntjs/grunt-contrib-sass
        sass: {
            dist: {
                options: {
                    style: 'expanded',
                    precision: 7
                },
                files: {
                    '_styles/style.css': '_styles/style.scss'
                }
            } 
        },

        // https://npmjs.org/package/grunt-svg2png
        svg2png: {
            all: {
                files: [{
                    src: ['_images/**/*.svg']
                }]
            }
        },

        // https://npmjs.org/package/grunt-svgmin
        svgmin: {
            options: {
                plugins: [{
                    removeViewBox: false,
                    removeUnknownsAndDefaults: false
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '_images/',
                    src: ['**/*.svg'],
                    dest: 'public/img/'
                }]
            }
        },

        // https://github.com/gruntjs/grunt-contrib-uglify
        uglify: {
            build: {
                src: 'js/script.js',
                dest: 'js/script.min.js'
            }
        },

        // https://github.com/gruntjs/grunt-contrib-watch
        // Order is important here:
        watch: {
            css: {
                files: ['css/**/*.scss'],
                tasks: ['sass', 'autoprefixer', 'cssmin'],
                //tasks: ['compass', 'autoprefixer', 'cssmin'],
                options: {
                    spawn: false
                }
            },
            
            scripts: {
                files: ['js/**/*.js'],
                tasks: ['concat', 'uglify'],
                options: {
                    spawn: false
                }        
            },
            
            svg: {
                files: ['img-orig/**/*.svg'],
                tasks: ['svgmin', 'svg2png'],
                options: {
                    spawn: false
                }
            },
            
            images: {
                files: ['img-orig/**/*.{png,jpg,gif}'],
                tasks: ['imagemin'],
                options: {
                    spawn: false
                }
            },
        }

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-bower-task');
    //grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-svgmin');
    grunt.loadNpmTasks('grunt-svg2png');
    

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    
    grunt.task.registerTask('create_structure', 'Create the files and folders', function() {
        dirs = grunt.file.readJSON('directory_structure.json');
        var i = 0
          , l = dirs.length;
        for (i; i<l; i++) {
            grunt.file.mkdir(dirs[i]);
        }
    });
    
    grunt.task.registerTask('generate_index', 'Build the index.html file', function() {
        var template  = grunt.file.read('_template.html');
        // This may change to .php depending on settings:
        var extension = 'html';
        
        var index = template;
        // @TODO do stuff based on settings
        
        var index_file = 'public/index.' + extension;
        
        grunt.file.write(index_file, index);
        grunt.log.write('Created file: ' + index_file);
    });
    
    
    grunt.registerTask('default', ['concat', 'uglify', 'sass', 'autoprefixer', 'cssmin', 'svgmin', 'svg2png', 'imagemin']);
    
    // Process css using sass:
    grunt.registerTask('css', ['sass', 'autoprefixer', 'cssmin']);
    
    // Process css using compass:
    //grunt.registerTask('css', ['compass', 'autoprefixer', 'cssmin']);
    
    // Optimize images and create png fallbacks for svg:
    grunt.registerTask('image', ['svgmin', 'svg2png', 'imagemin']);
    
    //(Re)build the project:
    grunt.registerTask('build', ['create_structure', 'bower', 'copy', 'generate_index']);
    
    // Start up development mode:
    // @TODO add livereload stuff.
    grunt.registerTask('dev', ['watch']);
};