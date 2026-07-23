# -*- coding: utf-8 -*-
"""环节 2：创意策划 / 内容创作 → 3 套差异化创意方向"""

import streamlit as st
from core.config import VIDEO_TYPES
from core.ui import show_pro_points, prompt_block, saved_badge, section

PRO_POINTS = [
    "商业视频五大创意范式：广告片（问题-解决/情感共鸣/场景代入/对比反差）、企业宣传片（实力/故事/理念/人物群像）、微电影（完整故事）、产品宣传片（功能拆解/场景/原理/证言）、短视频（3秒钩子+信息密度+CTA）。",
    "至少产出 3 套差异化方向（保守型/冒险型/平衡型），给客户选择感。",
    "每套方向附：创意概念 + 叙事结构 + 风格关键词 + 参考片链接。",
]

TEMPLATE = """你是4A广告公司资深创意总监。基于以下需求简报，输出3套差异化创意方向：
【需求简报】
{brd}
【影片类型】{vtype}
【时长】{duration}
{extra_block}
每套方向按以下结构输出：
■ 方向名称：（四字以内，如「微光之路」）
■ 一句话创意：用一句话讲清核心概念（不超过25字）
■ 叙事结构：开场钩子→中段展开→高潮落点→结尾收束，各1句
■ 视觉调性：3-5个风格关键词 + 1句整体画面感受
■ 情绪曲线：标注起承转合的情绪起伏（如：平静→紧张→释然→振奋）
■ 适配理由：为什么这个方向适合本项目的受众与目标（2条）

要求：三个方向要有明显差异（如分别走情感路线、科技路线、纪实路线），不要同质化；
每个方向都要能落地拍摄，避免纯概念空谈；结尾必须自然带出品牌/产品，不生硬。"""


def _brd_text(project: dict) -> str:
    brd = project["stage1"].get("brd", {})
    lines = [
        f"项目定位：{brd.get('positioning','')}",
        f"核心目标：{brd.get('core_goal','')}",
        f"目标受众：{brd.get('audience','')}",
        f"必传信息：{brd.get('must_info','')}",
        f"风格倾向：{brd.get('style','')}",
        f"约束条件：{brd.get('constraints','')}",
        f"隐性需求：{brd.get('hidden','')}",
    ]
    return "\n".join(lines)


def build_prompt(project: dict) -> str:
    vtype = project["meta"]["video_type"]
    extra = VIDEO_TYPES[vtype]["extra_params"]
    extra_block = ""
    if extra:
        extra_block = "【本类型差异化参数，请在方向中回应】\n" + "\n".join(
            f"- {n}：{d}" for n, d in extra)
    return TEMPLATE.format(brd=_brd_text(project) or "（待填写需求简报）",
                           vtype=vtype,
                           duration=project["meta"].get("duration", ""),
                           extra_block=extra_block)


def render(project: dict):
    section("💡 环节 2 · 创意策划", "产出 3 套差异化方向，客户选定一套进入脚本细化。")
    show_pro_points(PRO_POINTS)

    s2 = project["stage2"]
    # 视频类型差异化参数
    vtype = project["meta"]["video_type"]
    for name, desc in VIDEO_TYPES[vtype]["extra_params"]:
        s2["extra"][name] = st.text_input(f"差异化参数 · {name}",
                                          value=s2["extra"].get(name, ""),
                                          help=desc)

    prompt_block(build_prompt(project))

    st.markdown("#### 3 套创意方向（AI 输出后整理填入，或手动填写）")
    dirs = s2.setdefault("directions", [{} for _ in range(3)])
    while len(dirs) < 3:
        dirs.append({})

    opts = [f"方向 {i+1}：「{d.get('name','未命名')}」" for i, d in enumerate(dirs)]
    sel = st.radio("选定提报方向（后续环节将围绕它展开）",
                   options=opts,
                   index=min(s2.get("chosen", 0), len(dirs) - 1),
                   horizontal=True)
    s2["chosen"] = int(''.join(c for c in sel.split('：')[0] if c.isdigit())) - 1
    chosen = s2["chosen"]

    for i, d in enumerate(dirs):
        with st.expander(f"方向 {i+1}" + (f" · 「{d.get('name','')}」" if d.get('name') else ""),
                         expanded=(i == chosen)):
            d["name"] = st.text_input("方向名称（四字以内）", value=d.get("name", ""), key=f"d{i}_name")
            d["logline"] = st.text_input("一句话创意（≤25字）", value=d.get("logline", ""), key=f"d{i}_log")
            d["narrative"] = st.text_area("叙事结构（开场→中段→高潮→结尾）", value=d.get("narrative", ""), height=70, key=f"d{i}_nar")
            d["visual_tone"] = st.text_area("视觉调性（关键词 + 整体感受）", value=d.get("visual_tone", ""), height=50, key=f"d{i}_vt")
            d["emotion_curve"] = st.text_input("情绪曲线", value=d.get("emotion_curve", ""), key=f"d{i}_ec")
            d["rationale"] = st.text_area("适配理由", value=d.get("rationale", ""), height=50, key=f"d{i}_rat")
            d["references"] = st.text_area("参考片链接（片名+链接）", value=d.get("references", ""), height=50, key=f"d{i}_ref")
    saved_badge()
