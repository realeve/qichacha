let settings = require('../../schema/config');
let fs = require('fs');
let util = require('../util/common');
async function init() {
    if (settings.needInit) {
        console.log('A.数据库初始化');
        console.log('1.数据库表单尚未初始化');
        await dbInit();
        console.log('2.表单初始化完毕\n');
    }
}

// 判断某一日的数据是否需要采集，用于库存、价格、销量等查询
async function needUpdate(tblName) {
    
}

async function setCrawlerStatus(tblName) {
    
}

module.exports = {
    init
};