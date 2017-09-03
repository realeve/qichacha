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

async function init() {
  // 获取并存储省份数据 await getProvinceIndex(); 从数据库中读取省份数据 let provinces = await
  // getPorvFromDb(); 获取各省公司列表 await getCompanyByProvince(provinces);
  // 从数据库中获取待处理详情的公司列表
  await getCompanyFromDb();
}

function getCompanySqlByPage(page) {
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
    for (let j = 0; j < companys.length; j++) {
      await getCompanyDetail(companys[j]);
      // 下次读取至少等待2.5-3秒
      let sleepTimeLength = (4500 + Math.random() * 500).toFixed(0);
      console.log(`第${j + 1}/${companys.length}条数据采集完毕,休息${sleepTimeLength}ms 后继续`);
      await util.sleep(sleepTimeLength);
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
  let html = await axios({method: 'get', url, responseType: 'text'}).then(res => res.data);

  let filename = url.replace('http://www.qichacha.com/', '');
  saveHtml2Disk(filename, html);

  await handleCompanyDetail(html, company.id);
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
  console.log(sql);
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