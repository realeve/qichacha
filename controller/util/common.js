let cheerio = require('cheerio');
let POSTAG = require('segment').POSTAG;
let mail = require('./sendmail');

let http = require('https');
let querystring = require('querystring');

function getParameter(a, b) {
    var c = b || document.location.href,
        d = new RegExp("(?:^|&|[?]|[/])" + a + "=([^&]*)"),
        e = d.exec(c);
    return e ? decodeURIComponent(e[1]) : null
}

async function getPostData(config, data) {
    return new Promise((resolve, reject) => {
        let request = http.request(config, (response) => {
            let result = '';
            response.on('data', (chunk) => {
                result += chunk;
            }).on('end', () => {
                resolve(result)
            });
        }).on('error', (e) => {
            console.log(`errInfo: ${e.message}`);
            mail.send({
                subject: 'HTTP Post 请求出错',
                html: `${getNow()},errorInfo:\n${e.message}\n http://stackoverflow.com/search?q=${encodeURI(e.message)} `
            });
            reject(e);
        }).on('timeout', () => {
            console.warn('http request timeout:' + config.host + config.path);
            resolve('timeout');
        });
        request.write(data);
        request.end();
    });
}

function jsRight(sr, rightn) {
    return sr.substring(sr.length - rightn, sr.length)
}

function getNow(type = 1) {
    let date = new Date()

    let a = date.getFullYear()
    let b = jsRight(('0' + (date.getMonth() + 1)), 2)
    let c = jsRight(('0' + date.getDate()), 2)
    let d = jsRight(('0' + date.getHours()), 2)
    let e = jsRight(('0' + date.getMinutes()), 2)
    let f = jsRight(('0' + date.getSeconds()), 2)
    let output
    switch (type) {
        case 0:
            output = a + '年' + b + '月' + c + '日'
            break
        case 1:
            output = a + '-' + b + '-' + c + ' ' + d + ':' + e + ':' + f
            break
        case 2:
            output = a + '年' + b + '月' + c + '日' + d + '时' + e + '分' + f + '秒'
            break
        case 3:
            output = a + '-' + b + '-' + c + ' ' + d + ':' + e
            break
        case 4:
            output = a + '年' + b + '月' + c + '日  ' + d + '时' + e + '分'
            break
        case 5:
            output = b + '/' + c + '/' + a
            break
        case 6:
            output = a + '-' + b + '-' + c
            break
        case 7:
            output = a + '-' + b

            break
        case 8:
            output = a + b + c
            break
    }
    return output
}


/**
 * @param {any} options={
 *  html:'',
 *  parentNode:'', // 主结点
 *  children:{
 *      node:'', //子结点名
 *      name:'', //键值
 *      formatter(selecter) //格式转换,
 *      mode:0/1(0：默认，返回array，数据按children中定义；1：返回object,key按children定义)
 *  }
 * }
 */
function parseHTML(options) {
    let $ = cheerio.load(options.html);
    let data = [];
    let parentNode = (Reflect.has(options, 'nodeIdx')) ? $(options.parentNode).eq(options.nodeIdx) : $(options.parentNode);

    if (parentNode.length === 0) {
        return data;
    }
    // detail: http://es6.ruanyifeng.com/?search=delete&x=0&y=0#docs/reflect
    if (Reflect.has(options, 'mode')) {
        let data = {};
        parentNode.each((i, pNode) => {
            let item = options.children[i];
            let node = (Reflect.has(item, 'node')) ? $(pNode).find(item.node) : $(pNode);
            data[item.name] = (typeof item.formatter === 'function') ? item.formatter(node) : node.text().trim();
            if (typeof options.formatter == 'function') {
                data = options.formatter(data);
            }
        });
        return data;
    }

    parentNode.each((i, pNode) => {
        let nodeData = {};
        options.children.forEach(item => {
            let node = (Reflect.has(item, 'node')) ? $(pNode).find(item.node) : $(pNode);
            if (typeof item.formatter === 'function') {
                nodeData[item.name] = item.formatter(node);
            } else {
                let text = node.text().trim();
                nodeData[item.name] = text == '' ? 0 : text;
            }
        });

        if (typeof options.formatter == 'function') {
            nodeData = options.formatter(nodeData);
        }
        data.push(nodeData);
    });
    return data;
}

function handleWordSegment(wordList) {
    let words = wordList.map(item => {
        return {
            ps: POSTAG.chsName(item.p).split(' ')[0],
            w: item.w
        };
    });

    let comment = [];
    if (words[0].ps.includes('形容词')) {
        comment.push(words[0].w);
    }

    for (var i = 1; i < words.length; i++) {
        var item = words[i];
        if (item.ps.includes('形容词')) {
            if (words[i - 1].ps.includes('副词')) {
                comment.push(words[i - 1].w + item.w);
            } else {
                comment.push(item.w);
            }
        } else if (item.ps.includes('名词') || item.ps.includes('动词')) {
            if (item.w.length > 1) {
                comment.push(item.w);
            }
        }

    }
    return {
        comment,
        words
    };
}

// 程序主目录
function getMainContent() {
    let PROGRAM_NAME = 'qichacha';
    let str = process.cwd().split(PROGRAM_NAME)[0] + PROGRAM_NAME;
    return str.replace(/\\/g, '/');
}

function text_filter(text) {
    text = text.replace(/<[\/\s]*(?:(?!div|br)[^>]*)>/g, '');
    text = text.replace(/<\s*div[^>]*>/g, '<div>');
    text = text.replace(/<[\/\s]*div[^>]*>/g, '</div>');
    text = text.replace(/ /g, '');
    return text;
}

// 随机休眠x秒
function sleep(ms = 1000) {
    return new Promise(r => setTimeout(r, ms));
}

// 数组去重
function arrUnique(uArr) {
    var arr = [];
    var set = new Set(uArr);
    set.forEach(function(item) {
        arr.push(item);
    });
    return arr;
};

module.exports = {
    getNow,
    parseHTML,
    getMainContent,
    text_filter,
    sleep,
    getPostData,
    mail,
    arrUnique
}