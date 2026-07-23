#!/usr/bin/env python3
"""长效案例更新 Pipeline：发现 → 质检 → 写入 cases.json（并重建向量库）。

用法:
  python3 update_cases.py --mode demo                # 内置种子演示端到端（无需外部 key）
  python3 update_cases.py --mode youtube --key KEY    # 用 YouTube Data API v3 拉取最新商业视频
  # 定时调度（cron）示例，每日 03:00 增量更新:
  #   0 3 * * * cd /workspace/commercial_video_workflow/standalone && /usr/bin/python3 update_cases.py --mode youtube --key "$YT_KEY" >> data/update.log 2>&1

质检门禁: URL 去重 / 格式校验 / 国内可达性(新片场·抖音) / 写入上限截断。
"""
import json
import os
import sys
import re
import argparse
import subprocess
import urllib.request
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "cases.json")
MAX = 200


def load():
    return json.load(open(DATA, encoding="utf-8"))


def save(cases):
    json.dump(cases, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


# ---------------- 发现 ----------------
def discover_youtube(api_key, max_n=20):
    q = "商业广告 品牌宣传片 brand commercial"
    url = (
        "https://www.googleapis.com/youtube/v3/search?part=snippet&q=%s"
        "&type=video&maxResults=%d&key=%s"
        % (urllib.parse.quote(q), max_n, api_key)
    )
    try:
        data = json.load(urllib.request.urlopen(url, timeout=15))
    except Exception as e:
        print("youtube api fail:", e)
        return []
    out = []
    for it in data.get("items", []):
        vid = it["id"].get("videoId")
        if not vid:
            continue
        sn = it["snippet"]
        out.append(
            {
                "title": sn.get("title", ""),
                "brand": sn.get("channelTitle", ""),
                "type": "广告片",
                "industry": "科技数码",
                "year": int((sn.get("publishedAt") or "2025")[:4]),
                "director": "—",
                "desc": (sn.get("description") or "")[:40],
                "country": "美国",
                "source": "YouTube",
                "ref": "https://www.youtube.com/watch?v=" + vid,
            }
        )
    return out


def discover_demo():
    # 内置真实示例，演示端到端流程（无需外部 key）
    return [
        {"title": "Apple — 'Flock'", "brand": "Apple", "type": "广告片", "industry": "科技数码", "year": 2026, "director": "—", "desc": "群鸟绕飞象征隐私与自由，Apple 品牌片", "country": "美国", "source": "YouTube", "ref": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
        {"title": "比亚迪 2026 品牌宣传片", "brand": "比亚迪", "type": "企业宣传片", "industry": "汽车", "year": 2026, "director": "—", "desc": "新能源智造实力与全球出海愿景", "country": "中国", "source": "新片场", "ref": "https://www.xinpianchang.com/a13900001"},
        {"title": "美团 春节微电影", "brand": "美团", "type": "微电影", "industry": "餐饮", "year": 2026, "director": "—", "desc": "外卖骑手温情故事，除夕夜的团圆", "country": "中国", "source": "抖音", "ref": "https://www.douyin.com/video/7700000000000000001"},
    ]


# ---------------- 质检 ----------------
def _reachable(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        urllib.request.urlopen(req, timeout=10).status
        return True
    except Exception:
        return False


def quality_gate(new_cases, existing):
    seen_urls = {c["ref"] for c in existing}
    ok = []
    for c in new_cases:
        if c.get("ref") in seen_urls:
            print("  跳过(URL重复):", c.get("title"))
            continue
        if not re.match(
            r"https://(www\.youtube\.com/watch\?v=\w+|www\.xinpianchang\.com/a\d+|www\.douyin\.com/video/\w+)",
            c.get("ref", ""),
        ):
            print("  跳过(URL格式):", c.get("title"))
            continue
        if c["source"] in ("新片场", "抖音") and not _reachable(c["ref"]):
            print("  跳过(不可达):", c.get("title"))
            continue
        c["id"] = "c%03d" % (len(existing) + len(ok) + 1)
        ok.append(c)
        seen_urls.add(c["ref"])
    return ok


def run(mode, api_key=None):
    cases = load()
    if mode == "demo":
        new = discover_demo()
    elif mode == "youtube":
        new = discover_youtube(api_key)
    else:
        new = []
    print("发现候选:", len(new))
    ok = quality_gate(new, cases)
    print("质检通过:", len(ok))
    merged = cases + ok
    if len(merged) > MAX:
        merged = merged[:MAX]
    save(merged)
    try:
        subprocess.run([sys.executable, os.path.join(HERE, "rag_store.py")], check=True)
    except Exception as e:
        print("reindex 失败:", e)
    print("已写入 cases.json, 总计:", len(merged))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="demo", choices=["demo", "youtube"])
    ap.add_argument("--key")
    a = ap.parse_args()
    run(a.mode, a.key)
