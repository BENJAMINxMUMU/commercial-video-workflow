# -*- coding: utf-8 -*-
"""环节 3：创意脚本 / 故事性脚本（含参考视频）"""

import streamlit as st
from core.config import VIDEO_TYPES
from core.ui import show_pro_points, prompt_block, saved_badge, section


PRO_POINTS = [
    "创意脚本 = 文学脚本，侧重“讲什么故事”，不分镜头，按场景/段落写。",
    "包含：场景描述 + 人物动作 + 台词/旁白 + 音效/音乐提示。",
    "必须配套参考视频清单：每段情绪/节奏对应 1-2 条参考片，标注参考什么（节奏/构图/色调/表演）。",
    "广告片按秒控时长，企业宣传片按段落控时长，微电影按幕结构控时长。",
]

TEMPLATE = """你是资深影视编剧。基于选定的创意方向，撰写完整的创意脚本（文学脚本）：
【选定方向】{direction}
【总时长】{duration}
【核心信息】{core_info}

脚本格式要求：
【第X段 / XX"-XX"】
■ 场景：（时间、地点、环境氛围）
■ 画面：（人物动作、关键事件，用现在时描写）
■ 旁白/台词：（逐字稿，标注“旁白“或角色名）
■ 声音设计：（音乐情绪变化、关键音效）
■ 参考片：（片名+链接+参考维度，如“参考《XX》00:30处的光影质感”）

额外要求：
1. 严格控制每段时长，总时长误差不超过±5秒
2. 旁白字数按每秒3-4字估算，台词按每秒2-3字估算
3. 开场前3秒必须有钩子（视觉冲击/悬念/情绪代入）
4. 结尾必须包含品牌/产品露出和slogan，露出方式要自然
5. 标注全片节奏BPM建议和音乐风格参考"""


def _chosen_direction(project: dict) -> str:
    dirs = project["stage2"].get("directions", [])
    idx = min(project["stage2"].get("chosen", 0), max(len(dirs) - 1, 0))
    if idx < len(dirs):
        d = dirs[idx]
        return f"「{d.get('name','')}」{d.get('logline','')}"
    return "（请先在环节2选定方向）"


def build_prompt(project: dict) -> str:
    core = project["stage1"].get("brd", {}).get("must_info", "")
    vtype = project["meta"]["video_type"]
    extra = ""
    if VIDEO_TYPES[vtype]["extra_params"]:
        extra = "\n【本类型差异化参数】\n" + "\n".join(
            f"- {n}：{d}" for n, d in VIDEO_TYPES[vtype]["extra_params"])
    return TEMPLATE.format(direction=_chosen_direction(project),
                           duration=project["meta"].get("duration", ""),
                           core_info=core or "（待填写必传信息）") + extra


def render(project: dict):
    section("📝 环节 3 · 创意脚本", "文学脚本 + 参考视频清单，按段落/场景控制时长。")
    show_pro_points(PRO_POINTS)

    s3 = project["stage3"]
    prompt_block(build_prompt(project))

    st.markdown("#### 脚本段落（AI 输出后整理填入）")
    segs = s3.setdefault("segments", [])
    if not segs:
        segs.append({})
    n = len(segs)
    for i in range(n):
        seg = segs[i]
        with st.expander(f"段落 {i+1}" + (f" · {seg.get('time','')}" if seg.get('time') else ""), expanded=(i == 0)):
            c1, c2 = st.columns([1, 3])
            with c1:
                seg["time"] = st.text_input("时间区间", value=seg.get("time", ""), placeholder='00"-08"', key=f"seg{i}_t")
                seg["scene"] = st.text_input("场景", value=seg.get("scene", ""), key=f"seg{i}_s")
            with c2:
                seg["visual"] = st.text_area("画面（人物动作/事件）", value=seg.get("visual", ""), height=70, key=f"seg{i}_v")
                seg["voiceover"] = st.text_area("旁白/台词", value=seg.get("voiceover", ""), height=55, key=f"seg{i}_vo")
                seg["sound"] = st.text_area("声音设计", value=seg.get("sound", ""), height=45, key=f"seg{i}_sd")
                seg["reference"] = st.text_area("参考片（片名+链接+参考维度）", value=seg.get("reference", ""), height=45, key=f"seg{i}_rf")
        if st.button("🗑 删除段落", key=f"segdel{i}"):
            segs.pop(i)
            st.rerun()
    if st.button("➕ 添加段落"):
        segs.append({})
        st.rerun()

    c1, c2 = st.columns(2)
    with c1:
        s3["rhythm_bpm"] = st.text_input("节奏 BPM 建议", value=s3.get("rhythm_bpm", ""))
    with c2:
        s3["music_style"] = st.text_input("音乐风格参考", value=s3.get("music_style", ""))
    saved_badge()
