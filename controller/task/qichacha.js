let read = require('../shop/qichacha');
let db = require('./db');
let util = require('../util/common');

let xici = require('../shop/xicidaili');

let tbproxyCrawler = require('../shop/qichachahq');

let localhostRead = require('../shop/qichacha1Thread');
async function init() {
    // xici.init();

    read.init();
    
    // localhostRead.init();
    
    // tbproxyCrawler.init();
}

module.exports = {
    init
};