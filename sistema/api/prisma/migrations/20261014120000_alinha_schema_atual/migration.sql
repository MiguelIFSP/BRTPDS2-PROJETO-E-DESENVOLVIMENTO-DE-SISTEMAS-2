-- Traz para o histórico de migrations o que já estava no schema.prisma e foi
-- aplicado nos bancos só por "db push": Organizacao.createdAt e o enum de
-- ComissaoEquipe.papel. Bancos criados por "db push" já têm estas mudanças e
-- recebem esta migration como aplicada (baseline no start-all.ps1).

-- AlterTable
ALTER TABLE `Organizacao` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Normaliza papéis fora da lista antes de virar ENUM (senão o MODIFY falha).
UPDATE `ComissaoEquipe` SET `papel` = UPPER(`papel`);
UPDATE `ComissaoEquipe` SET `papel` = 'MEMBRO' WHERE `papel` NOT IN ('ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO', 'MEMBRO');

-- AlterTable
ALTER TABLE `ComissaoEquipe` MODIFY `papel` ENUM('ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO', 'MEMBRO') NOT NULL DEFAULT 'MEMBRO';
