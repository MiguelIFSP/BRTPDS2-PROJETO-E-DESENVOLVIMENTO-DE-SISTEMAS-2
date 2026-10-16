-- Normaliza os valores gravados antes de virar ENUM (senão o MODIFY falha).
-- Tema desconhecido volta para "system", que é o padrão do app.
UPDATE `User` SET `themePreference` = LOWER(`themePreference`) WHERE `themePreference` IS NOT NULL;
UPDATE `User` SET `themePreference` = 'system' WHERE `themePreference` NOT IN ('light', 'dark', 'system');

-- AlterTable
ALTER TABLE `User` MODIFY `themePreference` ENUM('light', 'dark', 'system') NULL DEFAULT 'system';

-- Status desconhecido volta para PENDENTE: o admin decide de novo.
UPDATE `Organizacao` SET `status` = UPPER(`status`);
UPDATE `Organizacao` SET `status` = 'PENDENTE' WHERE `status` NOT IN ('PENDENTE', 'ACEITA', 'RECUSADA');

-- AlterTable
ALTER TABLE `Organizacao` MODIFY `status` ENUM('PENDENTE', 'ACEITA', 'RECUSADA') NOT NULL DEFAULT 'PENDENTE';
