#!/usr/bin/env python3
"""
Hotkey voice dictation for Claude Code (or any focused text field).

Tap the hotkey (default F9) to start recording, tap again to stop. On stop the
audio goes to Groq whisper-large-v3; the transcript is copied to the clipboard
and pasted (Ctrl+V) into whatever window has focus.

TASK="translate" (default) -> output is always English, great for mixed-language
speech. TASK="transcribe" -> verbatim in the spoken language (uses VOICE_LANG).

Setup:
  pip install -r requirements.txt
  export GROQ_API_KEY="gsk_..."        # (setx on Windows)
  python voice-dictation.py
Quit with Esc (or Ctrl+C).
"""
import os, sys, io, wave, threading
import numpy as np

try:
    import sounddevice as sd
    import requests
    import keyboard
    import pyperclip
except ImportError as e:
    print("Missing dependency:", e)
    print("Run:  pip install -r requirements.txt")
    sys.exit(1)

SAMPLE_RATE = 16000
CHANNELS = 1
HOTKEY = os.environ.get("VOICE_HOTKEY", "f9")
GROQ_MODEL = os.environ.get("VOICE_MODEL", "whisper-large-v3")
LANGUAGE = os.environ.get("VOICE_LANG", "en")
# translate -> always English output; transcribe -> verbatim in VOICE_LANG.
TASK = os.environ.get("VOICE_TASK", "translate")
GROQ_BASE = "https://api.groq.com/openai/v1/audio"
GROQ_URL = f"{GROQ_BASE}/translations" if TASK == "translate" else f"{GROQ_BASE}/transcriptions"
BIAS_PROMPT = os.environ.get("VOICE_PROMPT", "")

_frames = []
_recording = False
_lock = threading.Lock()


def _callback(indata, frames, time_info, status):
    with _lock:
        if _recording:
            _frames.append(indata.copy())


def _wav_bytes(frames):
    audio = np.concatenate(frames, axis=0)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(CHANNELS)
        w.setsampwidth(2)  # int16
        w.setframerate(SAMPLE_RATE)
        w.writeframes(audio.tobytes())
    buf.seek(0)
    return buf.read()


def _transcribe(wav_bytes):
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        return None, "GROQ_API_KEY not set"
    try:
        data = {"model": GROQ_MODEL, "response_format": "json"}
        if BIAS_PROMPT:
            data["prompt"] = BIAS_PROMPT
        if TASK != "translate":
            data["language"] = LANGUAGE  # translations endpoint forbids language
        resp = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {key}"},
            files={"file": ("speech.wav", wav_bytes, "audio/wav")},
            data=data,
            timeout=60,
        )
        if resp.status_code != 200:
            return None, f"Groq {resp.status_code}: {resp.text[:200]}"
        return resp.json().get("text", "").strip(), None
    except Exception as e:
        return None, str(e)


def _toggle():
    global _recording, _frames
    with _lock:
        _recording = not _recording
        if _recording:
            _frames = []
    if _recording:
        print("recording... (tap hotkey again to stop)")
        return
    print("transcribing...")
    with _lock:
        frames = list(_frames)
    if not frames:
        print("...no audio captured.")
        return
    text, err = _transcribe(_wav_bytes(frames))
    if err:
        print("error:", err)
        return
    if not text:
        print("...empty transcript.")
        return
    print("text:", text)
    try:
        pyperclip.copy(text)
        keyboard.send("ctrl+v")
        print("pasted into the focused window.")
    except Exception as e:
        print("Copied to clipboard (paste manually):", e)


def main():
    print(f"Voice dictation ready. Hotkey: {HOTKEY.upper()} = start/stop. Esc = quit.")
    if not os.environ.get("GROQ_API_KEY"):
        print("WARNING: GROQ_API_KEY is not set — set it before recording.")
    try:
        with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS,
                            dtype="int16", callback=_callback):
            keyboard.add_hotkey(HOTKEY, _toggle)
            keyboard.wait("esc")
    except Exception as e:
        print("Fatal:", e)
        sys.exit(1)
    print("bye.")


if __name__ == "__main__":
    main()
