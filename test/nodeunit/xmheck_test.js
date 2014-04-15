'use strict';

var parser = require('../../lib/parser.js'),
    fs      = require('fs');

exports.testParse = function(test){
    var xmheck = new parser(),
        testFile = __dirname + '/../resources/test.xml',
        referenceFile = __dirname + '/../resources/reference.xml';
    xmheck.setIncludes([__dirname + '/../resources']);
    test.equal(xmheck.parse(testFile), fs.readFileSync(referenceFile).toString(), "Parse did not match");
    test.done();
};

exports.testFileNotFound = function(test){
    var xmheck = new parser();

    test.throws(function() {
      xmheck.parse('invalidfile')
    });
    test.done();
};


