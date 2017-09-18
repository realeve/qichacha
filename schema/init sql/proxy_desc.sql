/*
Navicat MySQL Data Transfer

Source Server         : Mysql_local
Source Server Version : 50621
Source Host           : localhost:3306
Source Database       : qichacha

Target Server Type    : MYSQL
Target Server Version : 50621
File Encoding         : 65001

Date: 2017-09-18 20:11:29
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for proxy_desc
-- ----------------------------
DROP TABLE IF EXISTS `proxy_desc`;
CREATE TABLE `proxy_desc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` int(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COMMENT='代理状态描述';

-- ----------------------------
-- Records of proxy_desc
-- ----------------------------
INSERT INTO `proxy_desc` VALUES ('1', '-1', '连接超时');
INSERT INTO `proxy_desc` VALUES ('2', '0', ' 未测试是否可用');
INSERT INTO `proxy_desc` VALUES ('3', '1', '数据获取成功');
INSERT INTO `proxy_desc` VALUES ('4', '2', '当日数据获取失败，可能该IP已被其它人使用过');
INSERT INTO `proxy_desc` VALUES ('5', '3', '认证失败');
