#! /usr/bin/env node

/*
 * xmheck
 * https://github.com/tristan/xmheck
 *
 * Copyright (c) 2014 Tristan Kenney
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path'),
    argv = require('minimist')(process.argv.slice(2)),
    infile   = argv['_'][0] || null,
    outfile  = argv['_'][1] || null,
    includes = argv['i'] || argv['includes'] || [],
    prefix   = argv['p'] || argv['prefix'] || 'xmh',
    parser = require('./parser');

//Push current working directory and infile onto includes
includes.push(path.dirname(path.resolve(infile)));
includes.push(path.resolve(process.cwd()));
var xmheck = new parser(includes, prefix);
xmheck.run(infile, outfile, includes, prefix);