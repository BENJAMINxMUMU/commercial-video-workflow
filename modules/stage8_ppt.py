# -*- coding: utf-8 -*-
"""环节 8：PPT 创意方案整合输出（15 页标准可提报方案）"""

import os
import streamlit as st
from core.ppt_builder import build
from core.config import SELFCHECK
from core.ui import section

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")


def render(project: dict):
    section("📊 环节 8 · PPT 整合", "把前面所有产出按 15 页标准结构编排，导出可提报创意方案。")
    s8 = project["stage8"]

    st.markdown("#### 提报方案信息（可覆盖自动内容）")
    c1, c2 = st.columns(2)
    with c1:
        s8["ppt_title"] = st.text_input("封面主标题", value=s8.get("ppt_title", ""), placeholder="留空则用项目名称")
        s8["ppt_subtitle"] = st.text_input("封面副标题", value=s8.get("ppt_subtitle", ""), placeholder="留空则用「创意方向名」")
    with c2:
        s8["contact"] = st.text_input("结尾联系方式", value=s8.get("contact", ""), placeholder="公司 / 电话 / 邮箱")
        s8["schedule_text"] = st.text_area("排期备注", value=s8.get("schedule_text", ""), height=45)
    s8["team_text"] = st.text_area("执行团队 / 同类案例", value=s8.get("team_text", ""), height=70,
                                   placeholder="核心主创介绍 + 同类项目经验…")

    st.markdown("#### 15 页结构预览")
    pages = [
        "P1 封面 · 项目名+创意方向+主视觉",
        "P2 目录 · 八大模块",
        "P3 项目理解 · 需求解读",
        "P4 核心策略 · 为什么选这个方向",
        "P5 创意概念 · 一句话创意+情绪关键词",
        "P6 故事架构 · 叙事结构+情绪曲线",
        "P7-P9 分镜精选 · 关键镜头分镜图",
        "P10 视觉风格 · Moodboard+影调色板",
        "P11 美术置景 · 主场景+服化道",
        "P12 演员角色 · 角色设定+选角",
        "P13 制作排期 · 筹备-拍摄-后期",
        "P14 执行团队 · 主创+同类案例",
        "P15 结尾页 · Slogan+联系方式",
    ]
    for p in pages:
        st.markdown(f"- {p}")

    st.markdown("#### ✅ 提报前质量自检")
    for chk in SELFCHECK:
        st.checkbox(chk, key="chk_" + str(SELFCHECK.index(chk)))

    st.markdown("---")
    if st.button("🚀 生成并导出 PPTX", type="primary"):
        name = (project["meta"].get("project_name") or "创意方案").strip().replace(" ", "_") or "创意方案"
        out_path = os.path.join(OUTPUT_DIR, f"{name}_创意提报方案.pptx")
        try:
            build(project, out_path)
            with open(out_path, "rb") as f:
                data = f.read()
            st.success(f"✅ 已生成：{os.path.basename(out_path)}（{len(data)//1024} KB）")
            st.download_button("⬇️ 下载 PPTX", data, file_name=os.path.basename(out_path),
                               mime="application/vnd.openxmlformats-officedocument.presentationml.presentation")
            st.info(f"文件已保存至：{out_path}")
        except Exception as e:
            st.error(f"生成失败：{e}")
