module.exports = {
  'extends': 'standard',
  'plugins': [
    'standard',
    'promise'
  ],
  'rules': {
    // 关闭额外的分号检查
    // 0:关闭，1:警告，2:异常
    'semi': 0,
    // 字符串必须使用单引号
    'quotes': [
      'error',
      'single'
    ],
    'indent': ['error', 2, {
      'SwitchCase': 1
    }],
    // disable
    'no-inline-comments': 'off',
    'eol-last': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    // 'space-before-function-paren': ['error', {
    //   'anonymous': 'always',
    //   'named': 'always',
    //   'asyncArrow': 'ignore'
    // }]

  }
}
