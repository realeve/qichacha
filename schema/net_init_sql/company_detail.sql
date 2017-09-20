/*
Navicat MySQL Data Transfer

Source Server         : MYSQL
Source Server Version : 50717
Source Host           : localhost:3306
Source Database       : qichacha

Target Server Type    : MYSQL
Target Server Version : 50717
File Encoding         : 65001

Date: 2017-09-20 17:38:28
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for company_detail
-- ----------------------------
DROP TABLE IF EXISTS `company_detail`;
CREATE TABLE `company_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `legeal_name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `reg_captial` varchar(255) DEFAULT NULL,
  `manage_status` varchar(255) DEFAULT NULL,
  `register_date` varchar(255) DEFAULT NULL,
  `company_type` varchar(255) DEFAULT NULL,
  `personnel_scale` varchar(255) DEFAULT NULL,
  `expired_date` varchar(255) DEFAULT NULL,
  `register_org` varchar(255) DEFAULT NULL,
  `verify_date` varchar(255) DEFAULT NULL,
  `company_industry` varchar(255) DEFAULT NULL,
  `company_address` varchar(255) DEFAULT NULL,
  `href` varchar(255) DEFAULT NULL,
  `score` int(255) DEFAULT NULL,
  `rec_date` datetime DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `title` (`title`),
  KEY `href` (`href`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='企业详情页数据';
