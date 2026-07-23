# -*- coding: utf-8 -*-
"""环节 4：分镜脚本制作（文字分镜 / 拍摄蓝图）"""

import streamlit as st
from core.config import SHOT_SIZES, CAMERA_MOVES, VIDEO_TYPES
from core.ui import show_pro_points, prompt_block, saved_badge, section


PRO_POINTS = [
    "文字分镜 = 拍摄蓝图，给导演/摄影/制片看的执行文档。",
    "标准八列：镜号、景别、运镜、画面内容、台词/旁白、时长、音效、备注。",
    "景别术语：WS远景/FS全景/MS中景/MCU近景/CU特写/ECU大特写。",
    "运镜术语：固定/推/拉/摇/移/跟/升降/手持。",
    "广告片15秒约8-12镜，30秒约15-20镜；宣传片每分钟约15-25镜。",
]

TEMPLATE = """你是资深分镜师。将以下创意脚本拆解为专业的文字分镜表：
【创意脚本】
{script}
【影片总时长】{duration}
【画幅比例】{aspect}

请输出标准分镜表格，每行一个镜头，包含以下字段：
| 镜号 | 景别 | 运镜 | 画面描述 | 旁白/台词 | 时长 | 音效/音乐 | 备注 |

专业规范：
1. 景别使用标准缩写：WS远景/FS全景/MS中景/MCU近景/CU特写/ECU大特写
2. 运镜使用标准术语：固定/推/拉/横摇/竖摇/平移/跟拍/升降/环绕/手持
3. 画面描述要具体到构图、光影、人物动作和表情，不用抽象词
4. 时长精确到0.5秒，所有镜头时长累加等于总时长
5. 备注栏标注特殊拍摄要求（如高速摄影/航拍/棚拍/特效合成）
6. 同一场景内的镜头按“建立镜头→中景对话→特写反应“的经典剪辑逻辑排列
7. 转场方式在备注中标注（切/叠化/闪白/匹配剪辑等）

输出完成后，附一段“剪辑节奏说明”：全片快慢分布、关键节奏点、剪辑风格建议。"""


def _script_text(project: dict) -> str:
    segs = project["stage3"].get("segments", [])
    if not segs:
        return "（待填写创意脚本）"
    out = []
    for i, s in enumerate(segs, 1):
        out.append(f"【段落{i} / {s.get('time','')}】\n场景：{s.get('scene','')}\n"
                   f"画面：{s.get('visual','')}\n旁白：{s.get('voiceover','')}\n"
                   f"声音：{s.get('sound','')}\n参考：{s.get('reference','')}")
    return "\n\n".join(out)


def build_prompt(project: dict) -> str:
    vtype = project["meta"]["video_type"]
    extra = ""
    if VIDEO_TYPES[vtype]["extra_params"]:
        extra = "\n【本类型差异化参数】\n" + "\n".join(
            f"- {n}：{d}" for n, d in VIDEO_TYPES[vtype]["extra_params"])
    return TEMPLATE.format(script=_script_text(project),
                           duration=project["meta"].get("duration", ""),
                           aspect=project["meta"].get("aspect_ratio", "")) + extra


def render(project: dict):
    section("🎬 环节 4 · 文字分镜", "八列分镜表 = 拍摄执行蓝图，是后续分镜图/动态分镜的输入。")
    show_pro_points(PRO_POINTS)

    s4 = project["stage4"]
    prompt_block(build_prompt(project))

    st.markdown("#### 分镜表（八列）")
    shots = s4.setdefault("shots", [])
    if not shots:
        shots.append({})

    if st.button("⚡ 从创意脚本段落快速建镜位"):
        segs = project["stage3"].get("segments", [])
        shots.clear()
        for s in segs:
            shots.append({"desc": s.get("visual", ""), "dialogue": s.get("voiceover", ""),
                          "sound": s.get("sound", ""), "note": f"参考：{s.get('reference','')}"})
        if not shots:
            shots.append({})
        st.rerun()

    # 表头
    head = st.columns([0.5, 1.1, 1.1, 3.2, 2.2, 0.8, 1.6, 1.8])
    for j, h in enumerate(["镜号", "景别", "运镜", "画面描述", "旁白/台词", "时长(s)", "音效/音乐", "备注/转场"]):
        head[j].markdown(f"**{h}**")

    for i in range(len(shots)):
        sh = shots[i]
        cols = st.columns([0.5, 1.1, 1.1, 3.2, 2.2, 0.8, 1.6, 1.8])
        cols[0].markdown(f"**{i+1}**")
        sh["shot_size"] = cols[1].selectbox("", SHOT_SIZES,
                                            index=_safe_index(SHOT_SIZES, sh.get("shot_size")),
                                            key=f"sh{i}_sz", label_visibility="collapsed")
        sh["movement"] = cols[2].selectbox("", CAMERA_MOVES,
                                           index=_safe_index(CAMERA_MOVES, sh.get("movement")),
                                           key=f"sh{i}_mv", label_visibility="collapsed")
        sh["desc"] = cols[3].text_area("", value=sh.get("desc", ""), height=70,
                                       key=f"sh{i}_d", label_visibility="collapsed")
        sh["dialogue"] = cols[4].text_area("", value=sh.get("dialogue", ""), height=70,
                                           key=f"sh{i}_dl", label_visibility="collapsed")
        sh["duration"] = cols[5].number_input("", min_value=0.0, step=0.5,
                                              value=float(sh.get("duration", 0.0) or 0.0),
                                              key=f"sh{i}_du", label_visibility="collapsed")
        sh["sound"] = cols[6].text_area("", value=sh.get("sound", ""), height=70,
                                        key=f"sh{i}_so", label_visibility="collapsed")
        sh["note"] = cols[7].text_area("", value=sh.get("note", ""), height=70,
                                       key=f"sh{i}_nt", label_visibility="collapsed")
        if cols[7].button("🗑", key=f"shdel{i}"):
            shots.pop(i)
            st.rerun()

    col_a, col_b = st.columns([1, 3])
    with col_a:
        if st.button("➕ 添加镜头"):
            shots.append({})
            st.rerun()
    with col_b:
        total = sum(float(sh.get("duration", 0) or 0) for sh in shots)
        st.info(f"镜头数：{len(shots)} ｜ 时长合计：{total:.1f}s ｜ 目标：{project['meta'].get('duration','')}")

    s4["rhythm_note"] = st.text_area("剪辑节奏说明", value=s4.get("rhythm_note", ""), height=80)
    saved_badge()


def _safe_index(options, val):
    try:
        return options.index(val)
    except (ValueError, TypeError):
        return 0
