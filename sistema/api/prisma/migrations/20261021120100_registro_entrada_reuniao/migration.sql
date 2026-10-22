CREATE TABLE `ReuniaoRegistro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reuniaoId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `entradaAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `saidaAt` DATETIME(3) NULL,
    UNIQUE INDEX `ReuniaoRegistro_reuniaoId_userId_key`(`reuniaoId`, `userId`),
    INDEX `ReuniaoRegistro_userId_idx`(`userId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReuniaoRegistro_reuniaoId_fkey` FOREIGN KEY (`reuniaoId`) REFERENCES `Reuniao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ReuniaoRegistro_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
