"use strict";

//对特殊符号进行转义
function searchEscape(keyword) {
  var htmlEntityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
  };
  return keyword.replace(/[&<>"'/]/g, function (i) {
    return htmlEntityMap[i];
  });
}

function regEscape(keyword) {
  var regEntityMap = {
    '{': '\\\{',
    '}': '\\\}',
    '[': '\\\[',
    ']': '\\\]',
    '(': '\\\(',
    ')': '\\\)',
    '?': '\\\?',
    '*': '\\\*',
    '.': '\\\.',
    '+': '\\\+',
    '^': '\\\^',
    '$': '\\\$'
  };
  return keyword.replace(/[\{\}\[\]\(\)\?\*\.\+\^\$]/g, function (i) {
    return regEntityMap[i];
  });
}

function getParam(reqParam) {
  // 获取参数
  reqParam = reqParam.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var paraReg = new RegExp('[\\?&]' + reqParam + '=([^&#]*)');
  var results = paraReg.exec(window.location);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function setNotice(type, info) {
  //设置搜索结果信息
  var infoStyle = {
    success: "#29c7ac",
    danger: "#e94560",
    info: "#414141"
  };
  var searchInfo = document.getElementById('search-notice');
  searchInfo.setAttribute("style", "margin: 32px 0;padding: 10px;width: 80%;background-color:".concat(infoStyle[type]));
  searchInfo.innerText = info;
}

function clearPosts() {
  //用于清空搜索结果
  var resultSectionElement = document.getElementById('result-posts');
  resultSectionElement.innerHTML = '';
}

function createPosts(resArr) {
  //生成搜索结果页
  var resultSectionElement = document.getElementById('result-posts');
  var resultString = '';
  resArr.forEach(function (resInfo) {
    var pageInfo = resInfo[0];
    var pageTags = '';
    pageInfo.tags.forEach(function (tag) {
      var postTagTemplate = "<a class=\"tag\" href=\"".concat(tag[1], "\" rel=\"tag\">").concat(tag[0], "</a>");
      pageTags += postTagTemplate;
    });
    var postTemplate = "\n        <div style=\"margin-bottom:30px\">\n            <div class=\"post-title\">\n                <h3><a href=\"".concat(pageInfo.link, "\">").concat(pageInfo.title, "</a></h3>\n            </div>\n\n            <div class=\"post-content\">\n                <p>... ").concat(pageInfo.content, " ...</p>\n            </div>\n\n            <div class=\"post-footer\">\n                <div class=\"meta\">\n                    <div class=\"info\">\n                        <i class=\"fa fa-sun-o\"></i>\n                        <span class=\"date\">").concat(pageInfo.date, "</span>\n                        <i class=\"fa fa-tag\"></i>\n                        ").concat(pageTags, "\n                    </div>\n                </div>\n            </div>\n        </div>\n        ");
    resultString += postTemplate;
  });
  resultSectionElement.innerHTML = resultString;
}

function loadDataSearch(searchDataFile, skeys) {
  //正式搜索算法
  fetch(searchDataFile).then(function (res) {
    setNotice('success', '✔ 搜索引擎已就绪。'); //搜索数据 text 转 json

    return res.json();
  }).then(function (datas) {
    var startTime = performance.now();
    var resultArray = [];
    var resultCount = 0;
    var keywords = skeys.trim().toLowerCase().split(/\s/);
    datas.forEach(function (data) {
      if (typeof data.title === 'undefined' || typeof data.content === 'undefined') {
        return;
      } // 开始匹配，匹配算法参见 https://candinya.com/posts/local-elegant-search/#%E6%96%87%E7%AB%A0%E6%A3%80%E7%B4%A2


      var matched = false;
      var dataTitle = data.title.trim().toLowerCase();
      var dataContent = data.content ? data.content.trim().replace(/<[^>]+>/g, '').toLowerCase() : '';
      var dataWeight = 0;
      var indexs = {};
      indexs.title = -1;
      indexs.content = -1;
      indexs.firstOccur = -1;
      indexs.lastOccur = -1;
      var halfLenth = 100;

      if (dataTitle) {
        keywords.forEach(function (keyword) {
          indexs.title = dataTitle.indexOf(keyword);
          indexs.content = dataContent.indexOf(keyword);

          if (indexs.title !== -1 || indexs.content !== -1) {
            matched = true;

            if (indexs.content !== -1) {
              if (indexs.firstOccur > indexs.content || indexs.firstOccur === -1) {
                indexs.firstOccur = indexs.content;
              }

              if (indexs.lastOccur < indexs.content) {
                indexs.lastOccur = indexs.content;
              }
            } else {
              //命中 title，但正文 conten 未命中时
              indexs.firstOccur = halfLenth;
              indexs.lastOccur = 0;
            }

            dataWeight += indexs.title !== -1 ? 2 : 0;
            dataWeight += indexs.content !== -1 ? 1 : 0;
            resultCount++;
          }
        });
      } // 设置高亮


      if (matched) {
        var tPage = {};
        tPage.title = data.title;
        tPage.date = new Date(data.date).toLocaleDateString();
        tPage.tags = data.tags || [];
        tPage.category = data.categories[0] || [];
        tPage.link = data.url;
        keywords.forEach(function (keyword) {
          var regS = new RegExp(regEscape(keyword) + '(?!>)', 'gi');
          tPage.title = tPage.title.replace(regS, '<m>$&</m>');
        });

        if (indexs.firstOccur >= 0) {
          //const halfLenth = 100;
          var start = indexs.firstOccur - halfLenth;
          var end = indexs.lastOccur + halfLenth;

          if (start < 0) {
            start = 0;
          }

          if (start === 0) {
            end = halfLenth * 2;
          }

          if (end > dataContent.length) {
            end = dataContent.length;
          }

          tPage.content = dataContent.substr(start, end - start);
          keywords.forEach(function (keyword) {
            var regS = new RegExp(regEscape(keyword) + '(?!>)', 'gi');
            tPage.content = tPage.content.replace(regS, '<m>$&</m>');
          });
        }

        resultArray.push([tPage, dataWeight]);
      }
    });

    if (resultCount !== 0) {
      var finishTime = performance.now();
      setNotice('success', '✔ 找到 ' + resultCount + ' 条搜索结果，用时 ' + Math.round((finishTime - startTime) * 100) / 100 + ' 毫秒。');
      resultArray.sort(function (a, b) {
        return b[1] - a[1];
      });
      createPosts(resultArray);
    } else {
      setNotice('danger', '❌ 搜索结果未找到，请更换搜索关键词。');
      clearPosts();
    }

    if (typeof NProgress !== 'undefined') {
      NProgress.done();
    }
  })["catch"](function (error) {
    setNotice('danger', '❗ 错误 : ' + error);
  });
}

function keySearch(skeys) {
  // 设置搜索提示
  setNotice('info', '正在加载搜索文件...'); // 加载数据并搜索

  loadDataSearch(searchDataFile, searchEscape(skeys));
  document.getElementById("tag_block").style.display = "none";
}

function inpSearch() {
  // 单击按钮检索
  var skeys = document.getElementById('search-input').value; // 更新URL

  window.history.pushState({}, 0, window.location.href.split('?')[0] + '?s=' + skeys.replace(/\s/g, '+')); // 开始搜索

  keySearch(skeys);
  return false;
}

(function () {
  var skeys = getParam('s');

  if (skeys !== '') {
    // 存在关键词，把搜索词放到输入框里面
    document.getElementById('search-input').value = skeys; // 开始搜索

    keySearch(skeys);
  }
})();