/*
Navicat MySQL Data Transfer

Source Server         : Mysql_local
Source Server Version : 50621
Source Host           : localhost:3306
Source Database       : qichacha

Target Server Type    : MYSQL
Target Server Version : 50621
File Encoding         : 65001

Date: 2017-09-18 20:10:51
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for company_detail
-- ----------------------------
DROP TABLE IF EXISTS `company_detail`;
CREATE TABLE `company_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `tel` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `homepage` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `updated_at` varchar(255) DEFAULT NULL,
  `rec_date` datetime DEFAULT NULL,
  `usc_sn` varchar(255) DEFAULT NULL,
  `tax_sn` varchar(255) DEFAULT NULL,
  `register_sn` varchar(255) DEFAULT NULL,
  `org_sn` varchar(255) DEFAULT NULL,
  `legeal_name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `reg_captial` varchar(255) DEFAULT NULL,
  `manage_status` varchar(255) DEFAULT NULL,
  `register_date` varchar(255) DEFAULT NULL,
  `company_type` varchar(255) DEFAULT NULL,
  `personnel_scale` varchar(255) DEFAULT NULL,
  `expired_date` varchar(255) DEFAULT NULL,
  `register_org` varchar(255) DEFAULT NULL,
  `verify_date` varchar(255) DEFAULT NULL,
  `english_name` varchar(255) DEFAULT NULL,
  `company_area` varchar(255) DEFAULT NULL,
  `company_industry` varchar(255) DEFAULT NULL,
  `old_name` varchar(255) DEFAULT NULL,
  `company_address` varchar(255) DEFAULT NULL,
  `business_scope` varchar(2550) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `title` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='企业详情页数据';
