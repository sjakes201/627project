"""
Short-Form Video Tracker for Google Chrome
-------------------------------------------
Polls Chrome's active tab URL once per second and logs
whenever you're watching short-form video (YouTube Shorts,
Instagram Reels, TikTok, Facebook Reels, Snapchat Spotlight).
Outputs a JSON file with per-session and total durations.

SETUP (required once):
  Close Chrome fully, then relaunch it from a terminal with:

  Windows:  chrome.exe --remote-debugging-port=9222
  macOS:    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
  Linux:    google-chrome --remote-debugging-port=9222

  Then run:  pip install requests
             python short_form_tracker.py
"""

import time
import json
import os
import requests
from datetime import datetime
from typing import Optional

LOG_FILE = "short_form_log.json"
POLL_INTERVAL = 1  # seconds
DEBUG_URL = "http://localhost:9222"

PATTERNS = {
    "YouTube Shorts":       "youtube.com/shorts",
    "Instagram Reels":      "instagram.com/reels",
    "TikTok":               "tiktok.com",
    "Facebook Reels":       "facebook.com/reel",
    "Snapchat Spotlight":   "snapchat.com/spotlight",
}


def classify_url(url: str) -> Optional[str]:
    if not url:
        return None
    for label, pattern in PATTERNS.items():
        if pattern in url:
            return label
    return None


def get_active_tab_url() -> Optional[str]:
    try:
        resp = requests.get(f"{DEBUG_URL}/json", timeout=2)
        tabs = resp.json()
    except (requests.ConnectionError, requests.Timeout):
        return None
    for tab in tabs:
        if tab.get("type") == "page":
            return tab.get("url", "")
    return None


def load_log() -> dict:
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            return json.load(f)
    return {
        "totals_seconds": {label: 0 for label in PATTERNS},
        "totals_readable": {label: "0s" for label in PATTERNS},
        "sessions": [],
    }


def save_log(data: dict):
    # Recompute readable totals on every save
    data["totals_readable"] = {
        k: format_duration(v) for k, v in data["totals_seconds"].items()
    }
    with open(LOG_FILE, "w") as f:
        json.dump(data, f, indent=2)


def format_duration(seconds: int) -> str:
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    parts = []
    if h:
        parts.append(f"{h}h")
    if m:
        parts.append(f"{m}m")
    parts.append(f"{s}s")
    return " ".join(parts)


def close_session(log: dict, platform: str, url: str, start: datetime):
    duration = int((datetime.now() - start).total_seconds())
    log["sessions"].append({
        "platform": platform,
        "url": url,
        "start": start.isoformat(),
        "end": datetime.now().isoformat(),
        "duration_seconds": duration,
        "duration_readable": format_duration(duration),
    })
    log["totals_seconds"][platform] = log["totals_seconds"].get(platform, 0) + duration
    save_log(log)
    return duration


def main():
    log = load_log()
    print("Short-Form Video Tracker")
    print(f"Logging to: {os.path.abspath(LOG_FILE)}")
    print(f"Polling every {POLL_INTERVAL}s  —  Ctrl+C to stop\n")

    test_url = get_active_tab_url()
    if test_url is None:
        print("ERROR: Cannot connect to Chrome.")
        print("Make sure Chrome is running with: --remote-debugging-port=9222")
        return

    print("Connected to Chrome.\n")

    prev_platform = None
    prev_url = None
    session_start = None

    try:
        while True:
            url = get_active_tab_url()
            platform = classify_url(url)

            if platform and prev_platform is None:
                session_start = datetime.now()
                print(f"[{session_start:%H:%M:%S}]  ▶  {platform}  —  {url}")

            elif platform and platform != prev_platform:
                dur = close_session(log, prev_platform, prev_url, session_start)
                print(f"[{datetime.now():%H:%M:%S}]  ■  {prev_platform} ended ({format_duration(dur)})")
                session_start = datetime.now()
                print(f"[{session_start:%H:%M:%S}]  ▶  {platform}  —  {url}")

            elif not platform and prev_platform is not None:
                dur = close_session(log, prev_platform, prev_url, session_start)
                print(f"[{datetime.now():%H:%M:%S}]  ■  {prev_platform} ended ({format_duration(dur)})")
                session_start = None

            prev_platform = platform
            prev_url = url
            time.sleep(POLL_INTERVAL)

    except KeyboardInterrupt:
        if prev_platform:
            dur = close_session(log, prev_platform, prev_url, session_start)
            print(f"\n[{datetime.now():%H:%M:%S}]  ■  {prev_platform} ended ({format_duration(dur)})")

        save_log(log)
        print("\nStopped. Log saved to:", os.path.abspath(LOG_FILE))


if __name__ == "__main__":
    main()
