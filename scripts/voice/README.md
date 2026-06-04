# 🎙️ Voice dictation

Tap a hotkey, speak in **any language**, get clean text auto-pasted wherever your cursor is. Powered by [Groq Whisper](https://groq.com) `whisper-large-v3`.

By default it runs in **translate** mode, so mixed-language speech (e.g. English + another language) comes out as clean **English**. Switch to verbatim transcription with `VOICE_TASK=transcribe`.

## Setup

```bash
pip install -r requirements.txt

# get a free key at https://console.groq.com/keys
# Windows:
setx GROQ_API_KEY "gsk_your_key"      # then open a NEW terminal
# macOS / Linux:
export GROQ_API_KEY="gsk_your_key"
```

## Run

**Windows:**
```powershell
powershell -File voice-dictation.ps1
```

**macOS / Linux:**
```bash
python voice-dictation.py
```

- Tap **F9** → start recording → tap **F9** again → text appears at your cursor.
- **Esc** → quit.

> Note: the `keyboard` library needs root on Linux (`sudo`) and Accessibility permission on macOS.

## Configuration (env vars)

| Var | Default | Meaning |
|---|---|---|
| `GROQ_API_KEY` | — | Your Groq API key (required). |
| `VOICE_HOTKEY` | `f9` | Start/stop key (e.g. `right ctrl`, `f4`, `ctrl+alt+space`). |
| `VOICE_TASK` | `translate` | `translate` = always English; `transcribe` = verbatim. |
| `VOICE_LANG` | `en` | Language hint for `transcribe` mode. |
| `VOICE_MODEL` | `whisper-large-v3` | Groq model. |
| `VOICE_PROMPT` | — | Optional bias prompt (domain terms/spellings). |

## Hidden / auto-start (optional, Windows)

To run with no visible window, launch `voice-dictation.py` with `pythonw.exe` (via a `.vbs` `WScript.Shell.Run … , 0`), and drop a shortcut to it in your Startup folder (`shell:startup`) so it's always ready on login.
