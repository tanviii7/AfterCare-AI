#!/usr/bin/env python3
"""
CareFlow Startup Script
Run this script to start both backend and frontend simultaneously.
"""
import subprocess
import sys
import os
import time

BACKEND_DIR = os.path.join(os.path.dirname(__file__), 'backend')
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), 'frontend')
VENV_PYTHON = os.path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe')

def start_server():
    print("=" * 60)
    print("  CareFlow AI Post-Treatment Platform")
    print("=" * 60)
    print()
    print("Starting backend API server on http://localhost:8000 ...")
    
    # Start backend
    backend_proc = subprocess.Popen(
        [VENV_PYTHON, "-m", "uvicorn", "backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=os.path.dirname(__file__),
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
    
    time.sleep(3)  # Give backend time to start

    print("Starting frontend dev server on http://localhost:5173 ...")
    
    # Start frontend
    node_path = r"C:\Program Files\nodejs"
    npm_cmd = os.path.join(node_path, "npm.cmd")
    
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
    
    print()
    print("=" * 60)
    print("  CareFlow is starting up!")
    print()
    print("  Backend API:  http://localhost:8000")
    print("  API Docs:     http://localhost:8000/docs")
    print("  Frontend App: http://localhost:5173")
    print()
    print("  Demo Login: patient@example.com / password")
    print("  Or click 'Demo Patient Login' on the login page")
    print("=" * 60)
    print()
    print("Press CTRL+C to stop all servers...")
    
    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start_server()
