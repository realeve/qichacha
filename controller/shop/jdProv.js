/**
 * 获取京东全国省/市/县 城市列表，与本项目无关
 */


let querystring = require('querystring');
let axios = require('axios');

let util = require('../util/common');
let query = require('../../schema/mysql');

let parser = require('../util/htmlParser');

let settings = require('../util/urlList.js');
let sqlParser = require('../util/sqlParser');
let fs = require('fs');

async function init() {
  // 获取京东城市列表
  // getJDProvinceList();

  getJDCityList();
}

async function getJDCityList(){
    let fileName = util.getMainContent() + '/controller/data/cityList.json';
    let cityList = fs.readFileSync(fileName, 'utf-8');
    cityList = JSON.parse(cityList);
    for(let i=4;i<cityList.length;i++){
        let citys = cityList[i].citys;
        for(let j=0;j<citys.length;j++){
            let city = citys[j];
            await axios.get("https://d.jd.com/area/get?fid="+city.id).then(res=>{
                city.area = res.data;
            });
            citys[j] = city;
        }
        cityList[i].citys = citys;
    }
    saveJson2Disk('areaList',cityList);
}

async function saveJson2Disk(content, data) {
  let fileName = util.getMainContent() + '/controller/data/' + content + '.json';
  fs.writeFileSync(fileName, JSON.stringify(data), 'utf8');
}

async function getJDProvinceList() {
  let
    provinceList = [{
      "name": "北京",
      "value": 1,
      "url": "https://d.jd.com/area/get?fid=1"
    }, {
      "name": "上海",
      "value": 2,
      "url": "https://d.jd.com/area/get?fid=2"
    }, {
      "name": "天津",
      "value": 3,
      "url": "https://d.jd.com/area/get?fid=3"
    }, {
      "name": "重庆",
      "value": 4,
      "url": "https://d.jd.com/area/get?fid=4"
    }, {
      "name": "河北",
      "value": 5,
      "url": "https://d.jd.com/area/get?fid=5"
    }, {
      "name": "山西",
      "value": 6,
      "url": "https://d.jd.com/area/get?fid=6"
    }, {
      "name": "河南",
      "value": 7,
      "url": "https://d.jd.com/area/get?fid=7"
    }, {
      "name": "辽宁",
      "value": 8,
      "url": "https://d.jd.com/area/get?fid=8"
    }, {
      "name": "吉林",
      "value": 9,
      "url": "https://d.jd.com/area/get?fid=9"
    }, {
      "name": "黑龙江",
      "value": 10,
      "url": "https://d.jd.com/area/get?fid=10"
    }, {
      "name": "内蒙古",
      "value": 11,
      "url": "https://d.jd.com/area/get?fid=11"
    }, {
      "name": "江苏",
      "value": 12,
      "url": "https://d.jd.com/area/get?fid=12"
    }, {
      "name": "山东",
      "value": 13,
      "url": "https://d.jd.com/area/get?fid=13"
    }, {
      "name": "安徽",
      "value": 14,
      "url": "https://d.jd.com/area/get?fid=14"
    }, {
      "name": "浙江",
      "value": 15,
      "url": "https://d.jd.com/area/get?fid=15"
    }, {
      "name": "福建",
      "value": 16,
      "url": "https://d.jd.com/area/get?fid=16"
    }, {
      "name": "湖北",
      "value": 17,
      "url": "https://d.jd.com/area/get?fid=17"
    }, {
      "name": "湖南",
      "value": 18,
      "url": "https://d.jd.com/area/get?fid=18"
    }, {
      "name": "广东",
      "value": 19,
      "url": "https://d.jd.com/area/get?fid=19"
    }, {
      "name": "广西",
      "value": 20,
      "url": "https://d.jd.com/area/get?fid=20"
    }, {
      "name": "江西",
      "value": 21,
      "url": "https://d.jd.com/area/get?fid=21"
    }, {
      "name": "四川",
      "value": 22,
      "url": "https://d.jd.com/area/get?fid=22"
    }, {
      "name": "海南",
      "value": 23,
      "url": "https://d.jd.com/area/get?fid=23"
    }, {
      "name": "贵州",
      "value": 24,
      "url": "https://d.jd.com/area/get?fid=24"
    }, {
      "name": "云南",
      "value": 25,
      "url": "https://d.jd.com/area/get?fid=25"
    }, {
      "name": "西藏",
      "value": 26,
      "url": "https://d.jd.com/area/get?fid=26"
    }, {
      "name": "陕西",
      "value": 27,
      "url": "https://d.jd.com/area/get?fid=27"
    }, {
      "name": "甘肃",
      "value": 28,
      "url": "https://d.jd.com/area/get?fid=28"
    }, {
      "name": "青海",
      "value": 29,
      "url": "https://d.jd.com/area/get?fid=29"
    }, {
      "name": "宁夏",
      "value": 30,
      "url": "https://d.jd.com/area/get?fid=30"
    }, {
      "name": "新疆",
      "value": 31,
      "url": "https://d.jd.com/area/get?fid=31"
    }, {
      "name": "台湾",
      "value": 32,
      "url": "https://d.jd.com/area/get?fid=32"
    }, {
      "name": "港澳",
      "value": 52993,
      "url": "https://d.jd.com/area/get?fid=52993"
      // }, {
      // 	"name": "钓鱼岛",
      // 	"value": 84,
      // 	"url": "https://d.jd.com/area/get?fid=84"
      // }, {
      // 	"name": "海外",
      // 	"value": 53283,
      // 	"url": "https://d.jd.com/area/get?fid=53283"
    }];

    for(let i=0;i<provinceList.length;i++){
        let item = provinceList[i];
        await axios.get(item.url).then(res=>{
            console.log(res.data);
            item.citys = res.data;
        })
        console.log(item);
        provinceList[i] = item;
    }

    saveJson2Disk('cityList',provinceList);
}

module.exports = {
  init
};