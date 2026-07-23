# -*- coding: utf-8 -*-
"""环节 5：绘制分镜图（故事板 Storyboard）+ 一致性控制"""

import os
import streamlit as st
from core.ui import show_pro_points, prompt_block, saved_badge, section

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

PRO_POINTS = [
    "分镜图 = 画面化的分镜脚本，每格对应一个镜头。",
    "不需要画得精美，但构图、机位、人物位置关系必须准确——“清晰 > 好看”。",
    "标准元素：画面框 + 镜头编号 + 镜头运动方向箭头 + 底部简短说明。",
    "可用 AI 生成辅助，但要注意一致性（人物长相、场景风格要统一）。",
    "关键镜头（开场、高潮、结尾）建议出精修版，过渡镜头可用草图。",
]

LOCK_TEMPLATE = """以下是同一部影片的分镜图生成规则，请严格遵守以保证风格统一：
【人物设定】{char}
【主场景设定】{scene}
【整体视觉风格】{style}
【画幅比例】{aspect}

每次生成分镜图时，以上设定保持不变，只改变：
- 镜头的景别、机位、人物动作
- 具体场景的细节变化

所有分镜图必须保持：同一人物长相、同一色彩体系、同一光影逻辑、同一画质质感。"""

SHOT_TEMPLATE = """生成一张专业电影分镜图（故事板风格），对应以下镜头：
【镜头内容】{desc}
【景别】{size}
【运镜】{move}
【整体影调】{tone}
【美术风格】{style}
【画幅比例】{aspect}

画面要求：
1. 标准故事板线稿+淡彩风格，黑白或单色均可
2. 构图精准，体现景别和机位角度
3. 标注画面中的人物位置、视线方向、关键道具
4. 用箭头标注镜头运动方向
5. 底部留白用于填写镜号和文字说明
6. 风格统一：所有分镜图使用同一套人物造型和场景基调

负面提示：不要过于精细的插画、不要3D渲染感、不要彩色海报质感、人物不要正脸特写。"""


def _safe_name(project):
    return (project["meta"].get("project_name") or "project").strip().replace(" ", "_") or "project"


def build_lock_prompt(project: dict) -> str:
    lock = project["stage5"].get("style_lock", {})
    return LOCK_TEMPLATE.format(char=lock.get("char", "（主角外貌、服装、年龄特征）"),
                                scene=lock.get("scene", "（主要场景的环境、年代、色调）"),
                                style=lock.get("style", "（电影感、自然光、暖黄+青蓝对比色）"),
                                aspect=project["meta"].get("aspect_ratio", ""))


def build_shot_prompt(project: dict, shot: dict) -> str:
    lock = project["stage5"].get("style_lock", {})
    return SHOT_TEMPLATE.format(desc=shot.get("desc", ""),
                                size=shot.get("shot_size", ""),
                                move=shot.get("movement", ""),
                                tone=lock.get("tone", "（冷色调、低对比度）"),
                                style=lock.get("style", "（电影感/写实主义）"),
                                aspect=project["meta"].get("aspect_ratio", ""))


def _save_image(uploaded, project, idx):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    name = f"{_safe_name(project)}_storyboard_{idx}{os.path.splitext(uploaded.name)[1]}"
    path = os.path.join(UPLOAD_DIR, name)
    with open(path, "wb") as f:
        f.write(uploaded.getbuffer())
    return path


def render(project: dict):
    section("🖼️ 环节 5 · 分镜图", "故事板绘制 + 一致性控制。每镜生成提示词并上传成图。")
    show_pro_points(PRO_POINTS)

    s5 = project["stage5"]
    lock = s5.setdefault("style_lock", {})
    st.markdown("#### 一致性锁定（批量生成前先定）")
    lock["char"] = st.text_area("人物设定（主角外貌/服装/年龄）", value=lock.get("char", ""), height=55)
    lock["scene"] = st.text_area("主场景设定（环境/年代/色调）", value=lock.get("scene", ""), height=55)
    lock["style"] = st.text_input("整体视觉风格", value=lock.get("style", ""), placeholder="电影感、自然光、暖黄+青蓝对比色")
    lock["tone"] = st.text_input("整体影调", value=lock.get("tone", ""), placeholder="冷色调、低对比度、阴雨氛围")
    prompt_block(build_lock_prompt(project), label="🔒 一致性控制提示词（复制给生图工具）")

    # 基于 stage4 镜头生成 boards
    shots = project["stage4"].get("shots", [])
    boards = s5.setdefault("boards", [])
    if len(boards) != len(shots):
        boards.clear()
        for sh in shots:
            boards.append({"image_path": ""})

    st.markdown("#### 逐镜分镜图提示词 + 上传成图")
    if not shots:
        st.warning("请先在环节4完成文字分镜，分镜图将自动对应每个镜头。")
        return
    for i, (sh, bd) in enumerate(zip(shots, boards)):
        with st.expander(f"镜 {i+1} · {sh.get('shot_size','')} · {sh.get('movement','')}", expanded=False):
            st.caption(sh.get("desc", ""))
            st.code(build_shot_prompt(project, sh), language="text")
            up = st.file_uploader(f"上传分镜图（镜{i+1}）", type=["png", "jpg", "jpeg"],
                                  key=f"bd{i}")
            if up:
                bd["image_path"] = _save_image(up, project, i)
            if bd.get("image_path") and os.path.exists(bd["image_path"]):
                st.image(bd["image_path"], width=320)
                bd["image_path"] = bd["image_path"]
    saved_badge()
