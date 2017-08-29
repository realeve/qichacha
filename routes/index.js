var express = require('express');
var router = express.Router();
var dirname = __dirname.replace('routes', 'public');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.sendFile(dirname + '/index.html');
});

module.exports = router;