let qichacha = require('./spider/qichachaMultiThread');
let local = require('./spider/qichacha');
let taobao = require('./spider/qichachaTaobao');

// 天眼查得分数据
let score = require('./spider/companyScore');

let zhima = require('./spider/qichachaZhima');

async function init() {
    console.log('系统初始化：数据库表单初始化，载入默认数据。此处哪项任务未完成则请自行取消注释信息.');
    
    zhima.init();

    // local.init();

    // qichacha.init();
    
    // taobao.init();

    // score.init();
}

module.exports = {
    init
};