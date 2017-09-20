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
    let sql = 'insert into companyIndex(province_id,company_name,href,company_status,leader,reg' +
        '_date,reg_captial,company_type,address,item_flag) values ';
    let sqlValues = companys.map(item => {
        let companyType = typeof item.attr[3] == 'undefined' ?
            '' :
            item.attr[3];
        let reg_captial = typeof item.attr[2] == 'undefined' ?
            '' :
            item.attr[2];
        if (!reg_captial.includes('万')) {
            companyType = reg_captial;
            reg_captial = '';
        }
        return `(${provinceId},'${item.company_name}','${item.href}','${item.company_status}','${item.attr[0]}','${item.attr[1]}','${reg_captial}','${companyType}','${item.address}',0)`;
    })

    return sql + sqlValues.join(',');
}

function companyDetail(detail) {
    let sql = 'insert into company_detail(title,tel,email,homepage,address,updated_at,rec_date,' +
        'usc_sn,tax_sn,register_sn,org_sn,legeal_name,reg_captial,manage_status,register_' +
        'date,company_type,personnel_scale,expired_date,register_org,verify_date,english_' +
        'name,company_area,company_industry,old_name,company_address,business_scope) valu' +
        'es';
    let value = `('${detail.title}','${detail.tel}','${detail.email}','${detail.homepage}','${detail.address}','${detail.updated_at}','${detail.rec_date}','${detail.usc_sn}','${detail.tax_sn}','${detail.register_sn}','${detail.org_sn}','${detail.legeal_name}','${detail.reg_captial}','${detail.manage_status}','${detail.register_date}','${detail.company_type}','${detail.personnel_scale}','${detail.expired_date}','${detail.register_org}','${detail.verify_date}','${detail.english_name.replace(/'/g,'')}','${detail.company_area}','${detail.company_industry}','${detail.old_name}','${detail.company_address}','${detail.business_scope.replace(/'/g,'')}')`;
    return sql + value;
}

function companyDetail2(detail) {
    let sql = 'insert into company_detail(title,rec_date, legeal_name,reg_captial,manage_status,register_' +
        'date,company_type,personnel_scale,expired_date,register_org,verify_date,company_industry,company_address,href,score,status) values';
    let value = `('${detail.title}','${detail.rec_date}','${detail.legeal_name}','${detail.reg_captial}','${detail.manage_status}','${detail.register_date}','${detail.company_type}','${detail.personnel_scale}','${detail.expired_date}','${detail.register_org}','${detail.verify_date}','${detail.company_industry}','${detail.company_address}','${detail.href}',0,0)`;
    return sql + value;
}

function shareholderDetail(list, cid) {
    let sql = 'insert into shareholder_detail(cid,shareholder_name,percentage,money_amount,rec_' +
        'date,shareholder_type) values ';

    let value = list.map(item => `('${cid}','${item[0]}','${item[1]}','${item[2]}','${item[3]}','${item[4]}')`);
    return sql + value.join(',');
}

function managerDetail(managers, cid) {
    let sql = 'insert into manager_detail(cid,username,duties) values ';
    let sqlValues = managers.map(item => {
        return `('${cid}','${item[0]}','${item[1]}')`
    });
    return sql + sqlValues.join(',');
}

module.exports = {
    provinceList,
    companyList,
    companyDetail,
    shareholderDetail,
    managerDetail,
    companyDetail2
}