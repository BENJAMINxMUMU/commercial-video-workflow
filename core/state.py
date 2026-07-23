# -*- coding: utf-8 -*-
"""
项目状态管理：在 Streamlit session_state 中维护全局 project 字典，
并提供默认结构、字段读写、JSON 导入导出等工具。
"""

import json
import os

# 项目默认结构 -----------------------------------------------------------------
def default_project() -> dict:
    return {
        "meta": {
            "project_name": "",
            "client": "",
            "video_type": "广告片",
            "duration": "30秒",
            "aspect_ratio": "16:9 横屏",
            "channel": "",
            "audience": "",
            "accent_color": "#C8102E",   # 提报 PPT 主色（默认中国红）
            "logo_path": "",
        },
        # 各阶段产出容器
        "stage1": {"raw_need": "", "brd": {}},
        "stage2": {"directions": [], "chosen": 0,
                   "extra": {}},  # extra: 视频类型差异化参数
        "stage3": {"segments": [], "rhythm_bpm": "", "music_style": "",
                   "extra": {}},
        "stage4": {"shots": [], "rhythm_note": "", "extra": {}},
        "stage5": {"boards": [], "style_lock": {}},  # style_lock: 一致性设定
        "stage6": {"timeline": "", "kb_effects": "", "transitions": "",
                   "sound_design": "", "beat_points": "", "checklist": ""},
        "stage7": {"moodboard": {}, "art_set": [], "actors": [],
                   "props": [], "style_refs": []},
        "stage8": {"ppt_title": "", "ppt_subtitle": "", "contact": "",
                   "extra_pages": ""},
    }


# 字段读写 ---------------------------------------------------------------------
def get(project: dict, path: str, default=None):
    """按 'stage1.brd.core_goal' 形式读取嵌套字段。"""
    cur = project
    for key in path.split("."):
        if isinstance(cur, dict) and key in cur:
            cur = cur[key]
        else:
            return default
    return cur


def set_field(project: dict, path: str, value):
    """按路径写入嵌套字段，自动创建中间字典。"""
    keys = path.split(".")
    cur = project
    for key in keys[:-1]:
        if key not in cur or not isinstance(cur[key], dict):
            cur[key] = {}
        cur = cur[key]
    cur[keys[-1]] = value


# JSON 导入导出 ----------------------------------------------------------------
def to_json(project: dict) -> str:
    return json.dumps(project, ensure_ascii=False, indent=2)


def from_json(text: str) -> dict:
    data = json.loads(text)
    # 与默认结构合并，避免缺字段
    base = default_project()
    base.update(data)
    for k in base:
        if isinstance(base[k], dict) and k in data and isinstance(data[k], dict):
            base[k].update(data[k])
    return base


def save_to_file(project: dict, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(to_json(project))


def load_from_file(path: str) -> dict:
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return from_json(f.read())
    return default_project()
