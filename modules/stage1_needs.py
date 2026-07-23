# -*- coding: utf-8 -*-
"""环节 1：客户需求提炼 / 内容提炼 → 结构化《需求简报 BRD》"""

import streamlit as st
from core.ui import show_pro_points, prompt_block, saved_badge, section

PRO_POINTS = [
    "用结构化问卷替代自由访谈，必问 7 项：影片类型、用途场景、目标受众、核心信息、时长、预算区间、交付时间。",
    "区分“客户说要的“和“客户真正需要的”——客户说“要高大上”，实际可能是“要增强经销商信心”。",
    "输出物：《需求简报 BRD》，含项目背景、传播目标、受众画像、核心诉求、禁忌清单。",
]

TEMPLATE = """你是资深影视策划，根据以下客户原始需求，输出一份结构化的《项目需求简报》：
【客户原始需求】{raw_need}

请按以下结构输出：
1. 项目定位：影片类型 + 用途场景 + 投放渠道
2. 核心目标：看完影片后希望受众产生什么行动/认知（用动词开头）
3. 目标受众：人群画像 + 观看心态 + 决策角色
4. 必传信息：必须出现的 3-5 条核心信息（按优先级排序）
5. 风格倾向：客户暗示的调性关键词（如科技感/温情/高端/快节奏）
6. 约束条件：时长、预算量级、交付周期、明确禁忌
7. 隐性需求推断：客户没说但实际需要的是什么（用商业逻辑推导）

要求：专业、精炼，每条不超过30字；隐性需求部分标注“推断"""


def build_prompt(project: dict) -> str:
    raw = project["stage1"].get("raw_need", "")
    return TEMPLATE.format(raw_need=raw or "（请先在左侧/上方填写客户原始需求）")


def render(project: dict):
    section("📋 环节 1 · 需求提炼", "把客户原话提炼成可执行的《需求简报 BRD》，前一步产出是创意环节的刚需输入。")
    show_pro_points(PRO_POINTS)

    s1 = project["stage1"]
    s1["raw_need"] = st.text_area("① 客户原始需求 / 会议纪要", value=s1.get("raw_need", ""),
                                  height=120,
                                  placeholder="粘贴客户原话、微信记录、brief 文档…")

    prompt_block(build_prompt(project))

    st.markdown("#### ② 《需求简报 BRD》填写（AI 输出后整理填入，或直接手写）")
    brd = s1.setdefault("brd", {})
    brd["positioning"] = st.text_area("项目定位（类型+场景+渠道）", value=brd.get("positioning", ""), height=60)
    brd["core_goal"] = st.text_area("核心目标（动词开头：让受众…）", value=brd.get("core_goal", ""), height=60)
    brd["audience"] = st.text_area("目标受众（画像+心态+决策角色）", value=brd.get("audience", ""), height=60)
    brd["must_info"] = st.text_area("必传信息（3-5 条，按优先级）", value=brd.get("must_info", ""), height=70)
    brd["style"] = st.text_area("风格倾向（调性关键词）", value=brd.get("style", ""), height=50)
    brd["constraints"] = st.text_area("约束条件（时长/预算/周期/禁忌）", value=brd.get("constraints", ""), height=60)
    brd["hidden"] = st.text_area("隐性需求推断（标注“推断”）", value=brd.get("hidden", ""), height=60)
    saved_badge()
