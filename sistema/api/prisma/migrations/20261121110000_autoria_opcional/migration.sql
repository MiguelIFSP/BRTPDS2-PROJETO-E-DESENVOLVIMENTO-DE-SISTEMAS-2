-- Autoria opcional: ao excluir a conta de quem criou, a reunião e a votação
-- ficam e o campo vira NULL. Só afrouxa a restrição; nenhuma linha muda.

-- DropForeignKey
ALTER TABLE `Reuniao` DROP FOREIGN KEY `Reuniao_criadoPorUserId_fkey`;

-- DropForeignKey
ALTER TABLE `Votacao` DROP FOREIGN KEY `Votacao_criadoPorUserId_fkey`;

-- AlterTable
ALTER TABLE `Reuniao` MODIFY `criadoPorUserId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Votacao` MODIFY `criadoPorUserId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Reuniao` ADD CONSTRAINT `Reuniao_criadoPorUserId_fkey` FOREIGN KEY (`criadoPorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Votacao` ADD CONSTRAINT `Votacao_criadoPorUserId_fkey` FOREIGN KEY (`criadoPorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
