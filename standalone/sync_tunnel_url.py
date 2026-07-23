#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动同步 cloudflared Quick Tunnel 地址到三页页脚。
Quick Tunnel 地址在每次 cloudflared 重启后会随机变化；本脚本轮询
supervisord 日志 /tmp/preview-tunnel-8000.log 中的最新 trycloudflare 地址，
并把它写入 workbench.html / index.html / workflow.html，避免页脚显示失效地址。
"""
import os
import re
import time

LOG = "/tmp/preview-tunnel-8000.log"
DIR = "/workspace/commercial_video_workflow/standalone"
FILES = [os.path.join(DIR, f) for f in ("workbench.html", "index.html", "workflow.html")]
CURRENT_URL_FILE = os.path.join(DIR, "CURRENT_URL.txt")

URL_RE = re.compile(r"https://([a-z0-9-]+\.trycloudflare\.com)")


def latest_url():
    try:
        txt = open(LOG, encoding="utf-8", errors="ignore").read()
    except FileNotFoundError:
        return None
    urls = URL_RE.findall(txt)
    return urls[-1] if urls else None


def sync():
    domain = latest_url()
    if not domain:
        return
    changed = False
    for f in FILES:
        try:
            t = open(f, encoding="utf-8").read()
        except FileNotFoundError:
            continue
        new = re.sub(r"[a-z0-9-]+\.trycloudflare\.com", domain, t)
        if new != t:
            open(f, "w", encoding="utf-8").write(new)
            changed = True
    if changed:
        try:
            open(CURRENT_URL_FILE, "w", encoding="utf-8").write(
                "https://" + domain + "/workbench.html\n")
        except Exception:
            pass
        print(time.strftime("%H:%M:%S"), "synced ->", domain, flush=True)


if __name__ == "__main__":
    print("tunnel-url sync monitor started", flush=True)
    while True:
        try:
            sync()
        except Exception as e:
            print(time.strftime("%H:%M:%S"), "err", e, flush=True)
        time.sleep(10)
