let settings = require('../../schema/config');

let util = require('../util/common');
async function init() {
    if (settings.needInit) {
        console.log('A.数据库初始化');
        console.log('1.数据库表单尚未初始化');
        await dbInit();
        console.log('2.表单初始化完毕\n');
    }
}

module.exports = {
    init
};