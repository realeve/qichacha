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

// let proxyList = require('../util/proxyList');

let proxyList = [];
let proxyIdx = [];
let publicProxy = [];

// 代理列表表单名，区分淘宝购买与免费爬取的列表
// const PROXY_TBL_NAME =  'proxyList'; 
const PROXY_TBL_NAME = 'proxy_list_taobao';

// 10进程并发取数
const THREAD_NUM = 300;

async function init() {
  // 获取并存储省份数据 await getProvinceIndex(); 从数据库中读取省份数据 let provinces = await
  // getPorvFromDb(); 获取各省公司列表 await getCompanyByProvince(provinces);
  
  // 从数据库中获取待处理详情的公司列表
  for(let i=0;i<=THREAD_NUM;i++){
    proxyIdx.push(1);
    publicProxy.push({});
  }
  for(let i=0;i<THREAD_NUM;i++){
    let CUR_THREAD_IDX = i;
    await getProxyListFromDb(CUR_THREAD_IDX);  
    getCompanyFromDb(CUR_THREAD_IDX);
  }
}

function getRndInt(){
  return Math.ceil(Math.random()*10+1);
}

async function getProxyListFromDb(CUR_THREAD_IDX){
  let sql = `select a.id,a.host,a.port,a.status from (select @rownum:=@rownum+1 as rownum, b.* from (select @rownum:=0) a,${PROXY_TBL_NAME} b where b.status>=-1) a where (a.rownum)%${THREAD_NUM} = ${CUR_THREAD_IDX}`;
  // `select * from ${PROXY_TBL_NAME} where status = 0 and (id+${THREAD_NUM})%${THREAD_NUM} = ${CUR_THREAD_IDX}`

  proxyList[CUR_THREAD_IDX] = await query(sql);
}

function getCompanySqlByPage(CUR_THREAD_IDX,page) {
  // 多线程，将id取余则可多个线程同时取数 SELECT id,concat('http://www.qichacha.com',href) href
  // FROM companyindex where item_flag = 0 and id%10 = 1
  return `select * from (select @rownum:=@rownum+1 rownum,a.* from (SELECT b.id,concat('http://www.qichacha.com',b.href) href FROM (select @rownum:=0) a,companyindex b where b.item_flag = 0) a) a where a.rownum%${THREAD_NUM} = ${CUR_THREAD_IDX} limit ${ (page - 1) * 100},100`;
  // return `SELECT id,concat('http://www.qichacha.com',href) href FROM companyindex where item_flag = 0 and id%${THREAD_NUM} = ${CUR_THREAD_IDX} limit ${ (page - 1) * 100},100`;
}

