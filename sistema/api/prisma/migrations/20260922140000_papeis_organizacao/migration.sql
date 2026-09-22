-- Normaliza papéis antigos antes de virar ENUM.
UPDATE `OrganizacaoMembro` SET `papel` = 'CRIADOR' WHERE `papel` IN ('RESPONSAVEL', 'CRIADOR');
UPDATE `OrganizacaoMembro` SET `papel` = 'GERENTE' WHERE UPPER(`papel`) = 'GERENTE';
UPDATE `OrganizacaoMembro` SET `papel` = 'MODERADOR' WHERE UPPER(`papel`) = 'MODERADOR';
UPDATE `OrganizacaoMembro` SET `papel` = 'MEMBRO' WHERE `papel` NOT IN ('CRIADOR', 'GERENTE', 'MODERADOR', 'MEMBRO');

-- Quem pediu a organização vira CRIADOR (cria membership se ainda não existir).
INSERT INTO `OrganizacaoMembro` (`organizacaoId`, `userId`, `papel`)
SELECT `id`, `solicitanteId`, 'CRIADOR'
FROM `Organizacao`
WHERE `solicitanteId` IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM `OrganizacaoMembro` `m`
  WHERE `m`.`organizacaoId` = `Organizacao`.`id` AND `m`.`userId` = `Organizacao`.`solicitanteId`
);

UPDATE `OrganizacaoMembro` `m`
INNER JOIN `Organizacao` `o` ON `o`.`id` = `m`.`organizacaoId` AND `o`.`solicitanteId` = `m`.`userId`
SET `m`.`papel` = 'CRIADOR';

ALTER TABLE `OrganizacaoMembro` MODIFY `papel` ENUM('CRIADOR', 'GERENTE', 'MODERADOR', 'MEMBRO') NOT NULL DEFAULT 'MEMBRO';

ALTER TABLE `Organizacao` DROP FOREIGN KEY `Organizacao_solicitanteId_fkey`;
ALTER TABLE `Organizacao` DROP COLUMN `solicitanteId`;
