// npm install send-mail
let sendmail = require('sendmail')();

let errCode = [{
    code: 500,
    desc: '格式错误，命令不可识别（此错误也包括命令行过长）format error, command unrecognized (This error also includes command line too long)'
}, {
    code: 501,
    desc: '参数格式错误 parameter format error'
}, {
    code: 502,
    desc: '命令不可实现 command can not be achieved '
}, {
    code: 503,
    desc: '错误的命令序列 Bad sequence of commands'
}, {
    code: 504,
    desc: '命令参数不可实现 command parameter can not be achieved'
}, {
    code: 211,
    desc: '系统状态或系统帮助响应 System status, or system help response'
}, {
    code: 214,
    desc: '帮助信息 help'
}, {
    code: 220,
    desc: '服务就绪 Services Ready'
}, {
    code: 221,
    desc: '服务关闭传输信道 Service closing transmission channel'
}, {
    code: 421,
    desc: '服务未就绪，关闭传输信道（当必须关闭时，此应答可以作为对任何命令的响应）service is not ready to close the transmission channel (when it is necessary to close, this response may be in response to any command)'
}, {
    code: 250,
    desc: '要求的邮件操作完成 requested mail action completed'
}, {
    code: 251,
    desc: '用户非本地，将转发向 non-local users will be forwarded to'
}, {
    code: 450,
    desc: '要求的邮件操作未完成，邮箱不可用（例如，邮箱忙）Mail the required operation 450 unfinished, mailbox unavailable (for example, mailbox busy)'
}, {
    code: 550,
    desc: '要求的邮件操作未完成，邮箱不可用（例如，邮箱未找到，或不可访问）Mail action not completed the required 550 mailbox unavailable (eg, mailbox not found, no access)'
}, {
    code: 451,
    desc: '放弃要求的操作；处理过程中出错 waiver operation; processing error'
}, {
    code: 551,
    desc: '用户非本地，请尝试 non-local user, please try'
}, {
    code: 452,
    desc: "系统存储不足，要求的操作未执行 Less than 452 storage system, requiring action not taken"
}, {
    code: 552,
    desc: '过量的存储分配，要求的操作未执行 excess storage allocation requires action not taken'
}, {
    code: 553,
    desc: '邮箱名不可用，要求的操作未执行（例如邮箱格式错误） mailbox name is not available, that the requested operation is not performed (for example, mailbox format error)'
}, {
    code: 354,
    desc: '开始邮件输入，以.结束 Start Mail input to. End'
}, {
    code: 554,
    desc: '操作失败  The operation failed'
}, {
    code: 535,
    desc: '用户验证失败 User authentication failed'
}, {
    code: 235,
    desc: '用户验证成功 user authentication is successful'
}, {
    code: 334,
    desc: '等待用户输入验证信息 waits for the user to enter authentication information'
}];

async function send(settings) {
    settings.subject = '【SMZDM】 ' + settings.subject;
    await sendmail({
        from: 'SMZDM <abutin.cbpc@sina.com>',
        to: 'nizhen.cbpc@gmail.com,realeve@qq.com',
        subject: settings.subject,
        html: settings.html
    }, function(err, reply) {
        if (err) {
            let errInfo = err.stack.match(/code:([0-9]*)/);
            if (errInfo != null) {
                let code = errInfo[1];
                let info = errCode.filter(item => item.code == code);
                if (info.length) {
                    console.warn(info.desc);
                }
            }
            console.warn(err && err.stack);
            return;
        }
        console.dir(reply);
        console.warn(`邮件 ${settings.subject} 发送成功`);
    })
}

module.exports = {
    send
}