// 从数据库中获取公司列表；
async function getCompanyFromDb(CUR_THREAD_IDX) {
  let isFinished = false;
  // 按100页获取数据
  for (let i = 1; !isFinished; i++) {
    console.log(`线程${CUR_THREAD_IDX}正在读取第${i}页数据，每页100条.`)
    let sql = getCompanySqlByPage(CUR_THREAD_IDX,i);
    let companys = await query(sql);
    if (companys.length < 100) {
      isFinished = true;
    }
    for (let j = 0; j < companys.length;) {
      let havedata = await getCompanyDetail(companys[j],CUR_THREAD_IDX);

      // 如果数据加载失败，切换代理，继续抓取
      if (!havedata) {
        proxyIdx[CUR_THREAD_IDX]++;
        if (proxyIdx[CUR_THREAD_IDX] == proxyList[CUR_THREAD_IDX].length - 1) {
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
        console.log(`第${j + 1}/${companys.length}条数据采集完毕,休息${sleepTimeLength}ms 后继续`);
        // await util.sleep(sleepTimeLength);

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
  console.log('sql executed finish');
}

async function saveHtml2Disk(content, data) {
  let fileName = util.getMainContent() + '/controller/data/html/' + content;
  fs.writeFileSync(fileName, data, 'utf8');
}

// 获取代理配置 '222.196.33.254':3128 可用 '122.72.32.82:80 122.72.32.84 122.72.32.83
function getProxy(i,CUR_THREAD_IDX) {
  // return {   host: '222.196.33.254',   port: 3128 }
  console.log('正在使用代理' + i + '获取数据:\n');
  publicProxy[CUR_THREAD_IDX] = proxyList[CUR_THREAD_IDX][i];
  return publicProxy[CUR_THREAD_IDX];
}

// 抓取公司详情
async function getCompanyDetail(company,CUR_THREAD_IDX) {
  let url = company.href;

  let option = {
    method: 'get',
    url,
    responseType: 'text',
    proxy: getProxy(proxyIdx[CUR_THREAD_IDX],CUR_THREAD_IDX),
    // 'User-Agent': ' Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko' +
    //     ') Chrome/60.0.3112.113 Safari/537.36',
    Refer:'http://www.qichacha.com/index_verify?type=companyview&back=/firm'+url.split('firm')[1],
    'User-Agent':'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Mobile Safari/537.36',
    timeout: 5000,
   // 'Cookie':'acw_tc=AQAAANK84EdEagsAwhfU3tVQtsdsqnlR; PHPSESSID=hi2dsvv84kmojhtugturjjdlj1; zg_did=%7B%22did%22%3A%20%2215e648af99fc2c-006ccf8c873ac6-7b4a457d-49a10-15e648af9a08bf%22%7D; zg_de1d1a35bfa24ce29bbf2c7eb17e6c4f=%7B%22sid%22%3A%201504925383074%2C%22updated%22%3A%201504925383077%2C%22info%22%3A%201504925383076%2C%22superProperty%22%3A%20%22%7B%7D%22%2C%22platform%22%3A%20%22%7B%7D%22%2C%22utm%22%3A%20%22%7B%7D%22%2C%22referrerDomain%22%3A%20%22www.qichacha.com%22%7D; UM_distinctid=15e648afa754ae-068cfefc5ae691-7b4a457d-49a10-15e648afa76a30; CNZZDATA1254842228=97650014-1504923112-null%7C1504923112; _uab_collina=150492538335327593229124'
  };
  console.log('线程'+CUR_THREAD_IDX,option.proxy);
  // 2s以内代理连接失效，自动转换
  if(typeof option.proxy == 'undefined'){
    console.log('线程'+CUR_THREAD_IDX+'代理读取失败');
    return false;
  }
  let html = await axios(option)
    .then(res => res.data)
    .catch(e => {
      console.log('线程'+CUR_THREAD_IDX+'数据抓取失败');
      console.log(e.message);
      return '';
    });
  console.log('线程'+CUR_THREAD_IDX+'数据获取完毕');
  if (html == '') {
    publicProxy[CUR_THREAD_IDX].status = -1;
    await recordProxyInfo(publicProxy[CUR_THREAD_IDX]);
    return false;
  } else if (html.slice(0, 8) == '<script>') {
    console.log('线程'+CUR_THREAD_IDX,html);
    publicProxy[CUR_THREAD_IDX].status = 2;
    await recordProxyInfo(publicProxy[CUR_THREAD_IDX]);
    return false;
  }else if (html.slice(0,14) == '<html><script>' || html.includes('http://www.baidu.com/search/error.html')){
    console.log('线程'+CUR_THREAD_IDX);
    publicProxy[CUR_THREAD_IDX].status = 3;
    await recordProxyInfo(publicProxy[CUR_THREAD_IDX]);
    return false;
  }

  let filename = url.replace('http://www.qichacha.com/', '');
  saveHtml2Disk(filename, html);

  console.log('线程'+CUR_THREAD_IDX+'存储至本地硬盘');

  let result = await handleCompanyDetail(html, company.id).catch(e=>{
    console.log(e.message);
    return false;
  }).then(res=>true);
  console.log('线程'+CUR_THREAD_IDX+'处理非结构化数据');
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