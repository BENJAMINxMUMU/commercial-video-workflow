# -*- coding: utf-8 -*-
"""环节 0：项目设置（全局上下文）"""

import streamlit as st
from core.config import VIDEO_TYPES, ASPECT_RATIOS, IRON_RULES, WORKFLOW_ORDER


def render(project: dict):
    m = project["meta"]
    st.markdown("### ⚙️ 项目设置")
    st.caption("全局上下文贯穿后续所有环节，请先填好再进入创意环节。")

    c1, c2 = st.columns(2)
    with c1:
        m["project_name"] = st.text_input("项目名称", value=m.get("project_name", ""),
                                           placeholder="如：星河科技 2025 品牌宣传片")
        m["client"] = st.text_input("客户 / 品牌", value=m.get("client", ""),
                                    placeholder="如：星河科技")
        m["video_type"] = st.selectbox("影片类型", list(VIDEO_TYPES.keys()),
                                        index=list(VIDEO_TYPES.keys()).index(m.get("video_type", "广告片")))
    with c2:
        m["duration"] = st.text_input("影片时长", value=m.get("duration", "30秒"),
                                      placeholder="如：30秒 / 2分钟")
        m["aspect_ratio"] = st.selectbox("画幅比例", ASPECT_RATIOS,
                                         index=ASPECT_RATIOS.index(m.get("aspect_ratio", "16:9 横屏")))
        m["channel"] = st.text_input("投放渠道", value=m.get("channel", ""),
                                     placeholder="如：抖音 / 分众电梯 / 官网 / 展会大屏")

    m["audience"] = st.text_area("目标受众画像", value=m.get("audience", ""),
                                 placeholder="如：25-40岁一线城市新中产，理性决策者，关注科技与品质",
                                 height=70)

    col_a, col_b = st.columns([1, 3])
    with col_a:
        m["accent_color"] = st.color_picker("提报 PPT 主色", value=m.get("accent_color", "#C8102E"))
    with col_b:
        st.markdown("**当前影片类型说明**")
        st.info(VIDEO_TYPES[m["video_type"]]["desc"])

    # 视频类型差异化参数提示
    extra = VIDEO_TYPES[m["video_type"]]["extra_params"]
    if extra:
        st.markdown("**本类型的差异化参数（后续环节会自动加入提示词）**")
        for name, desc in extra:
            st.markdown(f"- `{name}`：{desc}")

    with st.expander("📜 五条专业铁律（贯穿全程）"):
        for r in IRON_RULES:
            st.markdown(f"- {r}")
    with st.expander("🧭 推荐执行顺序"):
        for i, o in enumerate(WORKFLOW_ORDER, 1):
            st.markdown(f"{i}. {o}")
