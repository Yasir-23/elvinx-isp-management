-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: elvinx
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('01d44ba4-a53d-4eb4-9a3a-bb039f7c1745','2ce4ddfa14fc765804ab116b62d3d9c686a41ec87cd96d7738ee805aba1bc2b7','2025-09-24 20:46:03.032','20250924204602_make_settings_optional',NULL,NULL,'2025-09-24 20:46:02.925',1),('03111de9-c9ab-4dfc-9b47-5765bddf379e','f9010aedf1c965b9630a28d5e36dce02b4e0761fb02c0960e4ad0a8f9397e1ab','2025-10-26 09:56:07.083','20251026095606_add_admin_model',NULL,NULL,'2025-10-26 09:56:07.010',1),('12c8b859-fb58-47fe-adea-d251831d1a4d','8d8f5449a3c03b5e80c3ccce5facb3306ecce328274e4430d6ecb7eab780708c','2025-12-03 15:17:26.512','20251203151726_add_staff_fields',NULL,NULL,'2025-12-03 15:17:26.342',1),('2d0be991-d05a-47e5-9792-cde8c55ac9b7','e5183463d9f98caa6a88f80da5bd161c01dbb806d8a9507f4868a1e303cff4f2','2025-12-23 21:04:20.737','20251223210420_add_invoice_table',NULL,NULL,'2025-12-23 21:04:20.524',1),('3100adbb-de17-4a0d-9ff6-39034c4c535f','f0051477667fd204d43113f07080df5a0a4efea9020e485623fdea0156888b39','2025-09-24 21:08:54.560','20250924210854_make_settings_optional',NULL,NULL,'2025-09-24 21:08:54.476',1),('421086ba-6bfa-46b6-a56a-27ddcfdc605b','da88e7239e4a3cbb5b9c49d94c8eeed1c82aebd43ca500638aa4255ad5e99387','2025-09-24 14:30:34.612','20250924143034_add_settings',NULL,NULL,'2025-09-24 14:30:34.572',1),('50bdbd1d-b224-42c7-859f-52fe82b18bc4','dddcf56113784a48970d116e1b607e7bff7ba99fe13ac7d2a0c3cb35e18e4566','2025-12-21 23:00:29.463','20251221230029_package',NULL,NULL,'2025-12-21 23:00:29.412',1),('5aa36f37-4bcb-4053-8973-544e5e24ab69','a675665f3c77022b21dfa64b03627a1e9402845b93981b081053333d935695dc','2025-09-15 11:54:21.352','20250915115421_fix_photo_url',NULL,NULL,'2025-09-15 11:54:21.312',1),('716eec7a-742a-49da-9ef6-de5eb45244db','a2d17b23c1fc449bc1e5f1e4d2346a1af635305a81a60edad00085b7b9d9e25e','2025-09-13 04:44:18.526','20250913044418_add_sync_fields',NULL,NULL,'2025-09-13 04:44:18.490',1),('7eb99390-0dd1-4528-b296-02f0b84b923e','2b46804fd426a4aaa95cf14f89ceb497c8a930073baace79250aa1b281d577a0','2025-12-25 16:45:44.858','20251225164544_add_data_limit',NULL,NULL,'2025-12-25 16:45:44.813',1),('876cce49-0f1e-464a-83d2-a25d57c9d6a3','56f1e274e4dc184e9b02c5ee6a9283779189d89ba25857a2dc2140107c8e44b1','2025-09-12 09:36:56.553','20250912093656_init',NULL,NULL,'2025-09-12 09:36:56.463',1),('89d09333-3e4d-4491-825a-ced892e26e3b','889943f963b20d5242fd64935a4036e348d4985f7915f54ed7c4d321cfa03fce','2025-12-06 15:33:30.278','20251206153330_add_usage_tracking_fields',NULL,NULL,'2025-12-06 15:33:30.183',1),('8f020af5-a7e6-4544-9db6-b138b1f03daf','1ff3a804127267fed56cd90a5f01906471b067d82468b77e61c2c56b9eaa7be5','2025-12-25 20:36:28.812','20251225203628_add_invoice_date',NULL,NULL,'2025-12-25 20:36:28.787',1),('93850f39-5798-4dd9-bb55-a3ee7ffd3497','40a8bbaffd3944455412d5a5abeadb2dce93510d788c64e9209c2806aaea988c','2025-12-17 21:55:46.296','20251217215546_add_admin_photo',NULL,NULL,'2025-12-17 21:55:46.245',1),('973d84c7-fb2f-4bbc-8d8c-eb7f269632bb','8fe3792e3e13f52e073d16ea3145da0cf5dcaad72e614e7e57e5c6f1e145f411','2025-12-28 20:23:55.898','20251228202355_make_invoice_user_optional',NULL,NULL,'2025-12-28 20:23:55.615',1),('9a3f0851-493f-4a4e-a62c-f823166e3670','c563e27ddd8d437e59c824a5e9cb29890df0f50ab6849403c4ca85a6227e4dc8','2025-12-24 20:40:18.966','20251224204018_add_paid_at_to_invoice',NULL,NULL,'2025-12-24 20:40:18.937',1),('ac4e0378-005c-40cc-a690-1dbedfe33fd7','a5b817917ae96558c3947a0edb21321f73cfe98bbfe3bb3129d681b82a59034f','2025-09-14 15:37:44.208','20250914153744_add_photo_url',NULL,NULL,'2025-09-14 15:37:44.170',1),('b3feca8e-7179-4297-a5fe-09cabd098746','305754680d71315b2f98d5d7bb76828daf06f534e48aa70c45c54784868a7fae','2025-12-22 18:27:48.450','20251222182748_add',NULL,NULL,'2025-12-22 18:27:48.388',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `photoUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Admin_username_key` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'admin','$2b$10$fdW072x.ALCW2mS/moW4KeimK6pA/q2.iVpcQ049oQDE4YP2WU4Y6','M Yasir','elvinx@gmail.com','admin',1,'2025-10-26 10:13:47.474','2025-12-18 02:28:15.762','http://localhost:3000/uploads/1766024894109-logoipsum-407.png');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice`
--

DROP TABLE IF EXISTS `invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `amount` double NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `paidAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Invoice_userId_idx` (`userId`),
  CONSTRAINT `Invoice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
INSERT INTO `invoice` VALUES (3,1,3000,'paid','2025-12-24 00:00:00.000','2025-12-24 14:32:50.969',NULL),(5,NULL,3000,'paid','2025-12-25 00:00:00.000','2025-12-24 19:53:31.474','2025-12-25 00:00:00.000'),(8,NULL,3000,'paid','2025-12-25 00:00:00.000','2025-12-25 14:11:12.319','2025-12-25 00:00:00.000'),(9,1,3000,'paid','2025-12-25 00:00:00.000','2025-12-25 14:23:16.124','2025-12-25 00:00:00.000'),(10,18,8000,'paid','2025-12-26 00:00:00.000','2025-12-25 20:29:13.546','2025-12-25 00:00:00.000'),(12,NULL,2000,'paid','2025-12-26 00:00:00.000','2025-12-25 20:32:57.855','2025-12-28 00:00:00.000'),(13,28,3000,'unpaid','2025-12-26 00:00:00.000','2025-12-27 17:19:37.738',NULL),(14,23,3000,'paid','2025-12-28 00:00:00.000','2025-12-28 17:19:09.644','2025-12-28 00:00:00.000'),(15,27,3000,'unpaid','2025-12-28 00:00:00.000','2025-12-28 18:06:00.857',NULL);
/*!40000 ALTER TABLE `invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package`
--

DROP TABLE IF EXISTS `package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rateLimit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `displayName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ispCost` int NOT NULL DEFAULT '0',
  `regularPrice` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Package_name_key` (`name`),
  UNIQUE KEY `Package_rateLimit_key` (`rateLimit`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package`
