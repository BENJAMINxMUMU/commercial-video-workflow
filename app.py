# -*- coding: utf-8 -*-
"""
商业视频全流程策划工作流 · 工作台
Streamlit 主应用：侧边栏导航 9 个环节，session_state 贯穿全链路，
每个环节 AI 提示词自动根据上游产出渲染，最终一键导出 15 页 PPTX 提报方案。
"""

import os
import sys
import json
import importlib

sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st
from core.config import STAGES
from core.state import default_project, to_json, from_json

st.set_page_config(page_title="商业视频策划工作流", page_icon="🎬", layout="wide")

# ---------------------------------------------------------------------------
# 初始化项目状态
# ---------------------------------------------------------------------------
if "project" not in st.session_state:
    st.session_state.project = default_project()
if "active" not in st.session_state:
    st.session_state.active = "project"
if "uploaded_json" not in st.session_state:
    st.session_state.uploaded_json = None

project = st.session_state.project

MODULE_MAP = {s["id"]: s["module"] for s in STAGES}


def _render_stage(stage_id):
    mod = importlib.import_module(f"modules.{MODULE_MAP[stage_id]}")
    mod.render(project)


# ---------------------------------------------------------------------------
# 侧边栏
# ---------------------------------------------------------------------------
with st.sidebar:
    st.markdown("## 🎬 视频策划工作流")
    st.caption("需求 → 创意 → 脚本 → 分镜 → 提报 → PPT")

    # 环节导航
    for s in STAGES:
        label = f"{s['icon']} {s['title']}"
        if st.button(label, key=f"nav_{s['id']}", use_container_width=True,
                     type="primary" if st.session_state.active == s["id"] else "secondary"):
            st.session_state.active = s["id"]
            st.rerun()

    st.divider()

    # 进度概览
    filled = []
    if project["stage1"].get("brd", {}).get("core_goal"):
        filled.append("需求")
    if project["stage2"].get("directions"):
        filled.append("创意")
    if project["stage3"].get("segments"):
        filled.append("脚本")
    if project["stage4"].get("shots"):
        filled.append("分镜")
    if any(b.get("image_path") for b in project["stage5"].get("boards", [])):
        filled.append("分镜图")
    if project["stage6"].get("timeline"):
        filled.append("动态分镜")
    if project["stage7"].get("moodboard", {}).get("color_palette"):
        filled.append("提报资料")
    st.caption(f"已完成：{len(filled)}/8 ｜ {'、'.join(filled) or '未开始'}")

    st.divider()

    # 导入导出
    with st.expander("💾 项目备份 / 导入"):
        dl = st.download_button("⬇️ 导出 JSON", to_json(project),
                                file_name="video_project.json",
                                mime="application/json")
        up = st.file_uploader("⬆️ 导入 JSON", type=["json"], key="json_up")
        if up:
            try:
                st.session_state.project = from_json(up.getvalue().decode("utf-8"))
                st.success("已导入，刷新后生效")
                st.rerun()
            except Exception as e:
                st.error(f"导入失败：{e}")
        if st.button("🗑 清空重置项目", key="reset"):
            st.session_state.project = default_project()
            st.rerun()

# ---------------------------------------------------------------------------
# 主区域
# ---------------------------------------------------------------------------
active = st.session_state.active
meta = st.session_state.project["meta"]
st.markdown(f"**当前项目：** {meta.get('project_name') or '未命名'} ｜ "
            f"**类型：** {meta.get('video_type')} ｜ "
            f"**时长：** {meta.get('duration')} ｜ "
            f"**画幅：** {meta.get('aspect_ratio')}")

_render_stage(active)

st.divider()
st.caption("商业视频全流程策划工作流 v1.0 · 每个环节输出即下一环节输入，闭环不发散。")
