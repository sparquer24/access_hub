# Start the Flask development server using the virtual environment

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Change to backend directory
Push-Location $scriptDir

# Activate the virtual environment
& ".\venv\Scripts\Activate.ps1"

# Run the Flask server
python wsgi.py

# Keep window open
Read-Host "Press Enter to exit"
