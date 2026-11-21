-- Exportação da ata: depois dela, texto e votos ficam imutáveis.

-- AlterTable
ALTER TABLE `Reuniao` ADD COLUMN `ataExportadaAt` DATETIME(3) NULL,
    ADD COLUMN `ataVersaoExportada` INTEGER NULL;
