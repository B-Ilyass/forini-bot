import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const monitoredFiles = pgTable("monitored_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sentNotifications = pgTable("sent_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(), // Targa o Nome riga
  daysRemaining: integer("days_remaining").notNull(), // 15, 7, o 1
  deadlineDate: timestamp("deadline_date").notNull(),
  fileName: text("file_name"), // Nome del file excel
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

