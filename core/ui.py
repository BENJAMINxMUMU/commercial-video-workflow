# -*- coding: utf-8 -*-
"""Streamlit 通用 UI 组件：专业要点展示、可复制提示词块、保存提示。"""

import streamlit as st


def show_pro_points(points: list, title="📌 本环节专业要点"):
    """折叠展示专业要点。"""
    with st.expander(title, expanded=False):
        for p in points:
            st.markdown(f"- {p}")


def prompt_block(prompt: str, label="🤖 本环节 AI 提示词（点右上角复制）"):
    """展示可直接复制给大模型使用的提示词。"""
    st.markdown(f"**{label}**")
    st.code(prompt, language="text")


def saved_badge():
    st.caption("✅ 已自动保存到当前项目（可随时导出 JSON 备份）")


def section(title: str, desc: str = ""):
    st.markdown(f"### {title}")
    if desc:
        st.caption(desc)
