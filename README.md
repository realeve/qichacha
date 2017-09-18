#qichacha
企查查全国工商数据

#homepage
http://localhost:8000/

#install
install cnpm first,see help [here](http://npm.taobao.org/)

cnpm install -g pm2

cnpm install --save

#start
> npm start

#node版本 > 7.7


#使用说明
## 配置准备
1.在/schema/config.js中配置好mysql设置，数据库名，用户名密码，端口信息

2.在/util/mailAuth.js中配置好个人邮箱信息，**配置完毕后记得在  .gitignore 中将该文件的上传忽略 **,

3.在/util/mail.js中配置好需要发送的邮箱信息，当爬虫报错时会向该邮箱发送邮件，本例子中以qq.js为例。不需要邮箱提示的可以将相关代码注释；

## 数据库初始化
1. 将schema/initsql中sql逐一运行初始化数据库，其中省份列表已默认添加

## 功能说明
/controller/shop/中为对应爬虫任务，该项目从以前爬电商数据改过来所以目录为shop，其中：
jdProv.js 是取京东全国省市县行政单位并存储在本地json中，与本项目无关
xicidaili.js 从西刺中获取代理列表（前100页）

qichacha1Thread.js 本机单线程获取公司信息
qichacha.js 通过数据库中代理列表多线程爬虫，公共变量 THREAD_NUM 表示同时爬取线程数，实测设在100个较合适
> 1.此处代理列表可以从西刺取免费代理，也可以淘宝购买批量代理列表（淘宝IP列表提取.js表示将某店家取到的数据转换为sql语句插入prox列表中），建议购买付费IP
> 2.代理状态在数据库中可查询，无法使用的代理将自动标记

qichachahq.js 此为淘宝购买高质量IP列表(1分钟更新10组IP，效果良好，稳定每分钟在160+左右)，为稳定爬取会1分钟自动重置一次任务
