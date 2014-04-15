var _       = require('lodash'),
    cheerio = require('cheerio'),
    xml2js  = require('xml2js'),
    fs      = require('fs'),
    path    = require('path'),
    crypto = require('crypto'),
    pd = require('pretty-data').pd;

function Xmheck(includes, prefix) {
    var _self = this;
    _self.opentag = /\<\?xml.*\n\<root\>\n/;
    _self.closetag = /\n\<\/root\>$/;
    _self.setIncludes(includes);
    _self.setPrefix(prefix);
    _self.pathCache = {};
}

Xmheck.prototype.setIncludes = function(includes) {
    var _self = this;
    includes = includes || [];
    includes = _.map(includes, function(includePath) {
        return path.resolve(includePath);
    });
    _self.includes = _.union([''], includes);
    _self.pathCache = {};
}

Xmheck.prototype.setPrefix = function(prefix) {
    var _self = this;
    _self.prefix = prefix || 'xmh';
}

Xmheck.prototype.run = function(infile, outfile) {
    var _self = this;
    infile    = infile  || false;
    outfile   = outfile || false;
    if (!fs.existsSync(infile)) {
        throw new Error("Invalid infile");
    }
    var xml = _self.parse(infile);
    outfile = path.resolve(outfile);
    return fs.writeFileSync(outfile, xml);
}

Xmheck.prototype.parse = function(file) {
    var _self = this,
        prefixedImport = _self.prefix+'-import',
        prefixedParam = _self.prefix+'-param',
        prefixedPlaceholder = _self.prefix+'-placeholder',
        $ = _self.loadXml(file),
        parser = function($) {
            var importTags = $('['+prefixedImport+']');

            importTags.each(function () {
                var filename = this.attr(prefixedImport),
                    paramTags = $(prefixedParam, this).children(),
                    importedFile = _self.loadXml(filename, true);

                paramTags.each(function(i, node) {
                    var name = paramTags[i].name,
                        content = this.html(),
                        selector = '['+prefixedPlaceholder+'="'+name+'"]';

                    importedFile(selector).html(content)
                                          .attr(prefixedPlaceholder, null);
                });

                var unparsedPlaceholders = importedFile('['+prefixedPlaceholder+']');
                unparsedPlaceholders.attr(prefixedPlaceholder, null);

                var importObject = _self.toObject(importedFile.xml()),
                    thisObject = _self.toObject('<root>'+this.html()+'</root>'),
                    mergedObject = {};

                delete thisObject.root['xmh-param'];
                _.merge(mergedObject, thisObject, importObject);
                var inner = cheerio.load(_self.toXml(mergedObject), {xmlMode: true});
                inner = parser(inner);
                this.replaceWith(inner.xml());

            });

            return $;
        };

    return pd.xml(parser($).xml());

}



Xmheck.prototype.toObject = function(xml) {
    var obj = {};
    xml2js.parseString(xml, function(err, result) {
        obj = result;
    });
    return obj;
}

Xmheck.prototype.toXml = function(object) {
    var _self = this,
        xml = {},
        builder = new xml2js.Builder();
    return builder.buildObject(object)
                  .replace(_self.opentag,'')
                  .replace(_self.closetag,'');
}

Xmheck.prototype.loadXml = function(file, removeXmlTag) {
    removeXmlTag = removeXmlTag || false;
    var split = file.split(':');
    node = split[0];
    resolvedFile = this.resolveFile(file);
    if (resolvedFile === undefined) {
        throw new Error('Unable to resolve file ' + file);
    }

    file = fs.readFileSync(resolvedFile).toString();
    if (removeXmlTag) {
        file = file.replace(/\<\?xml.*\>\n/,'');
    }
    return cheerio.load(file, {xmlMode: true});
}

Xmheck.prototype.resolveFile = function(file) {

    if (this.pathCache[file] === undefined) {
        this.pathCache[file] = null;

        var resolvedFile = _.chain(this.includes)
        .map(function(includePath) {
                return path.resolve(includePath + '/' + file.replace(/^\//,''));
            })
        .find(
            function(expandedPath) {
                return fs.existsSync(expandedPath);
            })
        .value();
        this.pathCache[file] = resolvedFile;
    }
    return this.pathCache[file];
}



module.exports = exports = Xmheck;
