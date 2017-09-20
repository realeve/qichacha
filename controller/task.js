let qichacha = require('./spider/qichacha');

async function init() {
    console.log('系统初始化：数据库表单初始化，载入默认数据。此处哪项任务未完成则请自行取消注释信息.');
    qichacha.init();
}

module.exports = {
    init
};