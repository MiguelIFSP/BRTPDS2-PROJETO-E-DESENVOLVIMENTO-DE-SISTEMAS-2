ALTER TABLE `ConviteReuniao` ADD COLUMN `tokenResposta` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `ConviteReuniao_tokenResposta_key` ON `ConviteReuniao`(`tokenResposta`);
