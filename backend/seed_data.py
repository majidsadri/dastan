"""Simple runner for the seed module."""

import sys
import os

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.seed import run

if __name__ == "__main__":
    run()
