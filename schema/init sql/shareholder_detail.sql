/*
Navicat MySQL Data Transfer

Source Server         : Mysql_local
Source Server Version : 50621
Source Host           : localhost:3306
Source Database       : qichacha

Target Server Type    : MYSQL
Target Server Version : 50621
File Encoding         : 65001

Date: 2017-09-18 20:11:39
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for shareholder_detail
-- ----------------------------
DROP TABLE IF EXISTS `shareholder_detail`;
CREATE TABLE `shareholder_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cid` int(11) DEFAULT NULL,
  `shareholder_name` varchar(255) DEFAULT NULL,
  `percentage` varchar(255) DEFAULT NULL,
  `money_amount` varchar(255) DEFAULT NULL,
  `rec_date` varchar(255) DEFAULT NULL,
  `shareholder_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='股东信息';
