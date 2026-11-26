-- Biblioteca de arquivos da reunião. O arquivo em si fica no disco da API.

CREATE TABLE `ArquivoReuniao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reuniaoId` INTEGER NOT NULL,
    `nomeOriginal` VARCHAR(255) NOT NULL,
    `nomeArmazenado` VARCHAR(36) NOT NULL,
    `tamanhoBytes` INTEGER NOT NULL,
    `enviadoPorUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ArquivoReuniao_nomeArmazenado_key`(`nomeArmazenado`),
    INDEX `ArquivoReuniao_reuniaoId_idx`(`reuniaoId`),
    INDEX `ArquivoReuniao_enviadoPorUserId_idx`(`enviadoPorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ArquivoReuniao`
    ADD CONSTRAINT `ArquivoReuniao_reuniaoId_fkey`
    FOREIGN KEY (`reuniaoId`) REFERENCES `Reuniao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `ArquivoReuniao_enviadoPorUserId_fkey`
    FOREIGN KEY (`enviadoPorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
