let read = require('../shop/qichacha');
let db = require('./db');
let util = require('../util/common');

let xici = require('../shop/xicidaili');

let tbproxyCrawler = require('../shop/qichachahq');

async function init() {
    // xici.init();

    // read.init();
    
    tbproxyCrawler.init();
}

module.exports = {
    init
};