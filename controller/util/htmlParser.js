let util = require('./common')
let cheerio = require('cheerio')

let youzan = {
    goodsList(html) {
        let rec_date = util.getNow()
        let options = {
            html,
            parentNode: '.js-goods-card.goods-card.card',
            children: [{
                node: '.js-goods-buy.buy-response',
                name: 'data',
                formatter(el) {
                    return {
                        title: el.data('title'),
                        alias: el.data('alias'),
                        price: el.data('price'),
                        isVirtual: el.data('isvirtual'),
                        goodId: el.data('id')
                    }
                }
            }, {
                node: '.goods-photo.js-goods-lazy',
                name: 'imgSrc',
                formatter(el) {
                    return el.data('src')
                }
            }, {
                node: '.goods-price-taobao',
                name: 'priceTaobao'
            }],
            formatter(obj) {
                obj.data.imgSrc = obj.imgSrc
                obj.data.priceTaobao = obj.priceTaobao
                obj.data.rec_date = rec_date
                return obj.data
            }
        }
        return util.parseHTML(options)
    },
    goodsDetail(html) {
        let rec_date = util.getNow()
        let options = {
            html,
            parentNode: '.stock-detail dd',
            mode: 1,
            children: [{
                name: 'freight',
                formatter(el) {
                    return el.text().replace(/\n/, '').trim()
                }
            }, {
                name: 'stock'
            }, {
                name: 'sales'
            }],
            formatter(obj) {
                obj.rec_date = rec_date
                return obj
            }
        }
        return util.parseHTML(options)
    }
}

module.exports = {
    youzan
}