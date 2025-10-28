CREATE TABLE `bridges` (
	`id` varchar(100) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`x` varchar(50) NOT NULL,
	`y` varchar(50) NOT NULL,
	`taPlanUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bridges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatId` varchar(100) NOT NULL,
	`encryptionKey` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatKeys_chatId_unique` UNIQUE(`chatId`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatId` varchar(100) NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int,
	`workGroupId` int,
	`content` text NOT NULL,
	`isEncrypted` boolean NOT NULL DEFAULT true,
	`messageType` enum('text','image','file','voice') NOT NULL DEFAULT 'text',
	`attachmentUrl` text,
	`attachmentKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deviations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int,
	`bridgeId` varchar(100),
	`bridgeName` text NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deviations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`category` enum('kma','general','safety','technical') NOT NULL DEFAULT 'general',
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bridgeId` varchar(100),
	`bridgeName` text NOT NULL,
	`userId` int NOT NULL,
	`userName` text NOT NULL,
	`startTid` timestamp NOT NULL,
	`slutTid` timestamp,
	`beskrivning` text,
	`status` enum('pågående','avslutad') NOT NULL DEFAULT 'pågående',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workGroupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workGroupId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workGroupMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`inviteCode` varchar(20) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workGroups_id` PRIMARY KEY(`id`),
	CONSTRAINT `workGroups_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','employee') NOT NULL DEFAULT 'employee';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `company` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;