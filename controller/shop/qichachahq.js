/**
 * 获取企查查数据并存储,根据淘宝高质量代理列表取数，10线程每分钟160+数据
 */

let querystring = require('querystring');
let axios = require('axios');

let util = require('../util/common');
let query = require('../../schema/mysql');

let parser = require('../util/htmlParser');

let settings = require('../util/urlList.js');
let sqlParser = require('../util/sqlParser');
let fs = require('fs');

let proxyList = [];
// 10进程并发取数
const THREAD_NUM = 10;

// 爬取状态开关
let stopCraw = false;

async function init() {

    startTask();
    // 2分钟自动刷新一次代理列表
    setInterval(() => {
        //  停止上次开始模式
        stopCraw = true;
        // 3秒后开始采集
        setTimeout(() => {
            startTask();
        }, 3000)
    }, 60 * 1000);

}

async function startTask() {
    await refreshProxy();
    // 重新开始新的采集线程
    stopCraw = false;
    for (let i = 0; i < THREAD_NUM && !stopCraw; i++) {
        let CUR_THREAD_IDX = i;
        getCompanyFromDb(CUR_THREAD_IDX);
    }
}

// 获取淘宝高质量IP列表
async function refreshProxy() {
    let url = 'http://proxy.httpdaili.com/api.asp?ddbh=real&old=&noinfo=true&sl=10&text=true';
    await axios
        .get(url)
        .then(res => {
            let html = res
                .data
                .replace(/\r/g, '');
            proxyList = html
                .trim()
                .split('\n')
                .map(item => {
                    let port = item.split(':')[1],
                        host = item.split(':')[0];
                    return {host, port, status: 9}
                })
        });
}

function getCompanySqlByPage(CUR_THREAD_IDX, page) {
    // 多线程，将id取余则可多个线程同时取数
    return `select * from (select @rownum:=@rownum+1 rownum,a.* from (SELECT b.id,concat('http://www.qichacha.com',b.href) href FROM (select @rownum:=0) a,companyindex b where b.item_flag = 0) a) a where a.rownum%${THREAD_NUM} = ${CUR_THREAD_IDX} limit ${ (page - 1) * 100},100`;
}

// 从数据库中获取公司列表；
async function getCompanyFromDb(CUR_THREAD_IDX) {
    let isFinished = false;
    // 按100页获取数据
    for (let i = 1; !isFinished && !stopCraw; i++) {
        console.log(`线程${CUR_THREAD_IDX}正在读取第${i}页数据，每页100条.`)
        let sql = getCompanySqlByPage(CUR_THREAD_IDX, i);
        let companys = await query(sql);
        if (companys.length < 100) {
            isFinished = true;
        }
        for (let j = 0; j < companys.length && !stopCraw;) {
            let havedata = await getCompanyDetail(companys[j], CUR_THREAD_IDX);
            // 如果数据加载失败，切换代理，继续抓取
            if (!havedata) {
                console.log('数据抓取失败，将启用下一个代理结点。')
                await refreshProxy();
            } else {
                console.log(`第${j + 1}/${companys.length}条数据采集完毕`);
                j++;
            }
        }
    }
}

// 抓取公司详情
async function getCompanyDetail(company, CUR_THREAD_IDX) {
    let url = company.href;

    console.log('正在使用代理' + CUR_THREAD_IDX + '获取数据:\n');
    let option = {
        method: 'get',
        url,
        responseType: 'text',
        proxy: proxyList[CUR_THREAD_IDX],
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHT' +
                'ML, like Gecko) Chrome/60.0.3112.113 Mobile Safari/537.36',
        timeout: 5000
    };
    console.log('线程' + CUR_THREAD_IDX, option.proxy);
    // 2s以内代理连接失效，自动转换
    if (typeof option.proxy == 'undefined') {
        console.log('线程' + CUR_THREAD_IDX + '代理读取失败');
        return false;
    }
    let html = await axios(option)
        .then(res => res.data)
        .catch(e => {
            console.log('线程' + CUR_THREAD_IDX + '数据抓取失败');
            console.log(e.message);
            return '';
        });
    console.log('线程' + CUR_THREAD_IDX + '数据获取完毕');
    if (html == '') {
        console.log('无返回数据');
        return false;
    } else if (html.slice(0, 8) == '<script>') {
        console.log('线程' + CUR_THREAD_IDX, html);
        return false;
    } else if (html.slice(0, 14) == '<html><script>' || html.includes('http://www.baidu.com/search/error.html')) {
        console.log('线程' + CUR_THREAD_IDX + '校验失败');
        return false;
    }
    
    let result = await handleCompanyDetail(html, company.id).catch(e => {
        console.log(e.message);
        return false;
    }).then(res => true);
    console.log('线程' + CUR_THREAD_IDX + '处理非结构化数据');
    return result;
}

async function handleCompanyDetail(html, cid) {

    let companyDetail = parser.companyDetail(html);
    let detail = companyDetail[0].baseInfo;
    detail.title = companyDetail[0].title;
    detail.address = companyDetail[0].contactInfo2.address;
    detail.homepage = companyDetail[0].contactInfo2.homepage;
    detail.tel = companyDetail[0].contactInfo.tel;
    detail.email = companyDetail[0].contactInfo.email;
    detail.updated_at = companyDetail[0].times.updated_at;
    detail.rec_date = companyDetail[0].times.rec_date;

    let sql = sqlParser.companyDetail(detail);
    // console.log(sql);
    let inserts = await query(sql);

    let shareHolder = parser.shareHolder(html);
    if (shareHolder[0].data.length) {
        sql = sqlParser.shareholderDetail(shareHolder[0].data, inserts.insertId);
        //  console.log(sql);

        if (!sql.includes('undefined')) {
            await query(sql);
        }
    }

    let managers = parser.managers(html);
    if (managers[0].data.length) {
        sql = sqlParser.managerDetail(managers[0].data, inserts.insertId);
        // console.log(sql);
        if (!sql.includes('undefined')) {
            await query(sql);
        }
    }

    sql = `update companyindex set item_flag=1 where id = ${cid}`;
    await query(sql);
}

module.exports = {
    init
};