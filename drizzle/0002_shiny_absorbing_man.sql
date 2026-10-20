CREATE TABLE `dependency_components` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purl` text NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`ecosystem` text NOT NULL,
	`license` text DEFAULT 'Unknown' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dependency_components_purl_unique` ON `dependency_components` (`purl`);--> statement-breakpoint
CREATE TABLE `dependency_edges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	`parent_ref` text NOT NULL,
	`child_ref` text NOT NULL,
	`imported_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `repository_dependencies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	`dependency_id` integer NOT NULL,
	`direct` integer DEFAULT false NOT NULL,
	`depth` integer DEFAULT -1 NOT NULL,
	`component_ref` text NOT NULL,
	`imported_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dependency_id`) REFERENCES `dependency_components`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sbom_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	`scan_id` integer NOT NULL,
	`format` text NOT NULL,
	`serial_number` text NOT NULL,
	`component_count` integer NOT NULL,
	`direct_count` integer NOT NULL,
	`transitive_count` integer NOT NULL,
	`isolated_count` integer NOT NULL,
	`max_depth` integer NOT NULL,
	`cycle_count` integer NOT NULL,
	`license_coverage` integer NOT NULL,
	`imported_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scan_id`) REFERENCES `scans`(`id`) ON UPDATE no action ON DELETE cascade
);
