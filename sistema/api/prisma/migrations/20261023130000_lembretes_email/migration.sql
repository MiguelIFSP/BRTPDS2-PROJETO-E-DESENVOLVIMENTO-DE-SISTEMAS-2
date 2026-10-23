CREATE TABLE `LembreteEnviado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reuniaoId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `tipo` ENUM('MANHA', 'UMA_HORA', 'QUINZE_MINUTOS') NOT NULL,
    `enviado` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `LembreteEnviado_userId_idx`(`userId`),
    UNIQUE INDEX `LembreteEnviado_reuniaoId_userId_tipo_key`(`reuniaoId`, `userId`, `tipo`),
    PRIMARY KEY (`id`),
    CONSTRAINT `LembreteEnviado_reuniaoId_fkey` FOREIGN KEY (`reuniaoId`) REFERENCES `Reuniao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `LembreteEnviado_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
