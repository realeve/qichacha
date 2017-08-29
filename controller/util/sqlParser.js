let getNow = require('./common').getNow
// 本模块用于一次性插入大量数据时对原始数据的处理 销售记录详情数据
function provinceList(provinces) {
    let sql = 'insert into provinceIndex(province,href,pagenum) values '

    let sqlValues = provinces.map(item => {
        return `('${item.province}','${item.href}',0)`;
    })

    return sql + sqlValues.join(',');
}

function companyList(companys, provinceId) {
    let sql = 'insert into companyIndex(province_id,company_name,href,company_status,leader,reg_date,reg_captial,company_type,address,item_flag) values ';
    let sqlValues = companys.map(item => {
        let companyType = typeof item.attr[3] == 'undefined'
            ? ''
            : item.attr[3];
        let reg_captial = typeof item.attr[2] == 'undefined'
            ? ''
            : item.attr[2];
        if(!reg_captial.includes('万')){
            companyType = reg_captial;
            reg_captial = '';
        }
        return `(${provinceId},'${item.company_name}','${item.href}','${item.company_status}','${item.attr[0]}','${item.attr[1]}','${reg_captial}','${companyType}','${item.address}',0)`;
    })

    return sql + sqlValues.join(',');
}

module.exports = {
    provinceList,
    companyList
}