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

async function init() {
    /* 
  // step1：获取并存储省份数据
  await getProvinceIndex();
  // step2：从数据库中读取省份数据,然后获取各省公司列表
  let provinces = await getPorvFromDb();
  await getCompanyByProvince(provinces);
 */

    // step3: 从数据库中获取待处理详情的公司列表
    let count = 0;
    for (let i = 1;;) {
        count++;
        console.log('第', count, '次迭代');
        await getCompanyFromDb();
    }

}

function getTaskList(page) {

    return `SELECT id,concat('http://www.qichacha.com',href,'.html') href FROM task_list where status = 0 limit ${ (page - 1) * 100},100`;
}

// 从数据库中获取公司列表；
async function getCompanyFromDb() {
    let isFinished = false;
    // 按100页获取数据
    for (let i = 1; !isFinished; i++) {
        console.log(`正在读取第${i}页数据，每页100条.`)
        let companys = await query(getTaskList(i));
        if (companys.length < 100) {
            isFinished = true;
        }
        for (let j = 0; j < companys.length;) {
            let havedata = await getCompanyDetail(companys[j]);

            // 如果数据加载失败，切换代理，继续抓取
            if (!havedata) {
                console.log('数据抓取失败，将启用下一个代理结点。')
                continue;
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
async function getCompanyDetail(company) {
    let url = company.href;

    let option = {
        method: 'get',
        url,
        responseType: 'text',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHT' +
            'ML, like Gecko) Chrome/60.0.3112.113 Mobile Safari/537.36',
        timeout: 3000
    };

    let html = await axios(option)
        .then(res => res.data)
        .catch(e => {
            console.log('数据抓取失败');
            console.log(e.message);
            return '';
        });

    if (html == '') {
        return false;
    } else if (html.slice(0, 8) == '<script>') {
        console.log(html);
        return false;
    } else if (html.slice(0, 14) == '<html><script>' || html.includes('http://www.baidu.com/search/error.html')) {
        console.log('无效数据:\n', html);
        return false;
    }

    if (SAVE_HTML_FILES) {
        let filename = url.replace('http://www.qichacha.com/', '');
        saveHtml2Disk(filename, html);
        console.log('存储至本地硬盘');
    }

    let result = await handleCompanyDetail(html, url).catch(e => {
        console.log(e.message);
        return false;
    }).then(res => true);
    console.log('处理非结构化数据完毕');
    return result;
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

    let url = href.replace('http://www.qichacha.com', '').replace('.html', '');
    sql = `update task_list set status=1 where href = '${url}'`;
    await query(sql);
}

module.exports = {
    init
};