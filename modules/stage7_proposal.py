# -*- coding: utf-8 -*-
"""环节 7：创意提报资料整理（影调/风格/美术/置景/演员/服化道）"""

import streamlit as st
from core.ui import show_pro_points, prompt_block, saved_badge, section

PRO_POINTS = [
    "七大提报模块：影调参考、风格参考、美术方向、置景方案、演员参考、服装造型、道具清单。",
    "影调参考：色调色板、光影风格参考图（5-8张），确定画面色彩情绪。",
    "风格参考：参考片截图/海报（3-5部），标注参考维度。",
    "美术方向：场景概念图、道具风格、色彩体系。",
    "置景方案：主场景平面图/参考图/改造说明，评估拍摄可行性与预算。",
    "演员参考：角色设定 + 演员参考形象（每角色2-3个），统一选角审美。",
    "服装造型：各角色服装参考图 + 妆发说明。道具清单：核心道具 + 参考图 + 预算等级。",
]

MOOD_TEMPLATE = """请为以下影片项目设计一套视觉参考体系（Moodboard文字描述，用于找图/生成参考图）：
【影片类型】{vtype}
【创意方向】{direction}
【情绪基调】{mood}

请输出：
1. 主色板：3-5种主色调，附色值（HEX）和占比，说明每种颜色承载的情绪
2. 光影风格：是硬光还是柔光？自然光还是戏剧光？高光和阴影的对比强度？
3. 影调关键词：5-8个专业形容词
4. 参考片推荐：3部电影/广告片，每部说明参考什么（调色/构图/光影/整体氛围）
5. 摄影质感：镜头焦段偏好（广角/中焦/长焦）、景深控制、机位高度
6. 画面颗粒感：是否加胶片颗粒/数字噪点，程度如何

输出格式：每项配1句解释，整体要能让美术和调色师一眼看懂方向。"""

CHAR_TEMPLATE = """基于以下创意脚本，输出完整的人物与美术设定清单：
【创意脚本摘要】
{summary}
【影片年代/背景】{era}

输出结构：
一、角色设定（每个角色）
■ 角色名 + 年龄 + 职业 + 性格关键词
■ 外形特征：身高体型、面部特征、气质
■ 演员参考：2-3位公众人物作为形象参考
■ 服装风格：日常穿搭风格、主色系、关键单品
■ 妆发要求：发型、妆容浓淡、标志性细节
二、核心场景设定（每个主要场景）
■ 场景名 + 功能定位 + 空间描述 + 色调与光线 + 置景参考 + 预算等级
三、关键道具
■ 道具名 + 出现场景 + 功能/象征意义 + 外观描述 + 筹备方式

要求：所有设定要符合人物逻辑和剧情需要，避免为了好看而堆砌。"""


def _chosen_direction(project: dict) -> str:
    dirs = project["stage2"].get("directions", [])
    idx = min(project["stage2"].get("chosen", 0), max(len(dirs) - 1, 0))
    if idx < len(dirs):
        d = dirs[idx]
        return f"「{d.get('name','')}」{d.get('logline','')}"
    return "（待选定方向）"


def _script_summary(project: dict) -> str:
    segs = project["stage3"].get("segments", [])
    if not segs:
        return "（待填写创意脚本）"
    return "\n".join(f"- {s.get('visual','')}（{s.get('time','')}）" for s in segs)


def build_mood_prompt(project: dict) -> str:
    s7 = project["stage7"]
    return MOOD_TEMPLATE.format(vtype=project["meta"]["video_type"],
                                direction=_chosen_direction(project),
                                mood=s7.get("mood", "（温暖治愈/冷峻科技/复古怀旧/紧张悬疑）"))


def build_char_prompt(project: dict) -> str:
    s7 = project["stage7"]
    return CHAR_TEMPLATE.format(summary=_script_summary(project),
                                era=s7.get("era", "（现代都市/民国/未来科幻）"))


