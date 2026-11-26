-- Pedido para entrar numa organização já aceita. Um por pessoa e organização.

CREATE TABLE `PedidoAcessoOrganizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organizacaoId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` ENUM('PENDENTE', 'ACEITO', 'RECUSADO') NOT NULL DEFAULT 'PENDENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondidoAt` DATETIME(3) NULL,

    UNIQUE INDEX `PedidoAcessoOrganizacao_organizacaoId_userId_key`(`organizacaoId`, `userId`),
    INDEX `PedidoAcessoOrganizacao_userId_idx`(`userId`),
    INDEX `PedidoAcessoOrganizacao_organizacaoId_status_idx`(`organizacaoId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PedidoAcessoOrganizacao`
    ADD CONSTRAINT `PedidoAcessoOrganizacao_organizacaoId_fkey`
    FOREIGN KEY (`organizacaoId`) REFERENCES `Organizacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `PedidoAcessoOrganizacao_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
