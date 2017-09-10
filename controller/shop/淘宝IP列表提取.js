// http://www.httpdaili.com/api.asp?ddbh=57729626221522367&old=&noinfo=true&sl=100

a = '121.238.129.4:8998 42.54.99.82:8998 123.57.38.208:80'
b = a.split(' ')
c = b.map(item => {
  let port = item.split(':')[1],
    host = item.split(':')[0];
  return {
    host,
    port,
    status: 0
  }
})
d = c.map(item => `('${item.host}','${item.port}',${item.status})`);

console.log('insert into proxy_list_taobao(host,port,status) values ' + d.join(','));
