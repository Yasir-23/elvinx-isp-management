-- DropForeignKey
ALTER TABLE `invoice` DROP FOREIGN KEY `Invoice_userId_fkey`;

-- AlterTable
ALTER TABLE `invoice` MODIFY `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
