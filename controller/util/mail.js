let mailer = require('nodemailer');
let auth = require('./mailAuth').auth;

let transport = mailer.createTransport({
    pool: true,
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth
});

async function send(settings) {
    settings.subject = '【企查查】 ' + settings.subject;
    await transport.sendMail({
        from: '"企查查" <smzdmai@qq.com>',
        to: "realeve@qq.com",
        subject: settings.subject,
        generateTextFromHTML: true,
        html: `<div>${settings.html}</div>`
    }, function(err, response) {
        if (err) {
            console.log(err);
        }
        console.log(`邮件 ${settings.subject} 发送成功`);
        transport.close();
    });
}

module.exports = {
    send
}