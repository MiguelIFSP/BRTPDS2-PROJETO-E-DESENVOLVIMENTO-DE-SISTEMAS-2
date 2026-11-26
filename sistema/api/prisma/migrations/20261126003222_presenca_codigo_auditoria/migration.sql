-- AlterTable
ALTER TABLE `Reuniao` ADD COLUMN `codigoPresenca` VARCHAR(6) NULL;

-- AlterTable
ALTER TABLE `ReuniaoRegistro` ADD COLUMN `entradaManualPorId` INTEGER NULL,
    ADD COLUMN `origemEntrada` ENUM('PROPRIO', 'MANUAL') NOT NULL DEFAULT 'PROPRIO',
    ADD COLUMN `origemSaida` ENUM('PROPRIO', 'MANUAL') NULL,
    ADD COLUMN `saidaManualPorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ReuniaoRegistro` ADD CONSTRAINT `ReuniaoRegistro_entradaManualPorId_fkey` FOREIGN KEY (`entradaManualPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReuniaoRegistro` ADD CONSTRAINT `ReuniaoRegistro_saidaManualPorId_fkey` FOREIGN KEY (`saidaManualPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
