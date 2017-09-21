/**
 * 获取企查查数据并存储
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
let proxyIdx = [];
let publicProxy = [];

// 是否需要存储相应Html文件至本地
let SAVE_HTML_FILES = false;

// 代理列表表单名，区分淘宝购买与免费爬取的列表
let PROXY_TBL_NAME = 'proxy_list_taobao';
PROXY_TBL_NAME = 'proxy_list_zhima';

const THREAD_NUM = 25;

async function init() {

    // await addZhimaProxy(); await addProxy();
    await startTask();
}

async function startTask() {
    // step3:从数据库中获取待处理详情的公司列表
    for (let i = 0; i <= THREAD_NUM; i++) {
        proxyIdx.push(1);
        publicProxy.push({});
    }
    for (let i = 0; i < THREAD_NUM; i++) {
        let CUR_THREAD_IDX = i;
        await getProxyListFromDb(CUR_THREAD_IDX);
        getCompanyFromDb(CUR_THREAD_IDX);
    }
    console.log('所有信息采集完毕');
}

// 获取芝麻代理
async function addZhimaProxy() {
    let MONEY_PAYED_FOR = 50;
    for (let i = 0; i < MONEY_PAYED_FOR; i++) {
        let success = await addZhimaProxy2DB().catch(e => {
            console.log(e.message);
            break;
        });
        if (!success) {
            console.log(`第${i}/${MONEY_PAYED_FOR}代理列表获取失败，停止获取`);
            break;
        }
        console.log(`第${i}/${MONEY_PAYED_FOR}代理列表插入完毕`);
    }
}

async function addZhimaProxy2DB() {
    let url = 'http://http-webapi.zhimaruanjian.com/getip?num=25&type=2&pro=0&city=0&yys=0&port' +
            '=1&pack=1354&ts=0&ys=0&cs=0&lb=0&sb=0&pb=4&mr=0';
    let html = await axios
        .get(url)
        .then(res => JSON.parse(res.data));

    if (!html.success) {
        return false;
    }
    let strs = html
        .data
        .map(item => `('${item.ip}','${item.port}',0)`);
    if (strs.length) {
        let sql = 'insert into proxy_list_zhima(ip,port,status) values ' + strs.join(',');
        await query(sql);
        console.log('本次共写入' + strs.length + '条数据');
    }
    return strs.length > 0;
}

// 添加购买的IP
async function addProxy() {
    let MONEY_PAYED_FOR = 50;
    for (let i = 0; i < MONEY_PAYED_FOR; i++) {
        let success = await addProxyInfo().catch(e => {
            console.log(e.message);
            break;
        });
        if (!success) {
            break;
        }
        console.log(`第${i}/${MONEY_PAYED_FOR}代理列表插入完毕`);
    }
}

async function addProxyInfo() {
    let order_id = '62695873466522367';
    let url = `http://www.httpdaili.com/api.asp?ddbh=${order_id}&old=1&noinfo=true&sl=1000`;
    let html = await axios
        .get(url)
        .then(res => res.data);

    let proxies = html.split('\r\n')
    let arr = proxies.map(item => {
        let port = item.split(':')[1],
            host = item.split(':')[0];
        return {host, port, status: 0}
    })
    let strs = arr.map(item => `('${item.host}','${item.port}',${item.status})`);
    // 删除最后一条
    strs.pop();
    if (strs.length) {
        let sql = 'insert into proxy_list_taobao(ip,port,status) values ' + strs.join(',');
        await query(sql);
        console.log('本次共写入' + (arr.length - 1) + '条数据');
    }
    return strs.length > 0;
}

async function getProxyListFromDb(CUR_THREAD_IDX) {
    let sql = `select a.rownum id,a.ip host,a.port,a.status from (select @rownum:=@rownum+1 as rownum, b.* from (select @rownum:=0) a,${PROXY_TBL_NAME} b where b.status= 0 ) a where (a.rownum)%${THREAD_NUM} = ${CUR_THREAD_IDX} order by id desc`;

    proxyList[CUR_THREAD_IDX] = await query(sql);
}

function getTaskListByPage(CUR_THREAD_IDX, page) {
    // 多线程，将id取余则可多个线程同时取数
    return `select * from (select @rownum:=@rownum+1 rownum,a.* from (SELECT distinct concat('http://www.qichacha.com',href,'.html') href FROM (select @rownum:=0) a,task_list b where b.status = 0) a) a where a.rownum%${THREAD_NUM} = ${CUR_THREAD_IDX} limit ${ (page - 1) * 100},100`;
}

// 从数据库中获取公司列表；
async function getCompanyFromDb(CUR_THREAD_IDX) {
    let isFinished = false;
    // 按100页获取数据
    for (let i = 1; !isFinished; i++) {
        console.log(`线程${CUR_THREAD_IDX}正在读取第${i}页数据，每页100条.`)
        let companys = await query(getTaskListByPage(CUR_THREAD_IDX, i));

        if (companys.length < 100) {
            isFinished = true;
        }
        for (let j = 0; j < companys.length;) {
            let havedata = await getCompanyDetail(companys[j], CUR_THREAD_IDX);

            // 如果数据加载失败，切换代理，继续抓取
            if (!havedata) {
                proxyIdx[CUR_THREAD_IDX]++;
                if (proxyIdx[CUR_THREAD_IDX] >= proxyList[CUR_THREAD_IDX].length - 1) {
                    isFinished = true;
                    j = companys.length;
                    console.log('线程' + CUR_THREAD_IDX + ':代理信息使用完毕。')
                    break;
                }
                console.log('数据抓取失败，将启用下一个代理结点。')
                continue;
            } else {
                console.log(`第${j + 1}/${companys.length}条数据采集完毕`);
                publicProxy[CUR_THREAD_IDX].status = 1;
                await recordProxyInfo(publicProxy[CUR_THREAD_IDX]);
                j++;
            }
        }
    }
}

async function recordProxyInfo(proxy) {
    let sql = `update ${PROXY_TBL_NAME} set status = ${proxy.status} where id=${proxy.id} and status=0`;
    query(sql);
}

async function saveHtml2Disk(content, data) {
    let fileName = util.getMainContent() + '/controller/data/html/' + content;
    fs.writeFileSync(fileName, data, 'utf8');
}

function getProxy(i, CUR_THREAD_IDX) {
    console.log('\n正在使用代理' + i + '获取数据:');
    publicProxy[CUR_THREAD_IDX] = proxyList[CUR_THREAD_IDX][i-1];
    return publicProxy[CUR_THREAD_IDX];
}

// 抓取公司详情
async function getCompanyDetail(company, CUR_THREAD_IDX) {
    let url = company.href;

    let option = {
        method: 'get',
        url,
        responseType: 'text',
        proxy: getProxy(proxyIdx[CUR_THREAD_IDX], CUR_THREAD_IDX),
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;' +
                    'q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)' +
                    ' Chrome/60.0.3112.113 Safari/537.36'
        },
        // timeout: 10000
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

    if (html == '') {
        publicProxy[CUR_THREAD_IDX].status = -1;
        await recordProxyInfo(publicProxy[CUR_THREAD_IDX]);
        return false;
    } else if (html.slice(0, 8) == '<script>') {
        console.log('线程' + CUR_THREAD_IDX, html);
        publicProxy[CUR_THREAD_IDX].status = 2;
        await recordProxyInfo(publicProxy[CUR_THREAD_IDX]);
        return false;
    } else if (html.slice(0, 14) == '<html><script>' || html.includes('http://www.baidu.com/search/error.html')) {
        console.log('线程' + CUR_THREAD_IDX);
        publicProxy[CUR_THREAD_IDX].status = 3;
        await recordProxyInfo(publicProxy[CUR_THREAD_IDX]);
        return false;
    }

    if (SAVE_HTML_FILES) {
        let filename = url.replace('http://www.qichacha.com/', '');
        saveHtml2Disk(filename, html);
        console.log('线程' + CUR_THREAD_IDX + '存储至本地硬盘');
    }

    let result = await handleCompanyDetail(html, url).catch(async e => {
        console.log(url);
        await recordFailedInfo(url);
        return false;
    }).then(res => true);
    console.log('线程' + CUR_THREAD_IDX + '处理非结构化数据');
    return result;
}

async function recordFailedInfo(url) {
    let sql = `update task_list set status=-1 where href = '${url}'`;
    await query(sql);
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

async function handleCompanyDetail(html, href) {

    let companyDetail = parser.companyDetail2(html);
    companyDetail.href = href;

    let sql = sqlParser.companyDetail2(companyDetail);
    await query(sql);

    let favorite = parser.favoriteInfo(html);
    sql = 'insert into task_list(company_name,href,status) values ';
    let str = favorite.map(item => `('${item.company_name}','${item.href}',0)`);
    sql = sql + str.join(',');
    await query(sql);

    let url = href
        .replace('http://www.qichacha.com', '')
        .replace('.html', '');
    sql = `update task_list set status=1 where href = '${url}'`;
    await query(sql);
}

module.exports = {
    init
};