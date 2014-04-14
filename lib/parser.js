var _       = require('lodash'),
    cheerio = require('cheerio'),
    xml2js  = require('xml2js'),
    fs      = require('fs'),
    path    = require('path'),
    pd = require('pretty-data').pd;

var xmheck = exports;

xmheck.opentag = /\<\?xml.*\n\<root\>\n/;
xmheck.closetag = /\n\<\/root\>$/;

xmheck.run = function(infile, outfile, includes, prefix) {
    infile   = infile || false;
    outfile  = outfile || false;
    includes = processIncludes(includes);
    prefix   = prefix || 'xmh';
    console.log(includes);
    if (!fs.existsSync(infile)) {
        throw new Error("Invalid infile");
    }

    var xml = this.parse(infile, includes, prefix);
    outfile = path.resolve(outfile);
    return fs.writeFileSync(outfile, pd.xml(xml));
};

xmheck.parse = function(file, includes, prefix) {
    var prefixedImport = prefix+'-import',
        prefixedParam = prefix+'-param',
        prefixedPlaceholder = prefix+'-placeholder',
        $ = loadXml(file),
        parser = function($) {
            var importTags = $('['+prefixedImport+']');

            importTags.each(function () {
                var filename = this.attr(prefixedImport),
                    paramTags = $(prefixedParam, this).children();
                    importedFile = loadXml(filename, true);

                paramTags.each(function(i, node) {
                    var name = paramTags[i].name,
                        content = this.html(),
                        selector = '['+prefixedPlaceholder+'="'+name+'"]';

                    importedFile(selector).html(content)
                                          .attr(prefixedPlaceholder, null);
                });


                var importObject = toObject(importedFile.xml()),
                    thisObject = toObject('<root>'+this.html()+'</root>'),
                    mergedObject = {};

                delete thisObject.root['xmh-param'];
                _.merge(mergedObject, thisObject, importObject);
                var inner = cheerio.load(toXml(mergedObject), {xmlMode: true});
                inner = parser(inner);
                this.replaceWith(inner.xml());

            });

            return $;
        };

    return parser($).xml();

}

function toObject(xml) {
    var obj = {};
    xml2js.parseString(xml, function(err, result) {
        obj = result;
    });
    return obj;
}

function toXml(object) {
    var xml = {};
    var builder = new xml2js.Builder();
    return builder.buildObject(object)
                  .replace(xmheck.opentag,'')
                  .replace(xmheck.closetag,'');
}

function loadXml(file, removeXmlTag) {
    removeXmlTag = removeXmlTag || false;
    var split = file.split(':');
    node = split[0];
    file = path.resolve(file);
    file = fs.readFileSync(file).toString();
    if (removeXmlTag) {
        file = file.replace(/\<\?xml.*\>\n/,'');
    }
    return cheerio.load(file, {xmlMode: true});
}

function processIncludes(includes) {
    var paths = [__dirname];

    if (includes !== undefined) {
        if (Array.isArray(includes)) {
            paths = _.union(paths, includes);
        } else {
            paths = _.union(paths, includes.split(':'));
        }
    }
    return paths;
}