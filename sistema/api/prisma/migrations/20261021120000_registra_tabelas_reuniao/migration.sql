-- Estas tabelas já pertencem ao schema; IF NOT EXISTS preserva instalações
-- que as criaram por db push antes do histórico de migrations.
CREATE TABLE IF NOT EXISTS `Reuniao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comissaoId` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `pauta` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `data` VARCHAR(191) NOT NULL,
    `horaInicio` VARCHAR(191) NOT NULL,
    `horaFim` VARCHAR(191) NOT NULL,
    `status` ENUM('AGENDADA', 'REALIZADA', 'CANCELADA') NOT NULL DEFAULT 'AGENDADA',
    `criadoPorUserId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `Reuniao_comissaoId_idx`(`comissaoId`),
    INDEX `Reuniao_criadoPorUserId_idx`(`criadoPorUserId`),
    INDEX `Reuniao_data_idx`(`data`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Reuniao_comissaoId_fkey` FOREIGN KEY (`comissaoId`) REFERENCES `Comissao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Reuniao_criadoPorUserId_fkey` FOREIGN KEY (`criadoPorUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ConviteReuniao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reuniaoId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` ENUM('PENDENTE', 'ACEITO', 'RECUSADO') NOT NULL DEFAULT 'PENDENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondidoAt` DATETIME(3) NULL,
    UNIQUE INDEX `ConviteReuniao_reuniaoId_userId_key`(`reuniaoId`, `userId`),
    INDEX `ConviteReuniao_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ConviteReuniao_reuniaoId_fkey` FOREIGN KEY (`reuniaoId`) REFERENCES `Reuniao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ConviteReuniao_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
