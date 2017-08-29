var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors'),
    helmet = require('helmet'),
    compression = require('compression');

var app = express();

//security practices
app.use(helmet());

//全局cors则开启以下命令
app.use(cors());

//gzip压缩
app.use(compression());

//disable x-powered-by(security practices)
app.disable('x-powered-by');

app.use(require('less-middleware')(path.join(__dirname, 'public')));

app.use('/', express.static(__dirname + '/public', {
    maxAge: '10d'
}));

//全局添加处理时间
app.use((req, res, next) => {
    var start = new Date();
    next();
    var ms = new Date() - start;
    res.set('X-Response-Time', ms + 'ms');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var router = {
    index: require('./routes/index')
};

app.use('/', router.index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// 开始自动任务,目前仅用于交易原始信息的保存，个人开发时需注释该部分内容
let task = require('./controller/task');
task.init();
task.loadDefault();

process.env.PORT = 8000;

module.exports = app;