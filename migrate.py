"""Run lightweight development migrations.

Usage:
  python migrate.py

This script applies idempotent ALTER TABLE operations for simple schema fixes.
Not intended as a production migration system — use Alembic for production.
"""
from app.migrations import run_all


if __name__ == "__main__":
    run_all()
