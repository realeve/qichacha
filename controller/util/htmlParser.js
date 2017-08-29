let util = require('./common')
let cheerio = require('cheerio')

let province = html => {

    let options = {
        html,
        parentNode: '.filter-tag dd',
        children: [
            {
                node: 'a',
                name: 'href',
                formatter(el) {
                    return el.attr('href');
                }
            }, {
                node: 'a',
                name: 'province',
                formatter(el) {
                    return el
                        .text()
                        .split(' - ')[1]
                }
            }
        ]
    }
    return util.parseHTML(options)
};

let company = html => {

    let options = {
        html,
        parentNode: 'section#searchlist',
        children: [
            {
                node: '.name',
                name: 'company_name'
            }, {
                node: '.label',
                name: 'company_status'
            }, {
                node: '.list-group-item',
                name: 'href',
                formatter(el) {
                    return el.attr('href');
                }
            }, {
                node: '.i-local',
                name: 'address',
                formatter(el) {
                    return el
                        .parent()
                        .text();
                }
            }, {
                node: '.i-user3',
                name: 'attr',
                formatter(el) {
                    let texts = el.parent().text().replace(/\n/g,'').split(' ');
                    let data = [];
                    texts.forEach(item=>{
                        if(item!=''){
                            data.push(item);
                        }
                    });
                    return data;
                }
            }
        ]
    }
    return util.parseHTML(options)
};

companyPage = html=>{    
    let options = {
        html,
        parentNode: '.pagination',
        children: [{
            node: '.end',
            name: 'page'
        }]
    }
    return util.parseHTML(options)
}

module.exports = {
    province,
    company,
    companyPage
}