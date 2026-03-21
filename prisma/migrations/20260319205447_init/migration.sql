BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'USER',
    [isActive] BIT NOT NULL CONSTRAINT [users_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[books] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(1000) NOT NULL,
    [author] NVARCHAR(1000) NOT NULL,
    [publicationYear] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [books_status_df] DEFAULT 'AVAILABLE',
    [createdById] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [books_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [books_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[loans] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bookId] INT NOT NULL,
    [userId] INT NOT NULL,
    [loanDate] DATETIME2 NOT NULL CONSTRAINT [loans_loanDate_df] DEFAULT CURRENT_TIMESTAMP,
    [dueDate] DATETIME2,
    [returnedAt] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [loans_status_df] DEFAULT 'ACTIVE',
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [loans_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [loans_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[reservations] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bookId] INT NOT NULL,
    [userId] INT NOT NULL,
    [reservedAt] DATETIME2 NOT NULL CONSTRAINT [reservations_reservedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2,
    [fulfilledAt] DATETIME2,
    [cancelledAt] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [reservations_status_df] DEFAULT 'ACTIVE',
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [reservations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [reservations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[audit_logs] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT,
    [entityName] NVARCHAR(1000) NOT NULL,
    [entityId] INT,
    [action] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [beforeData] NVARCHAR(1000),
    [afterData] NVARCHAR(1000),
    [ipAddress] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [audit_logs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_email_idx] ON [dbo].[users]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_role_idx] ON [dbo].[users]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [books_title_idx] ON [dbo].[books]([title]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [books_author_idx] ON [dbo].[books]([author]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [books_status_idx] ON [dbo].[books]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [books_publicationYear_idx] ON [dbo].[books]([publicationYear]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [loans_bookId_status_idx] ON [dbo].[loans]([bookId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [loans_userId_status_idx] ON [dbo].[loans]([userId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [loans_loanDate_idx] ON [dbo].[loans]([loanDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [reservations_bookId_status_idx] ON [dbo].[reservations]([bookId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [reservations_userId_status_idx] ON [dbo].[reservations]([userId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [reservations_reservedAt_idx] ON [dbo].[reservations]([reservedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_userId_createdAt_idx] ON [dbo].[audit_logs]([userId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_entityName_entityId_idx] ON [dbo].[audit_logs]([entityName], [entityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_action_createdAt_idx] ON [dbo].[audit_logs]([action], [createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[books] ADD CONSTRAINT [books_createdById_fkey] FOREIGN KEY ([createdById]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[loans] ADD CONSTRAINT [loans_bookId_fkey] FOREIGN KEY ([bookId]) REFERENCES [dbo].[books]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[loans] ADD CONSTRAINT [loans_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_bookId_fkey] FOREIGN KEY ([bookId]) REFERENCES [dbo].[books]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[reservations] ADD CONSTRAINT [reservations_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [audit_logs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
