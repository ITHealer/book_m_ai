-- Migration: Add health check, snapshot, and duplicate detection features
-- Created: 2025-11-29

-- Create duplicate_group table
CREATE TABLE `duplicate_group` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`master_bookmark_id` integer,
	`reason` text NOT NULL,
	`similarity` integer,
	`owner_id` integer NOT NULL,
	`created` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`master_bookmark_id`) REFERENCES `bookmark`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Create snapshot table
CREATE TABLE `snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`level` text NOT NULL,
	`text_content` text,
	`html_content` text,
	`image_file_ids` text,
	`archive_file_id` integer,
	`size` integer,
	`content_hash` text,
	`created` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmark`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`archive_file_id`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Create health_check_log table
CREATE TABLE `health_check_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`status` text NOT NULL,
	`status_code` integer,
	`response_time` integer,
	`error_message` text,
	`checked` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmark`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Add new columns to bookmark table
ALTER TABLE `bookmark` ADD COLUMN `status` text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `bookmark` ADD COLUMN `snapshot_level` text DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE `bookmark` ADD COLUMN `refreshed_at` integer;
--> statement-breakpoint
ALTER TABLE `bookmark` ADD COLUMN `duplicate_group_id` integer REFERENCES `duplicate_group`(`id`) ON DELETE set null;
--> statement-breakpoint

-- Create indexes for duplicate_group
CREATE INDEX `duplicate_groupt_owner_id_index` ON `duplicate_group` (`owner_id`);
--> statement-breakpoint

-- Create indexes for snapshot
CREATE INDEX `snapshott_bookmark_id_index` ON `snapshot` (`bookmark_id`);
--> statement-breakpoint
CREATE INDEX `snapshott_level_index` ON `snapshot` (`level`);
--> statement-breakpoint

-- Create indexes for health_check_log
CREATE INDEX `health_check_logt_bookmark_id_index` ON `health_check_log` (`bookmark_id`);
--> statement-breakpoint
CREATE INDEX `health_check_logt_checked_index` ON `health_check_log` (`checked`);
--> statement-breakpoint

-- Create indexes for new bookmark columns
CREATE INDEX `bookmarkt_status_index` ON `bookmark` (`status`);
--> statement-breakpoint
CREATE INDEX `bookmarkt_duplicate_group_index` ON `bookmark` (`duplicate_group_id`);
--> statement-breakpoint

-- Create bookmark_embedding table
CREATE TABLE `bookmark_embedding` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL UNIQUE,
	`embedding` text NOT NULL,
	`model` text NOT NULL,
	`dimensions` integer NOT NULL,
	`created` integer DEFAULT (unixepoch()) NOT NULL,
	`updated` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmark`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Create indexes for bookmark_embedding
CREATE INDEX `bookmark_embeddingt_bookmark_id_index` ON `bookmark_embedding` (`bookmark_id`);
