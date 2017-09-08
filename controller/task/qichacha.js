let read = require('../shop/qichacha');
let db = require('./db');
let util = require('../util/common');

let xici = require('../shop/xicidaili');

async function init() {
    // xici.init();
    read.init();
}

module.exports = {
    init
};