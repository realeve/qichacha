let querystring = require('querystring');
let axios = require('axios');

let db = require('../db/qichacha');
let util = require('../util/common');
let query = require('../../schema/mysql');

let parser = require('../util/htmlParser');

let settings = require('../util/urlList.js');
let sqlParser = require('../util/sqlParser');

async function init() {
    // 获取省份数据 await getProvinceIndex();
    let provinces = await getPorvFromDb();

    await getCompanyByProvince(provinces);
}

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

async function getPorvFromDb() {
    let sql = 'SELECT * from (select a.id,a.province,a.href,(case when b.page=0 then 1 when b.page is null then 1 else b.page+1 end) curPage,(case when a.pagenum=0 then 2 else a.pagenum end) totalPage from provinceindex a left JOIN (SELECT province_id,ceil(count(*)/10) page FROM `companyIndex` group by province_id) b on a.id = b.province_id   ) a where a.totalPage>a.curPage';
    return await query(sql);
}

function getProvinceUrl(href, p = 1) {
    return href.match('g_(.+).html')[1] + '&p=' + p;
}

async function getCompanyByProvince(provinces) {
    for(let i=0;i<provinces.length;i++){
        await getCompanyData(provinces[i]);
    }
}

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