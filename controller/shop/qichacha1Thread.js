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
  await getCompanyFromDb();
}

function getCompanySqlByPage(page) {
  // 多线程，将id取余则可多个线程同时取数 SELECT id,concat('http://www.qichacha.com',href) href
  // FROM companyindex where item_flag = 0 and id%10 = 1

  return `SELECT id,concat('http://www.qichacha.com',href) href FROM companyindex where item_flag = 0 limit ${ (page - 1) * 100},100`;
}

// 从数据库中获取公司列表；
async function getCompanyFromDb() {
  let isFinished = false;
  // 按100页获取数据
  for (let i = 1; !isFinished; i++) {
    console.log(`正在读取第${i}页数据，每页100条.`)
    let companys = await query(getCompanySqlByPage(i));
    if (companys.length < 100) {
      isFinished = true;
    }
    for (let j = 0; j < companys.length;) {
      let havedata = await getCompanyDetail(companys[j]);

      // 如果数据加载失败，切换代理，继续抓取
      if (!havedata) {
        proxyIdx++;
        if (proxyIdx == proxyList.length - 1) {
          isFinished = true;
          j = companys.length;
          break;
        }
        console.log('数据抓取失败，将启用下一个代理结点。')
        continue;
      } else {
        // if (!havedata) {   isFinished = true;   break;   console.log('数据抓取错误，请重启线程')
        // return; } 下次读取至少等待2.5-3秒
        let sleepTimeLength = (1000 + Math.random() * 200).toFixed(0);
        console.log(`第${j + 1}/${companys.length}条数据采集完毕`);
        // await util.sleep(sleepTimeLength);

        publicProxy.status = 1;
        await recordProxyInfo(publicProxy);
        j++;
      }
    }
  }
}

async function recordProxyInfo(proxy) {
  let sql = `update proxyList set status = ${proxy.status} where id=${proxy.id} and status=0`;
  query(sql);
  console.log('sql executed finish');
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
    // Refer: 'http://www.qichacha.com/index_verify?type=companyview&back=/firm' +
    // url.split('firm')[1],
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
  // console.log('数据获取完毕');
  if (html == '') {
    console.log(html);
    return false;
  } else if (html.slice(0, 8) == '<script>') {
    console.log(html);
    return false;
  }

  if (SAVE_HTML_FILES) {
    let filename = url.replace('http://www.qichacha.com/', '');
    saveHtml2Disk(filename, html);
    console.log('存储至本地硬盘');
  }

  let result = await handleCompanyDetail(html, company.id).catch(e => {
    console.log(e.message);
    return false;
  }).then(res => true);
  console.log('处理非结构化数据完毕');
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
    // console.log(sql);

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

// 抓取省份列表（主列表）
async function getProvinceIndex() {
  let homepage = settings.url.homepage;
  let provinceList = await axios
    .get(homepage)
    .then(res => {
      let html = res.data;
      return parser.province(html);
    });
  let sql = sqlParser.provinceList(provinceList);
  console.log(sql);
  await query(sql);
  console.log('省份列表存储完毕');
  return provinceList;
}

// 获取省份列表（从数据库）
async function getPorvFromDb() {
  let sql = 'SELECT * from (select a.id,a.province,a.href,(case when b.page=0 then 1 when b.p' +
      'age is null then 1 else b.page+1 end) curPage,(case when a.pagenum=0 then 2 else' +
      ' a.pagenum end) totalPage from provinceindex a left JOIN (SELECT province_id,cei' +
      'l(count(*)/10) page FROM `companyIndex` group by province_id) b on a.id = b.prov' +
      'ince_id   ) a where a.totalPage>a.curPage';
  return await query(sql);
}

function getProvinceUrl(href, p = 1) {
  return href.match('g_(.+).html')[1] + '&p=' + p;
}

// 抓取公司列表
async function getCompanyByProvince(provinces) {
  for (let i = 0; i < provinces.length; i++) {
    await getCompanyData(provinces[i]);
  }
}

// 公司列表爬虫
async function getCompanyData(item) {

  let totalPage = item.totalPage;
  for (let curPage = item.curPage; curPage <= totalPage; curPage++) {
    console.log(`正在采集${item.province}地区数据，${curPage}/${totalPage}`);
    let url = settings.url.provinceByPage + getProvinceUrl(item.href, curPage);
    let html = await axios
      .get(url)
      .then(res => res.data);
    let companyData = parser.company(html);
    if (curPage == 1) {
      let total = parser.companyPage(html);
      totalPage = total[0].page;
      // 更新总页码信息
      let sql = `update provinceIndex set pagenum = ${totalPage} where id=${item.id}`;
      await query(sql);
    }
    let sql = sqlParser.companyList(companyData, item.id);
    await query(sql);
    console.log(`${item.province}地区第${curPage}页数据采集存储完毕`);
  }
}

module.exports = {
  init
};