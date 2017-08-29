let query = require('../../schema/mysql')

async function getShopList() {
    return await query(sql.query.jd_shopList);
}

module.exports = {
    getShopList
}