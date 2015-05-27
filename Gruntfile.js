
module.exports = function(grunt) {

  grunt.initConfig({

    express: {
      test: {
        options: {
          script: './bin/www',
          node_env: 'test',
          port: require('./config.test').port
        }
      },
      fakeRSS: {
        options: {
          script: './test/rssfeed/test_server.js',
          port: require('./config.test').rss_port
        }
      }
    },

    mochacov: {
      options: {
        files: 'test/index.js',
        ui: 'bdd',
        require: 'should',
        timeout: 5000,
        colors: true
      },
      unit: {
        options: {
          reporter: 'spec'
        }
      },
    },

    watch: {
      test: {
        files: ["routes/**/*", "test/**/*"],
        tasks: ['test'],
        options: {
          atBegin: true
        }
      }
    },

  });

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-mocha-cov');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask("test", ['express:test', 'express:fakeRSS', 'mochacov:unit']);

};
