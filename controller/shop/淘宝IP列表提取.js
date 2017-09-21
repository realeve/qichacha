// http://www.httpdaili.com/api.asp?ddbh=57729626221522367&old=&noinfo=true&sl=100

a = ''
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

console.log('insert into proxy_list_taobao(ip,port,status) values ' + d.join(','));
