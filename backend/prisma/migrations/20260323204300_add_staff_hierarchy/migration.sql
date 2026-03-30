/*
  Warnings:

  - You are about to drop the `admin` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `staff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `staff` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `invoice` DROP FOREIGN KEY `Invoice_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_staffId_fkey`;

-- AlterTable
ALTER TABLE `staff` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `parentId` INTEGER NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `role` ENUM('SUPER_ADMIN', 'FRANCHISE', 'DEALER', 'SUB_DEALER') NOT NULL DEFAULT 'SUB_DEALER',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `username` VARCHAR(191) NOT NULL,
    ADD COLUMN `walletBalance` DOUBLE NOT NULL DEFAULT 0.0;

-- DropTable
DROP TABLE `admin`;

-- CreateIndex
CREATE UNIQUE INDEX `staff_username_key` ON `staff`(`username`);

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `invoice` RENAME INDEX `Invoice_userId_idx` TO `invoice_userId_idx`;

-- RenameIndex
ALTER TABLE `package` RENAME INDEX `Package_name_key` TO `package_name_key`;

-- RenameIndex
ALTER TABLE `package` RENAME INDEX `Package_rateLimit_key` TO `package_rateLimit_key`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_username_key` TO `user_username_key`;
