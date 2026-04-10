#!/bin/bash
cd /home/ubuntu/dastan/backend
source venv/bin/activate
exec uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
