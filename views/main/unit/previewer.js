'use strict';

const YAML = require('yamljs');
const Hexo = require('./hexo');

var rEscapeContent = /<escape(?:[^>]*)>([\s\S]*?)<\/escape>/g;
var rSwigVar = /\{\{[\s\S]*?\}\}/g;
var rSwigComment = /\{#[\s\S]*?#\}/g;
var rSwigBlock = /\{%[\s\S]*?%\}/g;
var rSwigFullBlock = /\{% *(.+?)(?: *| +.*)%\}[\s\S]+?\{% *end\1 *%\}/g;
var placeholder = '\uFFFC';
var rPlaceholder = /(?:<|&lt;)\!--\uFFFC(\d+)--(?:>|&gt;)/g;

global.ctx = global.hexo = new Hexo();


function Previewer() {
    this.loaddir(hexo.config.tagdir);
}

Previewer.prototype.loaddir = function (dir) {
    hexo.extend.helper.get('loaddir')(dir);
}

Previewer.prototype.render = function (content, MoeMark, options) {
    var data = {
		//highlightEx:true,
		content:content		
	};
    var cache = [];
    var tag = hexo.extend.tag;

    function escapeContent(str) {
        return '<!--' + placeholder + (cache.push(str) - 1) + '-->';
    }

    function before_post_render() {
        data.content = data.content.replace(/^---+([\w\W]+?)---+/, function () {
            data = hexo.extend.helper.get('extend')(data, YAML.parse(arguments[1]))
            return '';
        });
        hexo.execFilterSync('before_post_render', data, {context: hexo});
    }

    function escapeTag() {
        data.content = data.content
            .replace(rEscapeContent, escapeContent)
            .replace(rSwigFullBlock, escapeContent)
            .replace(rSwigBlock, escapeContent)
            .replace(rSwigComment, '')
            .replace(rSwigVar, escapeContent);
    }

    function markdownContent() {
        MoeMark(data.content, options, function (err, content) {
            data.content = content;
        });
    }

    function backTag() {
        // Replace cache data with real contents
        data.content = data.content.replace(rPlaceholder, function () {
            return cache[arguments[1]];
        });
        // Render with Nunjucks
        data.content = tag.render(data.content, data);
    }

    function after_post_render() {
        hexo.execFilter('after_post_render', data, {context: hexo});

    }

    try {
        before_post_render();
        escapeTag();
        markdownContent();
        backTag();
        after_post_render();
    } catch (err) {
        console.log(err);
    } finally {
        return data.content;
    }

};

module.exports = Previewer;