def render(project: dict):
    section("🎨 环节 7 · 提报资料", "影调/风格/美术/置景/演员/服化道——七大专案模块。")
    show_pro_points(PRO_POINTS)

    s7 = project["stage7"]
    s7.setdefault("mood", "")
    s7.setdefault("era", "")
    s7.setdefault("moodboard", {})
    s7.setdefault("style_refs", [])
    s7.setdefault("art_set", [])
    s7.setdefault("actors", [])
    s7.setdefault("props", [])

    s7["mood"] = st.text_input("情绪基调（如 温暖治愈 / 冷峻科技）", value=s7.get("mood", ""))
    s7["era"] = st.text_input("影片年代 / 背景", value=s7.get("era", ""), placeholder="现代都市 / 民国 / 未来科幻")

    tab1, tab2, tab3, tab4 = st.tabs(["影调 Moodboard", "风格参考", "角色与服化道", "美术置景与道具"])

    with tab1:
        prompt_block(build_mood_prompt(project))
        mb = s7["moodboard"]
        mb["color_palette"] = st.text_area("主色板（HEX+占比+情绪）", value=mb.get("color_palette", ""), height=70)
        mb["light_style"] = st.text_area("光影风格", value=mb.get("light_style", ""), height=50)
        mb["tone_keywords"] = st.text_area("影调关键词（5-8个）", value=mb.get("tone_keywords", ""), height=50)
        mb["ref_films"] = st.text_area("参考片推荐（3部+参考维度）", value=mb.get("ref_films", ""), height=70)
        mb["photo_texture"] = st.text_area("画面颗粒感", value=mb.get("photo_texture", ""), height=40)

    with tab2:
        st.markdown("风格参考片（3-5部，标注参考维度）")
        refs = s7["style_refs"]
        if not refs:
            refs.append("")
        for i in range(len(refs)):
            refs[i] = st.text_input(f"参考片 {i+1}", value=refs[i], key=f"ref{i}",
                                    placeholder="片名 + 链接 + 参考维度（如构图/色调/节奏）")
        if st.button("➕ 添加参考片"):
            refs.append("")
            st.rerun()

    with tab3:
        prompt_block(build_char_prompt(project), label="🧑 角色与服化道设定提示词")
        actors = s7["actors"]
        if not actors:
            actors.append({})
        for i in range(len(actors)):
            a = actors[i]
            with st.expander(f"角色 {i+1}" + (f" · {a.get('name','')}" if a.get('name') else ""), expanded=(i == 0)):
                a["name"] = st.text_input("角色名/年龄/职业/性格", value=a.get("name", ""), key=f"a{i}_n")
                a["look"] = st.text_area("外形特征", value=a.get("look", ""), height=45, key=f"a{i}_l")
                a["actor_ref"] = st.text_area("演员参考（2-3位公众人物）", value=a.get("actor_ref", ""), height=45, key=f"a{i}_ar")
                a["wardrobe"] = st.text_area("服装风格（主色系+关键单品）", value=a.get("wardrobe", ""), height=45, key=f"a{i}_w")
                a["makeup"] = st.text_area("妆发要求", value=a.get("makeup", ""), height=45, key=f"a{i}_m")
            if st.button("🗑 删除角色", key=f"adel{i}"):
                actors.pop(i)
                st.rerun()
        if st.button("➕ 添加角色"):
            actors.append({})
            st.rerun()

    with tab4:
        st.markdown("##### 美术置景")
        art = s7["art_set"]
        if not art:
            art.append({})
        for i in range(len(art)):
            sc = art[i]
            with st.expander(f"场景 {i+1}" + (f" · {sc.get('name','')}" if sc.get('name') else ""), expanded=(i == 0)):
                sc["name"] = st.text_input("场景名+功能定位", value=sc.get("name", ""), key=f"sc{i}_n")
                sc["space"] = st.text_area("空间描述（面积/结构/陈设）", value=sc.get("space", ""), height=45, key=f"sc{i}_sp")
                sc["tone"] = st.text_area("色调与光线", value=sc.get("tone", ""), height=45, key=f"sc{i}_t")
                sc["budget"] = st.text_input("预算等级（低/中/高）", value=sc.get("budget", ""), key=f"sc{i}_b")
            if st.button("🗑 删除场景", key=f"scdel{i}"):
                art.pop(i)
                st.rerun()
        if st.button("➕ 添加场景"):
            art.append({})
            st.rerun()

        st.markdown("##### 道具清单")
        props = s7["props"]
        if not props:
            props.append({})
        for i in range(len(props)):
            p = props[i]
            with st.expander(f"道具 {i+1}" + (f" · {p.get('name','')}" if p.get('name') else ""), expanded=(i == 0)):
                p["name"] = st.text_input("道具名+出现场景", value=p.get("name", ""), key=f"p{i}_n")
                p["meaning"] = st.text_area("功能/象征意义", value=p.get("meaning", ""), height=40, key=f"p{i}_m")
                p["prep"] = st.text_input("筹备方式（采购/定制/借拍）", value=p.get("prep", ""), key=f"p{i}_pr")
            if st.button("🗑 删除道具", key=f"pdel{i}"):
                props.pop(i)
                st.rerun()
        if st.button("➕ 添加道具"):
            props.append({})
            st.rerun()
    saved_badge()
