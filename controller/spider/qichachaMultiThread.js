/**
 * 本机单IP获取企查查数据并存储
 */

let querystring = require('querystring');
let axios = require('axios');

let util = require('../util/common');
let query = require('../../schema/mysql');

let parser = require('../util/htmlParser');

let settings = require('../util/urlList.js');
let sqlParser = require('../util/sqlParser');
let fs = require('fs');

// 是否需要存储相应Html文件至本地
let SAVE_HTML_FILES = false;

let proxyList = [];

// 20组独立IP双开
const IPNUMS = 20;

// 每组IP开3个链接
const LINK_PER_THREAD = 1;

//总并发
const THREAD_NUM = LINK_PER_THREAD * IPNUMS;

let TRY_TIMES = 0;

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
        }, 5000)
    }, 120 * 1000);

}

async function startTask() {
    await refreshProxy();
    // 重新开始新的采集线程
    stopCraw = false;
    for (let i = 0; i < THREAD_NUM && !stopCraw; i++) {
        let CUR_THREAD_IDX = i;
        getCompanyFromDb(CUR_THREAD_IDX);
    }
    await recordProxy();
}

// 获取淘宝高质量IP列表
async function refreshProxy() {
    TRY_TIMES = 0;
    let url = 'http://proxy.httpdaili.com/api.asp?ddbh=realeve&old=&noinfo=true&sl=20&text=true';
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
                    return {host, port}
                })

        });
}

async function recordProxy() {
    let rec_time = util.getNow();
    let str = proxyList.map(item => `('${item.host}','${item.port}','${rec_time}')`);
    let sql = 'insert into proxy_list(ip,port,rec_time) values';
    await query(sql + str.join(','));
}

function getTaskList(page) {

    return `SELECT id,concat('http://www.qichacha.com',href,'.html') href FROM task_list where status = 0 limit ${ (page - 1) * 100},100`;
}

function getTaskListByPage(CUR_THREAD_IDX, page) {
    // 多线程，将id取余则可多个线程同时取数
    return `select * from (select @rownum:=@rownum+1 rownum,a.* from (SELECT distinct concat('http://www.qichacha.com',href,'.html') href FROM (select @rownum:=0) a,task_list b where b.status = 0) a) a where a.rownum%${THREAD_NUM} = ${CUR_THREAD_IDX} limit ${ (page - 1) * 100},100`;
}

// 从数据库中获取公司列表；
async function getCompanyFromDb(CUR_THREAD_IDX) {
    let isFinished = false;
    // 按100页获取数据
    for (let i = 1; !isFinished && !stopCraw; i++) {
        console.log(`线程${CUR_THREAD_IDX}正在读取第${i}页数据，每页100条.`)
        let companys = await query(getTaskListByPage(CUR_THREAD_IDX, i));
        if (companys.length < 100) {
            isFinished = true;
        }

        for (let j = 0; j < companys.length && !stopCraw;) {
            let havedata = await getCompanyDetail(companys[j], CUR_THREAD_IDX);

            // 如果数据加载失败，切换代理，继续抓取
            if (!havedata) {
                console.log('数据抓取失败，将启用下一个代理结点。')
                TRY_TIMES++;
                // 试错100次时重置 if (TRY_TIMES >= THREAD_NUM * 5) {     // util.sleep(1000); await
                // refreshProxy(); }
            } else {
                console.log(`第${j + 1}/${companys.length}条数据采集完毕`);
                j++;
            }
        }
    }
}

async function saveHtml2Disk(content, data) {
    let fileName = util.getMainContent() + '/controller/data/html/' + content;
    fs.writeFileSync(fileName, data, 'utf8');
}

// 抓取公司详情
async function getCompanyDetail(company, CUR_THREAD_IDX) {
    let url = company.href;

    let PROXINDEX = CUR_THREAD_IDX % IPNUMS;

    console.log('正在使用代理' + CUR_THREAD_IDX + '获取数据:\n');
    let option = {
        method: 'get',
        url,
        responseType: 'text',
        proxy: proxyList[PROXINDEX],
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;' +
                    'q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)' +
                    ' Chrome/60.0.3112.113 Safari/537.36'
        },
        timeout: 30 *1000
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
            console.log('线程' + CUR_THREAD_IDX + '代理读取失败');
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

    if (SAVE_HTML_FILES) {
        let filename = url.replace('http://www.qichacha.com/', '');
        saveHtml2Disk(filename, html);
        console.log('存储至本地硬盘');
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