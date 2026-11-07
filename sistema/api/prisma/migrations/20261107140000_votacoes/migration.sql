-- Votações de uma reunião: a votação, as opções e um voto por pessoa.
CREATE TABLE `Votacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reuniaoId` INTEGER NOT NULL,
    `titulo` VARCHAR(120) NOT NULL,
    `criadoPorUserId` INTEGER NOT NULL,
    `encerrada` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Votacao_reuniaoId_idx`(`reuniaoId`),
    INDEX `Votacao_criadoPorUserId_idx`(`criadoPorUserId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Votacao_reuniaoId_fkey` FOREIGN KEY (`reuniaoId`) REFERENCES `Reuniao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Votacao_criadoPorUserId_fkey` FOREIGN KEY (`criadoPorUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `VotacaoOpcao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `votacaoId` INTEGER NOT NULL,
    `texto` VARCHAR(80) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    INDEX `VotacaoOpcao_votacaoId_idx`(`votacaoId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `VotacaoOpcao_votacaoId_fkey` FOREIGN KEY (`votacaoId`) REFERENCES `Votacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `VotacaoVoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `votacaoId` INTEGER NOT NULL,
    `opcaoId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VotacaoVoto_opcaoId_idx`(`opcaoId`),
    INDEX `VotacaoVoto_userId_idx`(`userId`),
    UNIQUE INDEX `VotacaoVoto_votacaoId_userId_key`(`votacaoId`, `userId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `VotacaoVoto_votacaoId_fkey` FOREIGN KEY (`votacaoId`) REFERENCES `Votacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `VotacaoVoto_opcaoId_fkey` FOREIGN KEY (`opcaoId`) REFERENCES `VotacaoOpcao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `VotacaoVoto_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
