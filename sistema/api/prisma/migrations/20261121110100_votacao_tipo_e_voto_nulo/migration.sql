-- Tipo da votação, resultado parcial e troca de voto; voto nulo (opcaoId NULL).

-- AlterTable
ALTER TABLE `Votacao` ADD COLUMN `mostrarParcial` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `permiteTrocaVoto` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tipo` ENUM('ABERTA', 'SECRETA') NOT NULL DEFAULT 'ABERTA';

-- AlterTable
ALTER TABLE `VotacaoVoto` MODIFY `opcaoId` INTEGER NULL;

-- As votações que já existem mantêm o comportamento de antes: aberta, com
-- parcial visível e troca de voto permitida. As novas nascem com false.
UPDATE `Votacao` SET `mostrarParcial` = true, `permiteTrocaVoto` = true;
