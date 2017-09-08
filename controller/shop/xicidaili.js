/**
 * 获取西刺数据并存储
 */

let axios = require('axios');
let util = require('../util/common');
let query = require('../../schema/mysql');
let parser = require('../util/htmlParser');
let fs = require('fs');

async function init() {
    getXiciProxyList();
}

async function getXiciProxyList() {
    for (let i = 2; i < 107; i++) {
        let html = getHtmlFromDisk(i);
        await handleProxyHtml(html, i);
    }
}

function getProxySql(proxyList) {
    let sql = `insert into proxyList(host,port,status) values `;
    let strs = proxyList.map(proxy => {
        return `('${proxy.host}','${proxy.port}',${proxy.status})`;
    })
    return sql + strs.join(',');
}

async function saveHtml2Disk(data, name) {
    let fileName = util.getMainContent() + '/controller/data/xici/' + name;
    fs.writeFileSync(fileName, data, 'utf8');
}

function getHtmlFromDisk(idx) {
    let fileName = util.getMainContent() + '/controller/data/xici/page_' + idx+'.html';
    return fs.readFileSync(fileName, 'utf-8');
}

// 抓取公司详情
async function getProxyInfo(page) {
    let url = 'http://www.xicidaili.com/nn/' + page;

    let option = {
        method: 'get',
        url,
        'User-Agent': ' Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko' +
                ') Chrome/60.0.3112.113 Safari/537.36',
        // timeout: 3000
    };

    // 2s以内代理连接失效，自动转换

    let html = await axios(option)
        .then(res => res.data)
        .catch(e => {
            console.log('数据抓取失败');
            console.log(e.message);
            return '';
        });

    await saveHtml2Disk(html, 'page_' + page + '.html');
    await handleProxyHtml(html, page);
    return true;
}

async function handleProxyHtml(html, page) {
    let xiciInfo = parser.xiciProxy(html);
    console.log(`正在存储第${page}页数据`);
    let proxies = xiciInfo[0];
    if (Reflect.has(proxies, 'data') && proxies.data.length) {
        let sql = getProxySql(proxies.data);
        await saveHtml2Disk(sql, 'page_' + page + '.sql');
    }
}

module.exports = {
    init
};