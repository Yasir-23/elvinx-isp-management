-- AlterTable
ALTER TABLE `package` ADD COLUMN `sellable` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `staff_package_assignment` (
    `staffId` INTEGER NOT NULL,
    `packageId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `staff_package_assignment_packageId_idx`(`packageId`),
    PRIMARY KEY (`staffId`, `packageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `staff_package_assignment` ADD CONSTRAINT `staff_package_assignment_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_package_assignment` ADD CONSTRAINT `staff_package_assignment_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `package`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
