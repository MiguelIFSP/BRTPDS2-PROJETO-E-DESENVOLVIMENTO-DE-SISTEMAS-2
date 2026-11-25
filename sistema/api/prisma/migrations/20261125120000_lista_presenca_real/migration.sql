CREATE TABLE `ReuniaoPresenca` (
    `reuniaoId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` ENUM('PRESENTE', 'AUSENTE') NOT NULL,
    `marcadoPorId` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`reuniaoId`, `userId`),
    INDEX `ReuniaoPresenca_marcadoPorId_idx`(`marcadoPorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReuniaoEventoPresenca` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reuniaoId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `tipo` ENUM('SAIDA', 'RETORNO') NOT NULL,
    `ocorridoAt` DATETIME(3) NOT NULL,
    `motivo` VARCHAR(500) NULL,
    `registradoPorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `ReuniaoEventoPresenca_reuniaoId_userId_ocorridoAt_idx`(`reuniaoId`, `userId`, `ocorridoAt`),
    INDEX `ReuniaoEventoPresenca_registradoPorId_idx`(`registradoPorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ReuniaoPresenca`
    ADD CONSTRAINT `ReuniaoPresenca_reuniaoId_fkey` FOREIGN KEY (`reuniaoId`) REFERENCES `Reuniao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `ReuniaoPresenca_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `ReuniaoPresenca_marcadoPorId_fkey` FOREIGN KEY (`marcadoPorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ReuniaoEventoPresenca`
    ADD CONSTRAINT `ReuniaoEventoPresenca_reuniaoId_fkey` FOREIGN KEY (`reuniaoId`) REFERENCES `Reuniao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `ReuniaoEventoPresenca_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `ReuniaoEventoPresenca_registradoPorId_fkey` FOREIGN KEY (`registradoPorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
