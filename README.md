# xmheck [![Build Status](https://secure.travis-ci.org/tristankenney/xmheck.png?branch=master)](http://travis-ci.org/tristankenney/xmheck)

xmheck is a preprocessor to help you remove some of the verbosity from your xml files.

## Getting Started
Install the module with: `npm install xmheck`

```javascript
var xmheck = require('xmheck');
xmheck.parse(infile); //returns a parsed xmheck file
```

```cli
xmheck /path/to/input.xml /path/to/output.xml
```

## License
Copyright (c) 2014 Tristan Kenney
Licensed under the MIT license.
