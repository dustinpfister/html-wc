#!/usr/bin/env node
// Included the node.js shebang so that this script
// can be used as a CLI tool when installed globally.

// using node-dir
var dir = require('node-dir'),

// html to json works great for that task
htmlToJson = require('html-to-json'),

// a very nice option parser, for when used as a CLI tool
nopt = require('nopt'),

// just need a simple shallow clone (or merge) object method
clone = function (obj, nObj) {

    // merge to given object, or return a new one
    nObj = nObj || {};

    for (var prop in obj) {

        nObj[prop] = obj[prop];

    }

    return nObj;

},

// default options
defaults = {

    source: './',
    match: /.html$/,
    tagName: 'p'

},

options = clone(defaults),

// just a simple log wrap
log = function (mess) {

    console.log(mess);

},

// given the content of a file, and it's filename
// from the use of a node-dir readFiles call
// return a promise that will give a report on that file
// including word count thanks to htmlToJson.
toReport = function (content, fn) {

    // return the promise
    return htmlToJson.parse(content, {

        'fn': fn,
        'wc': function (doc) {
            return doc.find(options.tagName).text().split(' ').length;
        },
        'text': function (doc) {
            return doc.find(options.tagName).text();
        }
    });

},

// generate a list of reports
genReports = function (done) {

    var results = [];
	
	done = done || function(){};

    // using node-dirs readFiles method to find files that
    // match the pattern in options.match (/.html$/ by default)
    dir.readFiles(options.source, {
        match: options.match
    },

        // what to do for each file found
        function (err, content, fn, next) {

        toReport(content, fn).then(function (result) {

            log(result.fn + ' : ' + result.wc);
            results.push(result);
            next(); // next file

        }).catch (function (e) {

            // log any error that might happen
            log(e);

            next(); // continue to the next file anyway

        });

    }, function () {

        log('done reading files');

        // sort by word count
        results.sort(function (a, b) {

            return b.wordCount - a.wordCount

        });

		done(results);

    });

};

// if CLI
if (require.main === module) {

    // use nopt to cook arguments
    argv = nopt({

            // can set source from command line
            source: String

        },

            // short hands
        {
            s: '--source'

        }, process.argv, 2);

    // start by cloning defaults, if not done so before.
    options = clone(defaults);

    // merge argv, down onto options
    clone(argv, options);

    // gen reports
    genReports(function(results){
		
		log('done:');
		log(results);
		
	});

} else {

    // use as module

	// export a gen method
    exports.gen = function (opt, done) {

        done = done || function () {};
        opt = opt || {};

        // start by cloning defaults, if not done so before.
        options = clone(defaults);

        // merge down any given options
        clone(argv, opt);

        // gen reports
        genReports(function(results){
			
			done(results);
			
		});

    }

}
