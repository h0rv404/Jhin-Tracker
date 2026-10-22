CREATE TABLE `riot_connections` (
	`user_id` text PRIMARY KEY NOT NULL,
	`encrypted_key` text NOT NULL,
	`updated_at` integer NOT NULL,
	`last_request` integer DEFAULT 0 NOT NULL
);
