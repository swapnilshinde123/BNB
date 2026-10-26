CREATE TABLE `blocked_dates` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocked_property_date_unique` ON `blocked_dates` (`property_id`,`date`);
--> statement-breakpoint
CREATE TRIGGER `nights_reject_blocked_date`
BEFORE INSERT ON `nights`
WHEN EXISTS (SELECT 1 FROM `blocked_dates` WHERE property_id = NEW.property_id AND date = NEW.date)
BEGIN
	SELECT RAISE(ABORT, 'Date is blocked');
END;
--> statement-breakpoint
CREATE TRIGGER `blocked_dates_reject_reserved_date`
BEFORE INSERT ON `blocked_dates`
WHEN EXISTS (SELECT 1 FROM `nights` WHERE property_id = NEW.property_id AND date = NEW.date)
BEGIN
	SELECT RAISE(ABORT, 'Date is reserved');
END;
