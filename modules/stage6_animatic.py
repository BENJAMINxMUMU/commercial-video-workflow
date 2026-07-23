# -*- coding: utf-8 -*-
"""环节 6：动态分镜视频制作（Animatic / 节奏校验）"""

import streamlit as st
from core.ui import show_pro_points, prompt_block, saved_badge, section

PRO_POINTS = [
    "动态分镜 = 把分镜图按时间线串起来 + 临时配音 + 临时音乐 + 简单运镜。",
    "核心价值：验证节奏——静态分镜看不出快慢，动态分镜能直接感受“会不会拖沓”。",
    "制作工具：Premiere / Final Cut / 剪映均可，甚至 PPT 都能做。",
    "关键操作：每个镜头精确时长、推拉摇移用 Ken Burns 模拟、配 scratch 旁白、加情绪音乐。",
    "验收标准：看完能复述故事主线，且没有明显节奏拖沓或跳跃感。",
]

TEMPLATE = """你是剪辑指导，请为以下分镜脚本输出动态分镜（Animatic）制作规范：
【分镜脚本】
{shot_table}
【全片时长】{duration}
【参考节奏片】{ref}

请输出：
1. 剪辑时序表：按镜头编号列出精确时长（精确到帧），标注每个镜头的出入点
2. 镜头运动模拟方案：哪些镜头需要做Ken Burns效果（推/拉/摇），参数建议（起始帧/结束帧构图）
3. 转场方案：每个转场的类型和时长（硬切/叠化XX帧/闪白/匹配剪辑）
4. 声音设计草稿：
   - 音乐分段：哪几秒用什么情绪的音乐（用音乐风格描述，不用具体曲名）
   - 关键音效点：标注秒数和音效类型
   - 旁白位置：对应台词的时间码
5. 节奏校验点：全片有哪几个关键节拍点（如第X秒必须出现产品、第X秒必须情绪转折）
6. 初剪完成后的自检清单（5条）

要求：所有时间码精确到0.1秒，总时长误差控制在±0.5秒内。"""


def _shot_table_text(project: dict) -> str:
    shots = project["stage4"].get("shots", [])
    if not shots:
        return "（待填写文字分镜）"
    lines = ["| 镜号 | 景别 | 运镜 | 画面描述 | 时长 |"]
    for i, s in enumerate(shots, 1):
        lines.append(f"| {i} | {s.get('shot_size','')} | {s.get('movement','')} | "
                     f"{s.get('desc','')[:40]} | {s.get('duration',0)} |")
    return "\n".join(lines)


def build_prompt(project: dict) -> str:
    ref = project["stage7"].get("style_refs", [])
    ref_txt = "；".join(ref) if ref else "（参考片链接，说明参考其节奏）"
    return TEMPLATE.format(shot_table=_shot_table_text(project),
                           duration=project["meta"].get("duration", ""),
                           ref=ref_txt)


def render(project: dict):
    section("🎞️ 环节 6 · 动态分镜", "Animatic = 成本最低的节奏校验工具，正式拍摄前必过。")
    show_pro_points(PRO_POINTS)

    s6 = project["stage6"]
    prompt_block(build_prompt(project))

    st.markdown("#### 动态分镜制作规范（AI 输出后整理填入）")
    s6["timeline"] = st.text_area("① 剪辑时序表（镜号+精确时长+出入点）", value=s6.get("timeline", ""), height=90)
    s6["kb_effects"] = st.text_area("② 镜头运动模拟方案（Ken Burns）", value=s6.get("kb_effects", ""), height=70)
    s6["transitions"] = st.text_area("③ 转场方案", value=s6.get("transitions", ""), height=70)
    s6["sound_design"] = st.text_area("④ 声音设计草稿（音乐/音效/旁白时间码）", value=s6.get("sound_design", ""), height=90)
    s6["beat_points"] = st.text_area("⑤ 节奏校验点（关键节拍）", value=s6.get("beat_points", ""), height=60)
    s6["checklist"] = st.text_area("⑥ 初剪自检清单（5条）", value=s6.get("checklist", ""), height=90)
    saved_badge()
