let qichacha = require('./spider/qichachaMultiThread');

// 天眼查得分数据
let score = require('./spider/companyScore');

async function init() {
    console.log('系统初始化：数据库表单初始化，载入默认数据。此处哪项任务未完成则请自行取消注释信息.');
    
    qichacha.init();
    
    // score.init();
}

module.exports = {
    init
};