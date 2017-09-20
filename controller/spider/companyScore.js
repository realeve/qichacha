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
let cheerio = require('cheerio');

let proxyList = [];

// 20组独立IP双开
const IPNUMS = 1;

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
    }, 90 * 1000);

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

function getTaskList(page) {
    return `select distinct title from company_detail a where length(title)>9 and a.status=0 limit ${ (page - 1) * 100},100`;
}

function getTaskListByPage(CUR_THREAD_IDX, page) {
    // 多线程，将id取余则可多个线程同时取数
    return `select * from (select @rownum:=@rownum+1 rownum,a.* from (SELECT distinct title FROM (select @rownum:=0) a,company_detail b where b.status = 0 and length(b.title)>9) a) a where a.rownum%${THREAD_NUM} = ${CUR_THREAD_IDX} limit ${ (page - 1) * 100},100`;
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
                // 试错100次时重置
                if (TRY_TIMES >= THREAD_NUM * 5) {
                    // util.sleep(1000);
                    await refreshProxy();
                }
            } else {
                console.log(`第${j + 1}/${companys.length}条数据采集完毕`);
                j++;
            }
        }
    }
}

// 抓取公司详情
async function getCompanyDetail(company,CUR_THREAD_IDX) {
    let url = 'https://www.tianyancha.com/search?key=' + company.title;
    let PROXINDEX = CUR_THREAD_IDX % IPNUMS;
    
    console.log('正在使用代理' + CUR_THREAD_IDX + '获取数据:\n');
    
    let option = {
        method: 'get',
        url:'https://www.tianyancha.com/search?key='+encodeURI(company.title), 
        // proxy: proxyList[PROXINDEX], 
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;' +
                'q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)' +
                ' Chrome/60.0.3112.113 Safari/537.36',
            'Upgrade-Insecure-Requests': 1
        },
        timeout: 5000
    };

   // console.log('线程' + CUR_THREAD_IDX, option.proxy);   

    let html = await axios(option)
        .then(res => res.data)
        .catch(e => {
            console.log('线程' + CUR_THREAD_IDX + '代理读取失败');
            console.log(e.message);
            return '';
        });

    console.log('线程' + CUR_THREAD_IDX + '数据获取完毕');
    
    let noinfo_flag = false;
    if (html.includes('没有找到相关结果')) {
        noinfo_flag=true;
    } else if (html.includes('我们只是确认一下你不是机器人')) {
        console.log('线程' + CUR_THREAD_IDX + '校验失败');        
        return false;
    }else if (html ==''){
        return false;
    }

    let result = await handleDetail(html, company.title,noinfo_flag).catch(e => {
        console.log(e.message);
        return false;
    }).then(res => true);
    console.log('处理非结构化数据完毕');
    return result;
}

async function handleDetail(html, title,noinfo_flag) {

    let detail = !noinfo_flag?parser.companyScore(html):{
        score:-1,
        tianyan_url:'',
        status:-1
    };    
    let sql = `update company_detail set score='${detail.score}',status=${detail.status},tianyan_href='${detail.tianyan_href}' where title='${title}'`;
    if(sql.includes('undefined')){
        sql =  `update company_detail set status=-1 where title='${title}'`;
    }
    await query(sql);
}

module.exports = {
    init
};