--

LOCK TABLES `package` WRITE;
/*!40000 ALTER TABLE `package` DISABLE KEYS */;
INSERT INTO `package` VALUES (2,'4 Mbps','4M/4M','2025-12-22 12:55:45.995','Basic 4 Mbps',800,1800),(3,'6 Mbps','6M/6M','2025-12-22 12:55:46.137','Basic 6 Mbps',1200,2000),(4,'8 Mbps','8M/8M','2025-12-22 12:55:46.152','Home 8MB Basic',2000,3000),(5,'10 Mbps','10M/10M','2025-12-22 12:55:46.169','10 Mbps Basic',1800,3000),(9,'25 Mbps','25M/25M','2025-12-25 20:19:26.499','25 Mbps Basic',6400,8000),(10,'15 Mbps','15M/15M','2025-12-29 18:11:37.731','15 Mbps Home',2800,4200);
/*!40000 ALTER TABLE `package` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setting`
--

DROP TABLE IF EXISTS `setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `logoUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `faviconUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slogan` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defaultCurrency` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defaultPaymentMethod` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defaultPaymentRecipient` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defaultVAT` double DEFAULT NULL,
  `defaultEmailApi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defaultSmsApi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sendSmsOnInvoice` tinyint(1) NOT NULL DEFAULT '0',
  `sendEmailOnInvoice` tinyint(1) NOT NULL DEFAULT '0',
  `mikrotikIp` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mikrotikUser` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mikrotikPassword` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zipCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `copyrightText` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `website` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setting`
--

LOCK TABLES `setting` WRITE;
/*!40000 ALTER TABLE `setting` DISABLE KEYS */;
INSERT INTO `setting` VALUES (1,'http://localhost:3000/uploads/1766938338085-logoipsum-407.png','http://localhost:3000/uploads/1766098842495-logoipsum-401.png','ElvinX','Best ISP Partner','+92 339 0702034','elvinx2034@gmail.com','BDT','Bkash','billing@elvinx.com',15,'Mailgun','Nexmo',1,1,'192.168.1.2:8728','admin','admin@123','Mazari Chowk, Jampur','Jampur','Pakistan','33000','ElvinX Copyright @ 2026 ElvinX','2025-09-24 21:10:07.887','2025-12-28 18:26:18.630','https://elvinx.com');
/*!40000 ALTER TABLE `setting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photoUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `package` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salesperson` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nas` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nationalId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `balance` double DEFAULT NULL,
  `disabled` tinyint(1) NOT NULL DEFAULT '0',
  `expiryDate` datetime(3) DEFAULT NULL,
  `lastSync` datetime(3) DEFAULT NULL,
  `online` tinyint(1) NOT NULL DEFAULT '0',
  `photoUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `packagePrice` double DEFAULT NULL,
  `passwordRaw` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staffId` int DEFAULT NULL,
  `lastBytesSnapshot` bigint NOT NULL DEFAULT '0',
  `usedBytesTotal` bigint NOT NULL DEFAULT '0',
  `dataLimit` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_username_key` (`username`),
  KEY `User_staffId_fkey` (`staffId`),
  CONSTRAINT `User_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Muhammad Yasir','m.yasir-2034','ad123','25 Mbps','pppoe','admin','nas1','321246767','03390702034','testing123@gmail.com','Testing address','karachi','','','2025-09-12 13:08:56.710',NULL,0,'2026-01-25 13:38:01.105','2025-09-15 11:54:49.249',0,'http://localhost:3000/uploads/1766343001790-logoipsum-401.png',NULL,NULL,NULL,NULL,0,0,1073741824000),(13,'Aarif Kaloi','kaloi-955','ad123','10 Mbps','pppoe','admin','nas1','1234567890112','+92 123 456789','ariftest@gmail.com','Gaddan wala','','','','2025-12-15 14:35:58.947',NULL,0,'2026-01-25 13:36:35.720',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(14,'Farhan Ahmad','b.farhan-0123','ad123','10 Mbps','pppoe','admin','nas1','1234567890112','+92 123 456789','farhan@test.com','Bahawalpur','','','','2025-12-16 19:17:19.274',NULL,0,'2026-01-25 13:36:11.556',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(15,'Abdul Munim','b.munim-2233','ad123','4 Mbps','pppoe','admin','nas1','32142 897647 3','+92 123 456789','munitest@gmail.com','Goheer town','','','','2025-12-18 23:19:10.058',NULL,0,'2026-01-25 13:35:55.461',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(16,'Yasir Test 99','b.yasir-99','ad123','4 Mbps','pppoe','admin','','1234567890112','+92 123 456789','yasittest99@gmail.com','Goheer town street no 2 house no 5',NULL,'','','2025-12-18 23:34:05.107',NULL,0,'2026-01-25 13:35:27.290',NULL,0,'http://localhost:3000/uploads/1766349472508-logoipsum-401.png',NULL,NULL,NULL,NULL,0,0,0),(17,'Testing 98','m.testing-98','ad123','8 Mbps','pppoe','admin','','1234567890112','123678987','testing98@gmail.com','no address',NULL,'','','2025-12-21 19:18:32.327',NULL,0,'2026-01-25 13:34:35.247',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(18,'Testing 97','m.testing-97','ad123','25 Mbps','pppoe','admin','','1234567890112','1234567890','testing97@gmail.com','Mazari Chowk shorya road',NULL,'','','2025-12-21 19:24:35.054',NULL,0,'2026-01-28 17:42:21.227',NULL,0,NULL,NULL,8000,NULL,NULL,0,0,1073741824000),(20,'Testing 96','b.testing-96','ad123','10 Mbps','pppoe','admin','','1234567890112','1234567890','testing96@gmail.com','Mazari Chowk shorya road',NULL,'','','2025-12-21 19:39:15.563',NULL,0,'2026-01-25 13:33:58.743',NULL,0,'http://localhost:3000/uploads/1766350082916-logoipsum-407.png',NULL,NULL,NULL,NULL,0,0,NULL),(22,'Testing 95','m.testing-95','ad123','10 Mbps','pppoe','admin','','1234567890115','12345678901','m.testing95@gmail.com','Mazari chowk',NULL,'','','2025-12-22 15:26:05.165',NULL,0,'2026-01-25 10:23:04.732',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL),(23,'Testing 94','m.testing-94','ad123','10 Mbps','pppoe','admin','','1234567890112','1234567890','testing94@gmail.com','Mazari chowk','','','','2025-12-26 18:30:59.988',NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(24,'Testing 93','m.testing-93','ad123','8 Mbps','pppoe','admin','','1234567890112','1234567890','testing93@gmail.com','mazari chowk','','','','2025-12-26 18:58:19.395',NULL,1,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(25,'Testing 92','m.testing-92','ad123','6 Mbps','pppoe','admin','','1234567890112','1234567890','testing92@gmail.com','mazari chowk','','','','2025-12-27 10:09:03.515',NULL,0,'2026-01-26 10:09:54.529',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(26,'Testi 91','m.test-91','ad123','10 Mbps','pppoe','admin','','1234567890112','1234567890','test91@gmail.com','mazari chowk','','','','2025-12-27 15:27:40.756',NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(27,'Test 90','m.test-90','ad123','10 Mbps','pppoe','admin','','1234567890115','1234567890','test90@gmail.com','mazari chowk','','','','2025-12-27 15:50:43.968',NULL,0,'2026-01-26 17:08:33.082',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(28,'Testing 89','m.test-89','ad123','10 Mbps','pppoe','admin','','1234567890112','1234567890','testing89@gmail.com','mazari chowk','','','','2025-12-27 17:07:38.725',NULL,1,'2025-12-26 17:07:38.722',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0),(29,'Testing 88','m.test-88','ad123','8 Mbps','pppoe','admin','','1234567890112','12345678901','testing88@gmail.com','mazari chowk','','','','2025-12-27 20:31:59.230',NULL,0,'2026-01-26 22:01:46.461',NULL,0,NULL,NULL,NULL,NULL,NULL,0,0,0);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-30  2:12:28
