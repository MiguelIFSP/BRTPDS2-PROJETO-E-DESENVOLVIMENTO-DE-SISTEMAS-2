-- CreateTable
CREATE TABLE `SubSystem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SubSystem_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StatusCheck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subSystemId` INTEGER NOT NULL,
    `status` ENUM('OPERATIONAL', 'MAINTENANCE', 'ERROR', 'DOWN', 'UNKNOWN') NOT NULL,
    `message` VARCHAR(191) NULL,
    `isBlocking` BOOLEAN NOT NULL DEFAULT false,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StatusCheck_subSystemId_checkedAt_idx`(`subSystemId`, `checkedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StatusCheck` ADD CONSTRAINT `StatusCheck_subSystemId_fkey` FOREIGN KEY (`subSystemId`) REFERENCES `SubSystem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

