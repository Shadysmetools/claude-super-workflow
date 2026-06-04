# Launch hotkey voice dictation (Windows).
# Set your Groq key once:  setx GROQ_API_KEY "gsk_..."   (then open a NEW terminal)
# For this session only:    $env:GROQ_API_KEY = "gsk_..."

$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { $py = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" }
if (-not (Test-Path $py)) {
  Write-Host "Python not found. Install Python 3.10+ first." -ForegroundColor Yellow
  exit 1
}

# Pull the persisted key from the user environment if this shell didn't inherit it.
if (-not $env:GROQ_API_KEY) {
  $env:GROQ_API_KEY = [Environment]::GetEnvironmentVariable('GROQ_API_KEY','User')
}
if (-not $env:GROQ_API_KEY) {
  Write-Host "GROQ_API_KEY is not set." -ForegroundColor Yellow
  Write-Host '  setx GROQ_API_KEY "gsk_your_key"   (then open a NEW terminal)' -ForegroundColor DarkGray
}

# Easy single-key shortcut by default. Override with $env:VOICE_HOTKEY before launching.
if (-not $env:VOICE_HOTKEY) { $env:VOICE_HOTKEY = "f9" }

& $py "$PSScriptRoot\voice-dictation.py"
