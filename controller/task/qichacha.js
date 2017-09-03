let read = require('../shop/qichacha');
let db = require('./db');
let util = require('../util/common');

async function init() {
    read.init();
}

module.exports = {
    init
};