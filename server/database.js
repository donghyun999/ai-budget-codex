import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRICING_PLANS } from './constants.js';

const defaultDataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

export function getDefaultDatabasePath() {
  return process.env.DATABASE_PATH || path.join(defaultDataDir, 'ai-budget.db');
}

export function createDatabase(databasePath = getDefaultDatabasePath()) {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }
  const db = new Database(databasePath);
  db.pragma('foreign_keys = ON');
  if (databasePath !== ':memory:') db.pragma('journal_mode = WAL');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_no TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL,
      request_date TEXT NOT NULL,
      requester TEXT NOT NULL,
      department_head TEXT NOT NULL,
      use_start TEXT NOT NULL,
      use_end TEXT NOT NULL,
      budget_type TEXT NOT NULL CHECK (budget_type IN ('판관비 추경', '부서 기편성예산', '임원 예산')),
      budget_account TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      purpose TEXT NOT NULL,
      scope TEXT NOT NULL,
      expected_effect TEXT NOT NULL,
      limitation_reason TEXT NOT NULL,
      extended_use_reason TEXT NOT NULL DEFAULT '',
      stage INTEGER NOT NULL DEFAULT 2 CHECK (stage BETWEEN 1 AND 9),
      status TEXT NOT NULL DEFAULT '부서장 승인 대기',
      total_required INTEGER NOT NULL DEFAULT 0 CHECK (total_required >= 0),
      total_deduction INTEGER NOT NULL DEFAULT 0 CHECK (total_deduction >= 0),
      total_additional INTEGER NOT NULL DEFAULT 0 CHECK (total_additional >= 0),
      pi_received_at TEXT,
      urgent_case INTEGER NOT NULL DEFAULT 0 CHECK (urgent_case IN (0, 1)),
      receipt_note TEXT NOT NULL DEFAULT '',
      pi_specific INTEGER,
      pi_plan_appropriate INTEGER,
      pi_no_duplicate INTEGER,
      pi_opinion TEXT NOT NULL DEFAULT '',
      pi_review_date TEXT,
      pi_reviewer TEXT,
      budget_available INTEGER,
      account_appropriate INTEGER,
      supplemental_needed INTEGER,
      budget_opinion TEXT NOT NULL DEFAULT '',
      budget_review_date TEXT,
      budget_reviewer TEXT,
      final_decision TEXT CHECK (final_decision IN ('승인', '조건부 승인', '반려')),
      final_comment TEXT NOT NULL DEFAULT '',
      final_decision_date TEXT,
      final_approver TEXT,
      execution_status TEXT NOT NULL DEFAULT '',
      receipt_reference TEXT NOT NULL DEFAULT '',
      monthly_usage_note TEXT NOT NULL DEFAULT '',
      payment_history_note TEXT NOT NULL DEFAULT '',
      execution_updated_at TEXT,
      performance_output TEXT NOT NULL DEFAULT '',
      performance_usage TEXT NOT NULL DEFAULT '',
      performance_savings TEXT NOT NULL DEFAULT '',
      continue_use INTEGER,
      performance_reported_at TEXT,
      settlement_action TEXT NOT NULL DEFAULT '',
      refund_amount INTEGER NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
      settlement_note TEXT NOT NULL DEFAULT '',
      settled_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS application_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      tools TEXT NOT NULL,
      monthly_price INTEGER NOT NULL CHECK (monthly_price >= 0),
      months INTEGER NOT NULL CHECK (months BETWEEN 1 AND 12),
      required_amount INTEGER NOT NULL CHECK (required_amount >= 0),
      deduction_amount INTEGER NOT NULL CHECK (deduction_amount >= 0),
      additional_amount INTEGER NOT NULL CHECK (additional_amount >= 0),
      note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS workflow_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 9),
      action_type TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      result TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS pricing_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool TEXT NOT NULL,
      plan TEXT NOT NULL,
      monthly_price INTEGER NOT NULL CHECK (monthly_price >= 0),
      annual_price INTEGER,
      note TEXT NOT NULL,
      UNIQUE(tool, plan)
    );

    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_department ON applications(department);
    CREATE INDEX IF NOT EXISTS idx_history_application ON workflow_history(application_id, id);
  `);

  const insertPlan = db.prepare(`
    INSERT OR IGNORE INTO pricing_plans(tool, plan, monthly_price, annual_price, note)
    VALUES (?, ?, ?, ?, ?)
  `);
  const seedPlans = db.transaction(() => {
    for (const plan of PRICING_PLANS) insertPlan.run(...plan);
  });
  seedPlans();
}
