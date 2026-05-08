-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,
    `tipoConta` ENUM('RECEBIMENTO', 'DESPESA') NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `dataVencimento` DATETIME(3) NOT NULL,
    `dataPrevista` DATETIME(3) NULL,
    `dataCadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataUltimaAlteracao` DATETIME(3) NOT NULL,
    `status` ENUM('ATRASADA', 'PENDENTE', 'FINALIZADA') NOT NULL,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `origem` VARCHAR(191) NULL,
    `formaRecebimento` VARCHAR(191) NULL,
    `dataRecebimento` DATETIME(3) NULL,
    `contaId` INTEGER NOT NULL,

    UNIQUE INDEX `receita_contaId_key`(`contaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `despesa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `origem` VARCHAR(191) NULL,
    `formaPagamento` VARCHAR(191) NULL,
    `dataPagamento` DATETIME(3) NULL,
    `contaId` INTEGER NOT NULL,

    UNIQUE INDEX `despesa_contaId_key`(`contaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `conta` ADD CONSTRAINT `conta_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receita` ADD CONSTRAINT `receita_contaId_fkey` FOREIGN KEY (`contaId`) REFERENCES `conta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `despesa` ADD CONSTRAINT `despesa_contaId_fkey` FOREIGN KEY (`contaId`) REFERENCES `conta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
