"use strict";

hexo.theme.on('processAfter', function () {
  if (!hexo.theme.config.search || !hexo.theme.config.search.enable) {
    return;
  }

  var pathFn = require('path');

  var _require = require('hexo-util'),
      stripHTML = _require.stripHTML;

  var config = hexo.theme.config.search; // 生成搜索数据库
  // 设置默认搜索路径

  if (!config.path) {
    config.path = 'search.json';
  }

  if (pathFn.extname(config.path) === '.json') {
    hexo.extend.generator.register('searchdb', function (locals) {
      var url_for = hexo.extend.helper.get('url_for').bind(this);

      var parse = function parse(item) {
        var _item = {};
        if (item.title) _item.title = item.title;
        if (item.date) _item.date = item.date;
        if (item.path) _item.url = url_for(item.path);

        if (item.tags && item.tags.length > 0) {
          _item.tags = [];
          item.tags.forEach(function (tag) {
            _item.tags.push([tag.name, url_for(tag.path)]);
          });
        }

        _item.categories = [];

        if (item.categories && item.categories.length > 0) {
          item.categories.forEach(function (cate) {
            _item.categories.push([cate.name, url_for(cate.path)]);
          });
        } else {
          _item.categories.push(['undefined', '']);
        }

        if (hexo.theme.config.search.content && item.content) {
          _item.content = stripHTML(item.content.trim().replace(/<pre([\s\S]*?)<\/pre>/g, '')).replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(new RegExp('(https?|ftp|file)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]', 'g'), '');
        }

        return _item;
      };

      var searchfield = config.field;
      var posts, pages;

      if (searchfield) {
        if (searchfield === 'post') {
          posts = locals.posts.sort('-date');
        } else if (searchfield === 'page') {
          pages = locals.pages;
        } else {
          posts = locals.posts.sort('-date');
          pages = locals.pages;
        }
      } else {
        posts = locals.posts.sort('-date');
      }

      var res = [];

      if (posts) {
        posts.each(function (post) {
          res.push(parse(post));
        });
      }

      if (pages) {
        pages.each(function (page) {
          res.push(parse(page));
        });
      }

      return {
        path: config.path,
        data: JSON.stringify(res)
      };
    });
  } // 生成搜索页面


  hexo.extend.generator.register('searchPage', function (locals) {
    return {
      path: 'search/index.html',
      data: locals.posts,
      layout: 'search'
    };
  });
});