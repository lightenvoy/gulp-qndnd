'use strict';

var path = require('path');
var util = require('gulp-util');
var log = util.log;
var colors = util.colors;
var PluginError = util.PluginError;
var map = require('map-stream');
var QN = require('qn');
var assign = require('object-assign');
var slash = require('slash');
var getEtag = require('./lib/qnetag');

var PLUGIN_NAME = 'gulp-qndn';
var DEFAULTS = {
    flatten: false, // flatten path
    prefix: ''
};

exports.upload = function(options) {
    options = assign({}, DEFAULTS, options);

    var client = QN.create(options.qn);

    if (!options.qn) {
        throw new PluginError(PLUGIN_NAME, 'Missing Qiniu dn configs!');
    }

    // TODO: 根据文件 hash 判断文件是否改变，只上传改变的文件
    return map(function(file, callback) {
        if (file.isNull()) {
            callback(null, file);
            return;
        }

        var fileKey = path.join(options.prefix, options.flatten ?
            path.basename(file.path) : file.relative);

        // Both stream and buffer are supported
        var qufileKey = fileKey.replace(/\\/g, "/");
        if (options.qn.delete) {
            client.delete(qufileKey, function(err, result) {
                if (err) {
                    log('Error Delete:', colors.red(new PluginError(PLUGIN_NAME, err).message), qufileKey);
                } else {
                    log('Delete:', colors.green(options.qn.domain + '/' + qufileKey));
                }
                client.upload(file.contents, { key: slash(fileKey) }, function(err, result) {
                    if (err) {
                        log('Error', colors.red(new PluginError(PLUGIN_NAME, err).message));
                    } else {
                        log('Uploaded:', colors.green(result.url));
                    }
                });
            });
        } else {
            client.upload(file.contents, { key: slash(fileKey) }, function(err, result) {
                if (err) {
                    log('Error', colors.red(new PluginError(PLUGIN_NAME, err).message));
                } else {
                    log('Uploaded:', colors.green(result.url));
                }
            });
        }
        callback(null, file);
    });
};

/*exports.delete = function() {

};

exports.download = function() {

}*/
