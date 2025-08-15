import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  sourceType: text("source_type", {
    enum: ["upload", "notion", "github"],
  }).notNull(),
  sourceUrl: text("source_url"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentRuns = pgTable("agent_runs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  goal: text("goal").notNull(),
  status: text("status", {
    enum: ["running", "completed", "failed"],
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentSteps = pgTable("agent_steps", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => agentRuns.id),
  step: integer("step").notNull(),
  thought: text("thought").notNull(),
  tool: text("tool").notNull(),
  input: text("input").notNull(),
  result: text("result").notNull(),
  tokenUsage: integer("token_usage"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
