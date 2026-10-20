CREATE TABLE `policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`action` text NOT NULL,
	`scope` text DEFAULT 'All repositories' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `policies_name_unique` ON `policies` (`name`);--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`owner` text DEFAULT 'supplylens-labs' NOT NULL,
	`ecosystem` text NOT NULL,
	`branch` text DEFAULT 'main' NOT NULL,
	`primary_dependency` text DEFAULT '' NOT NULL,
	`primary_version` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'review' NOT NULL,
	`risk_score` integer DEFAULT 0 NOT NULL,
	`dependency_count` integer DEFAULT 0 NOT NULL,
	`open_findings` integer DEFAULT 0 NOT NULL,
	`last_scan_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repositories_name_unique` ON `repositories` (`name`);--> statement-breakpoint
CREATE TABLE `scan_findings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scan_id` integer NOT NULL,
	`repository_id` integer NOT NULL,
	`vulnerability_id` text NOT NULL,
	`dependency_path` text NOT NULL,
	`direct` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`detected_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`scan_id`) REFERENCES `scans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`dependency_count` integer DEFAULT 0 NOT NULL,
	`findings_count` integer DEFAULT 0 NOT NULL,
	`risk_score` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vulnerabilities` (
	`id` text PRIMARY KEY NOT NULL,
	`package_name` text NOT NULL,
	`severity` text NOT NULL,
	`cvss` real DEFAULT 0 NOT NULL,
	`fixed_version` text,
	`summary` text NOT NULL,
	`published_at` text NOT NULL
);
