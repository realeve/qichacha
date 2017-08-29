let querystring = require('querystring');
let axios = require('axios');

let db = require('../db/qichacha');
let util = require('../util/common');
let query = require('../../schema/mysql');

let parser = require('../util/htmlParser');
let fs = require('fs');

let urlList =  require('../util/urlList.js');

async function init(){
    console.log(urlList.homepage);
}


module.exports = {
    init
};