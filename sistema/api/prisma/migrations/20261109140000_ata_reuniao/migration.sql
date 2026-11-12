-- AlterTable
ALTER TABLE `Reuniao` ADD COLUMN `conteudoAta` LONGTEXT NULL,
    ADD COLUMN `versaoAta` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `AtaVoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reuniaoId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` ENUM('APROVADO', 'REPROVADO') NOT NULL,
    `versaoAta` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AtaVoto_userId_idx`(`userId`),
    UNIQUE INDEX `AtaVoto_reuniaoId_userId_key`(`reuniaoId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AtaVoto` ADD CONSTRAINT `AtaVoto_reuniaoId_fkey` FOREIGN KEY (`reuniaoId`) REFERENCES `Reuniao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtaVoto` ADD CONSTRAINT `AtaVoto_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
