ALTER TABLE `ReuniaoPresenca`
    MODIFY `status` ENUM('PRESENTE', 'AUSENTE') NULL,
    ADD COLUMN `observacao` VARCHAR(2000) NULL;
