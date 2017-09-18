/*
Navicat MySQL Data Transfer

Source Server         : Mysql_local
Source Server Version : 50621
Source Host           : localhost:3306
Source Database       : qichacha

Target Server Type    : MYSQL
Target Server Version : 50621
File Encoding         : 65001

Date: 2017-09-18 20:11:10
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for provinceindex
-- ----------------------------
DROP TABLE IF EXISTS `provinceindex`;
CREATE TABLE `provinceindex` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `province` varchar(255) DEFAULT NULL,
  `href` varchar(255) DEFAULT NULL,
  `pagenum` int(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8 COMMENT='省份列表_省份页主页面';

-- ----------------------------
-- Records of provinceindex
-- ----------------------------
INSERT INTO `provinceindex` VALUES ('1', '安徽 ', '/g_AH.html', '500');
INSERT INTO `provinceindex` VALUES ('2', '北京 ', '/g_BJ.html', '500');
INSERT INTO `provinceindex` VALUES ('3', '重庆 ', '/g_CQ.html', '500');
INSERT INTO `provinceindex` VALUES ('4', '福建 ', '/g_FJ.html', '500');
INSERT INTO `provinceindex` VALUES ('5', '甘肃 ', '/g_GS.html', '500');
INSERT INTO `provinceindex` VALUES ('6', '广东 ', '/g_GD.html', '500');
INSERT INTO `provinceindex` VALUES ('7', '广西 ', '/g_GX.html', '500');
INSERT INTO `provinceindex` VALUES ('8', '贵州 ', '/g_GZ.html', '500');
INSERT INTO `provinceindex` VALUES ('9', '海南 ', '/g_HAIN.html', '500');
INSERT INTO `provinceindex` VALUES ('10', '河北 ', '/g_HB.html', '500');
INSERT INTO `provinceindex` VALUES ('11', '黑龙江 ', '/g_HLJ.html', '500');
INSERT INTO `provinceindex` VALUES ('12', '河南 ', '/g_HEN.html', '500');
INSERT INTO `provinceindex` VALUES ('13', '湖北 ', '/g_HUB.html', '500');
INSERT INTO `provinceindex` VALUES ('14', '湖南 ', '/g_HUN.html', '500');
INSERT INTO `provinceindex` VALUES ('15', '江苏 ', '/g_JS.html', '500');
INSERT INTO `provinceindex` VALUES ('16', '江西 ', '/g_JX.html', '500');
INSERT INTO `provinceindex` VALUES ('17', '吉林 ', '/g_JL.html', '500');
INSERT INTO `provinceindex` VALUES ('18', '辽宁 ', '/g_LN.html', '500');
INSERT INTO `provinceindex` VALUES ('19', '内蒙古 ', '/g_NMG.html', '500');
INSERT INTO `provinceindex` VALUES ('20', '宁夏 ', '/g_NX.html', '500');
INSERT INTO `provinceindex` VALUES ('21', '青海 ', '/g_QH.html', '500');
INSERT INTO `provinceindex` VALUES ('22', '山东 ', '/g_SD.html', '500');
INSERT INTO `provinceindex` VALUES ('23', '上海 ', '/g_SH.html', '500');
INSERT INTO `provinceindex` VALUES ('24', '山西 ', '/g_SX.html', '500');
INSERT INTO `provinceindex` VALUES ('25', '陕西 ', '/g_SAX.html', '500');
INSERT INTO `provinceindex` VALUES ('26', '四川 ', '/g_SC.html', '500');
INSERT INTO `provinceindex` VALUES ('27', '天津 ', '/g_TJ.html', '500');
INSERT INTO `provinceindex` VALUES ('28', '新疆 ', '/g_XJ.html', '500');
INSERT INTO `provinceindex` VALUES ('29', '西藏 ', '/g_XZ.html', '500');
INSERT INTO `provinceindex` VALUES ('30', '云南 ', '/g_YN.html', '500');
INSERT INTO `provinceindex` VALUES ('31', '浙江 ', '/g_ZJ.html', '500');
INSERT INTO `provinceindex` VALUES ('32', '总局', '/g_CN.html', '450');
