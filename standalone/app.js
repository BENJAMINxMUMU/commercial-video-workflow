/* 商业视频全案策划引擎 · 独立网页工作台（无需服务器/无需联网）
 * 纯前端实现：状态存 localStorage，PPT 用内嵌 pptxgenjs 本地生成。 */
(function () {
  "use strict";

  // ===================== 配置数据 =====================
  const VIDEO_TYPES = {
    "广告片": { desc: "15s/30s/60s，信息密度高，每个镜头都有信息增量。",
      extra: [["黄金3秒钩子设计", "单独要求开场设计，前3秒必须抓住注意力。"],
              ["产品露出策略", "明确产品在第几秒出现、以什么方式出现。"]] },
    "企业宣传片": { desc: "2-5 分钟，张弛有度，有大气段落也有细节段落。",
      extra: [["企业核心信息层级", "按优先级排列必传信息。"],
              ["叙事视角", "第三人称旁白 / 第一人称自述 / 人物视角。"]] },
    "微电影": { desc: "3-10 分钟，起承转合完整故事，品牌作为背景或转折点。",
      extra: [["人物小传", "主角背景、欲望、障碍、转变弧光。"],
              ["三幕结构", "建置-对抗-结局，明确转折点位置。"]] },
    "产品宣传片": { desc: "60s-3 分钟，卖点段落清晰，每个功能一个“小高潮”。",
      extra: [["核心卖点排序", "按用户决策权重排列。"],
              ["功能可视化方式", "每个功能用什么画面呈现。"]] },
    "短视频": { desc: "15-60 秒，竖屏 9:16，字幕化，静音也能看懂。",
      extra: [["前三秒钩子类型", "提问式 / 反差式 / 结果前置式 / 痛点直击式。"],
              ["字幕设计", "关键信息字幕化，用户静音也能看懂。"],
              ["行动指令CTA", "结尾明确引导什么动作。"]] },
    "口播": { desc: "1-3 分钟，真人 / 虚拟人口播直述，强人设、强节奏、强转化。",
      extra: [["人设与口播风格", "主播人设、语气、与观众的关系定位。"],
              ["信息密度与节奏", "每 15 秒一个信息点，避免冷场与啰嗦。"]] },
    "AI漫剧": { desc: "1-2 分钟 / 集，竖屏连载，AI 生成为主，强悬念、强反转、强追更。",
      extra: [["爆款选题与爽点结构", "逆袭 / 反转 / 打脸等爽点节奏设计。"],
              ["AI 生成一致性", "角色 / 场景 / 画风跨集一致性方案。"],
              ["分集钩子与追更", "每集结尾悬念与付费 / 追更引导。"]] },
  };
  const ASPECTS = ["16:9 横屏", "9:16 竖屏", "1:1 方形", "2.35:1 宽银幕"];
  const SHOT_SIZES = ["WS 远景", "FS 全景", "MS 中景", "MCU 近景", "CU 特写", "ECU 大特写"];
  const CAMERA_MOVES = ["固定", "推 Push in", "拉 Pull out", "横摇 Pan", "竖摇 Tilt", "平移 Track", "跟拍 Follow", "升降 Crane", "环绕 Orbit", "手持 Handheld"];

  // ===================== 影片类型 → 策划方式（4 类）=====================
  // 需求提炼方法与创意策划侧重点按「方式」区分，而非按单一类型。
  const TYPE_MODES = {
    story: {
      name: "情感/故事驱动型",
      types: ["广告片", "微电影"],
      req: "需求提炼聚焦：① 品牌想让人记住的「一个记忆点」；② 目标受众的情感触发点（共鸣/向往/幽默/震撼）；③ 品牌/产品以何种方式（主角/背景/转折点）自然融入故事，而非硬广；④ 期望的情绪曲线与看完后的行动。",
      brdHint: "广告片重「单一强记忆点 + 情绪冲击」；微电影重「人物弧光 + 品牌作为故事背景」。",
      creative: "创意策划侧重点：用「一句话创意锚定情绪」，3 套方向分别测试不同情绪钩子与叙事结构；强调「品牌即故事」而非「故事里插品牌」；参考片优先看情绪表达与叙事手法。",
      brdEmphasis: { core_goal: "→ 记忆点", audience: "→ 情感触发点", must_info: "→ 自然植入方式", hidden: "→ 情绪曲线" },
    },
    value: {
      name: "价值/卖点驱动型",
      types: ["企业宣传片", "产品宣传片"],
      req: "需求提炼聚焦：① 企业/产品最想传递的「核心价值主张」；② 目标受众的决策顾虑与信任来源；③ 必传信息按「决策权重」排序（不是罗列）；④ 需要提供信任凭证（数据/案例/资质/背书）。",
      brdHint: "企业宣传片重「组织价值 + 信任感」；产品宣传片重「卖点层级 + 功能可视化」。",
      creative: "创意策划侧重点：3 套方向围绕「不同价值切入角度」（技术领先 / 用户口碑 / 社会价值）；强调「结构化卖点 + 可视化呈现」；参考片优先看信息层级与信服力表达。",
      brdEmphasis: { core_goal: "→ 价值主张", audience: "→ 决策顾虑", must_info: "→ 按决策权重排序", hidden: "→ 信任凭证" },
    },
    flow: {
      name: "流量/转化驱动型",
      types: ["短视频", "口播"],
      req: "需求提炼聚焦：① 前三秒必须抓人的「钩子类型」（提问/反差/结果前置/痛点）；② 目标受众的滑走原因与完播动机；③ 明确的转化目标（点赞/关注/购买/留资）与 CTA；④ 平台特性（竖屏 / 静音可懂 / 字幕）。",
      brdHint: "短视频重「钩子 + 完播 + 转化」；口播重「人设信任 + 强节奏 + 强转化」。",
      creative: "创意策划侧重点：3 套方向分别测试不同「钩子类型 + 结构节奏」；强调「开头即高潮」与「每 15 秒一个信息点」；参考片优先看爆款开头与节奏设计。",
      brdEmphasis: { core_goal: "→ 钩子类型", audience: "→ 滑走原因/完播动机", must_info: "→ CTA", hidden: "→ 平台特性" },
    },
    series: {
      name: "爽感/连载驱动型",
      types: ["AI漫剧"],
      req: "需求提炼聚焦：① 目标受众的「爽点偏好」（逆袭/打脸/甜宠/悬疑）；② 付费/追更的转化节点设计；③ 人设与世界观的一致性要求（跨集 AI 生成）；④ 单集时长与悬念钩子结构。",
      brdHint: "AI漫剧重「爽点结构 + 付费转化 + 跨集一致性」。",
      creative: "创意策划侧重点：3 套方向围绕不同「爽点 + 反转结构」；强调「每集结尾强悬念」与「人设/画风跨集一致」（给定参考图与风格锁）；参考片优先看爆款爽剧结构与反转节奏。",
      brdEmphasis: { core_goal: "→ 爽点偏好", audience: "→ 付费动机", must_info: "→ 悬念钩子", hidden: "→ 跨集一致性" },
    },
  };
  function typeMode() {
    const t = state.meta.video_type;
    return Object.values(TYPE_MODES).find(m => m.types.includes(t)) || TYPE_MODES.story;
  }
  function brdLabel(k) { const m = { positioning: "项目定位", core_goal: "核心目标", audience: "目标受众", must_info: "必传信息", style: "风格倾向", constraints: "约束条件", hidden: "隐性需求" }; return m[k] || k; }
  function modeCard1(m) {
    const chips = Object.entries(m.brdEmphasis).map(([k, v]) => `<span style="display:inline-block;margin:3px 6px 3px 0;padding:2px 9px;background:#fff;border:1px solid #d6e4ff;border-radius:12px;font-size:12px">${brdLabel(k)} <b>${esc(v)}</b></span>`).join("");
    return `<div class="card" style="border-color:#d6e4ff;background:#f5f8ff;margin:4px 0 14px">
      <b>🎯 本类型需求提炼方法 · ${esc(m.name)}</b>
      <p class="cap" style="margin:6px 0">${esc(m.req)}</p>
      <p class="cap" style="margin:0;color:#5f6368">${esc(m.brdHint)}</p>
      <div style="margin-top:8px;font-size:12px;color:#344054"><b>BRD 填写侧重：</b><br>${chips}</div>
    </div>`;
  }
  function modeCard2(m) {
    return `<div class="card" style="border-color:#ead6ff;background:#faf5ff;margin:4px 0 14px">
      <b>🎯 本类型创意策划侧重点 · ${esc(m.name)}</b>
      <p class="cap" style="margin:6px 0 0">${esc(m.creative)}</p>
    </div>`;
  }

  // ===================== AI 工具目录 =====================
  // 每个工具含 name/icon/url/tag/stages（stages 为空 = 全环节通用）
  const AI_TOOLS = [
    { id:"midjourney", name:"Midjourney", icon:"🎨", url:"https://www.midjourney.com", tag:"文生图/图生图", stages:["stage2","stage5","stage7"] },
    { id:"dalle",      name:"DALL·E 3", icon:"🖼️", url:"https://chat.openai.com", tag:"文生图", stages:["stage2","stage5","stage7"] },
    { id:"sd",         name:"Stable Diffusion", icon:"⚙️", url:"https://clipdrop.co/stable-diffusion", tag:"文生图/图生图", stages:["stage2","stage5","stage7"] },
    { id:"comfyui",    name:"ComfyUI", icon:"🔧", url:"https://github.com/comfyanonymous/ComfyUI", tag:"工作流生图", stages:["stage5","stage7"] },
    { id:"runway",     name:"Runway Gen-3", icon:"🎬", url:"https://runwayml.com", tag:"图生视频", stages:["stage6"] },
    { id:"pika",       name:"Pika", icon:"✨", url:"https://pika.art", tag:"图生视频", stages:["stage6"] },
    { id:"kling",      name:"可灵 Kling", icon:"🔥", url:"https://kling.kuaishou.com", tag:"图生视频/文生视频", stages:["stage6"] },
    { id:"sora",       name:"Sora", icon:"🌟", url:"https://openai.com/sora", tag:"文生视频", stages:["stage6"] },
    { id:"luma",       name:"Luma Dream Machine", icon:"💫", url:"https://lumalabs.ai/dream-machine", tag:"图生视频", stages:["stage6"] },
    { id:"hailuo",     name:"海螺 AI", icon:"🌊", url:"https://hailuoai.video", tag:"图生视频/文生视频", stages:["stage6"] },
    { id:"jimeng",     name:"即梦 Jimeng", icon:"🎯", url:"https://jimeng.jianying.com", tag:"文生图/图生视频", stages:["stage5","stage6","stage7"] },
    { id:"liblib",     name:"LiblibAI", icon:"📦", url:"https://www.liblib.art", tag:"模型社区/在线生图", stages:["stage5","stage7"] },
  ];

  // 渲染某个环节的 AI 工具面板
  function renderAITools(stageId) {
    const tools = AI_TOOLS.filter(t => !t.stages.length || t.stages.includes(stageId));
    if (!tools.length) return "";
    const sel = state._ai_tools || {};
    const btns = tools.map(t => {
      const active = sel[t.id] ? " sel" : "";
      return `<button class="ai-tool-btn${active}" onclick="App.toggleAITool('${t.id}')" title="${t.tag}">${t.icon} ${t.name}<span class="ai-tool-tag">${t.tag}</span></button>`;
    }).join("");
    const tips = tools.filter(t => sel[t.id]).map(t => `「${t.name}」`).join("、");
    let tipHtml = tips ? `<div class="ai-tip">✅ 已选工具：${tips} — 点击按钮切换选中状态。各工具需自行打开对应网站使用，本面板仅做快速标记与唤起。</div>` : `<div class="ai-tip">💡 点击工具按钮标记你要用的 AI 工具，方便后续快速唤起。</div>`;
    return `<div class="ai-tools"><div class="ai-tools-h">🤖 AI 工具 — ${stageLabel(stageId)}</div><div class="ai-tools-body">${btns}</div>${tipHtml}</div>`;
  }
  function stageLabel(id) {
    const m = { stage2:"创意策划·参考图/概念图生成", stage5:"分镜图·逐镜文生图/图生图", stage6:"动态分镜·图生视频/Animatic", stage7:"提报资料·Moodboard/角色概念图" };
    return m[id] || "";
  }
  function toggleAITool(tid) {
    if (!state._ai_tools) state._ai_tools = {};
    state._ai_tools[tid] = !state._ai_tools[tid];
    save(); rerender();
  }

  const STAGES = [
    { id: "project", icon: "⚙️", title: "项目设置", sub: "全局上下文" },
    { id: "stage1", icon: "📋", title: "需求提炼", sub: "结构化 BRD" },
    { id: "stage2", icon: "💡", title: "创意策划", sub: "3 套方向" },
    { id: "stage3", icon: "📝", title: "创意脚本", sub: "文学脚本+参考" },
    { id: "stage4", icon: "🎬", title: "文字分镜", sub: "八列分镜表" },
    { id: "stage5", icon: "🖼️", title: "分镜图", sub: "故事板+一致性" },
    { id: "stage6", icon: "🎞️", title: "动态分镜", sub: "Animatic 规范" },
    { id: "stage7", icon: "🎨", title: "提报资料", sub: "影调/美术/服化道" },
    { id: "stage8", icon: "📊", title: "PPT 整合", sub: "导出 15 页方案" },
  ];

  const IRON_RULES = [
    "一句话创意锚定法：每个方案先提炼一句话核心创意点（Logline），所有环节围绕它展开。",
    "受众-渠道双约束：创意启动前必须明确目标受众画像 + 投放渠道，决定节奏、画幅、信息密度。",
    "参考先行原则：脚本/分镜/美术全部先找参考再原创，凭空创作偏差率是有参考的 3 倍以上。",
    "节奏前置验证：动态分镜（Animatic）是成本最低的节奏校验工具，正式拍摄前必须过这一关。",
    "提报 PPT = 销售工具：不是作品展示，是说服客户买单的逻辑链——从“为什么”到“做成什么样”再到“我们能做好”。",
  ];
  const SELFCHECK = [
    "一句话创意是否清晰有力？看完方案能不能复述出来？",
    "所有创意决策是否都能回溯到“对受众/目标有用”？",
    "分镜时长加总是否等于总时长？有没有漏算转场？",
    "视觉参考是否统一？有没有东拼西凑的感觉？",
    "PPT 逻辑链是否通顺？从“为什么”到“怎么做”能不能一气呵成？",
    "预算和排期是否合理？有没有明显实现不了的创意？",
  ];

  // ===================== 状态 =====================
  const LS_KEY = "cv_workflow_state_v1";
  const LS_PROJECTS = "cv_workflow_projects_v1";   // 本机多项目库
  const LS_AUTOSAVE = "cv_workflow_autosave_v1";    // 自动存档快照
  const APP_VERSION = "2.05";
  function defaultState() {
    return {
      meta: { project_name: "", client: "", video_type: "广告片", duration: "30秒",
        aspect_ratio: "16:9 横屏", channel: "", audience: "", accent_color: "#C8102E" },
      stage1: { raw_need: "", brd: {}, attachments: [] },
      stage2: { directions: [], chosen: 0, extra: {} },
      stage3: { segments: [], rhythm_bpm: "", music_style: "", extra: {} },
      stage4: { shots: [], rhythm_note: "", extra: {} },
      stage5: { style_lock: {}, boards: [] },
      stage6: { timeline: "", kb_effects: "", transitions: "", sound_design: "", beat_points: "", checklist: "" },
      stage7: { mood: "", era: "", moodboard: {}, style_refs: [], art_set: [], actors: [], props: [] },
      stage8: { ppt_title: "", ppt_subtitle: "", contact: "", schedule_text: "", team_text: "", _checked_pages: {} },
    };
  }
  let state = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(LS_KEY)); if (s && s.meta) { const m = Object.assign(defaultState(), s); m._cases = []; return m; } } catch (e) {}
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); localStorage.setItem(LS_AUTOSAVE, JSON.stringify({ ts: Date.now(), data: state })); }
    catch (e) {
      // 配额溢出（多为附件过大）：剔除大附件后重试，确保其余内容仍可持久化
      try {
        const slim = JSON.parse(JSON.stringify(state));
        if (slim.stage1 && slim.stage1.attachments) slim.stage1.attachments = [];
        localStorage.setItem(LS_KEY, JSON.stringify(slim));
        localStorage.setItem(LS_AUTOSAVE, JSON.stringify({ ts: Date.now(), data: slim }));
        setMsg("⚠️ 本地存储已满：已保存除附件外的内容，建议删除部分大文件 / 导出 JSON 备份");
      } catch (e2) {}
    }
  }

  // 路径读写
  function get(path, def) { let c = state; for (const k of path.split(".")) { if (c == null) return def; c = c[k]; } return c === undefined ? def : c; }
  function set(path, val) { const ks = path.split("."); let c = state; for (let i = 0; i < ks.length - 1; i++) { if (typeof c[ks[i]] !== "object" || c[ks[i]] == null) c[ks[i]] = {}; c = c[ks[i]]; } c[ks[ks.length - 1]] = val; }
  function onInput(path, el) { set(path, el.value); save(); }
  function onCheck(path, el) { set(path, el.checked); save(); }

  let current = "project";

  // ===================== 工具 =====================
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
  function shortUrl(u) { try { const p = new URL(u); let s = p.hostname.replace(/^www\./, "") + p.pathname; if (s.length > 48) s = s.slice(0, 48) + "…"; return s; } catch (e) { return u; } }
  function hex(c) { c = (c || "#C8102E"); return c.startsWith("#") ? c.slice(1) : c; }
  function chosenDir() {
    const d = state.stage2.directions; const i = Math.min(state.stage2.chosen || 0, Math.max(d.length - 1, 0));
    return (d[i] || {});
  }

  // ===================== 提示词构建（镜像 Python 逻辑）=====================
  function brdText() {
    const b = state.stage1.brd || {};
    return ["项目定位：" + (b.positioning || ""), "核心目标：" + (b.core_goal || ""), "目标受众：" + (b.audience || ""),
      "必传信息：" + (b.must_info || ""), "风格倾向：" + (b.style || ""), "约束条件：" + (b.constraints || ""),
      "隐性需求：" + (b.hidden || "")].join("\n");
  }
  function extraBlock() {
    const ex = VIDEO_TYPES[state.meta.video_type].extra || [];
    if (!ex.length) return "";
    return "【本类型差异化参数，请在方向中回应】\n" + ex.map(e => "- " + e[0] + "：" + e[1]).join("\n");
  }
  function promptStage1() {
    return `你是资深影视策划，根据以下客户原始需求，输出一份结构化的《项目需求简报》：
【客户原始需求】${state.stage1.raw_need || "（请先在上方填写客户原始需求）"}

请按以下结构输出：
1. 项目定位：影片类型 + 用途场景 + 投放渠道
2. 核心目标：看完影片后希望受众产生什么行动/认知（用动词开头）
3. 目标受众：人群画像 + 观看心态 + 决策角色
4. 必传信息：必须出现的 3-5 条核心信息（按优先级排序）
5. 风格倾向：客户暗示的调性关键词（如科技感/温情/高端/快节奏）
6. 约束条件：时长、预算量级、交付周期、明确禁忌
7. 隐性需求推断：客户没说但实际需要的是什么（用商业逻辑推导）

【本类型需求提炼方法 · ${typeMode().name}】
${typeMode().req}
${typeMode().brdHint}

要求：专业、精炼，每条不超过30字；隐性需求部分标注“推断”`;
  }
  function promptStage2() {
    return `你是4A广告公司资深创意总监。基于以下需求简报，输出3套差异化创意方向：
【需求简报】
${brdText() || "（待填写需求简报）"}
【影片类型】${state.meta.video_type}
【时长】${state.meta.duration}
${extraBlock()}

【本类型创意策划侧重点 · ${typeMode().name}】
${typeMode().creative}

每套方向按以下结构输出：
■ 方向名称：（四字以内）
■ 一句话创意：用一句话讲清核心概念（不超过25字）
■ 叙事结构：开场钩子→中段展开→高潮落点→结尾收束，各1句
■ 视觉调性：3-5个风格关键词 + 1句整体画面感受
■ 情绪曲线：标注起承转合的情绪起伏
■ 适配理由：为什么这个方向适合本项目的受众与目标（2条）

要求：三个方向要有明显差异，不要同质化；能落地拍摄；结尾自然带出品牌/产品。`;
  }
  function promptStage3() {
    const segs = state.stage3.segments;
    let s = "（待填写创意脚本）";
    if (segs.length) s = segs.map((x, i) => `【段落${i + 1} / ${x.time || ""}】\n场景：${x.scene || ""}\n画面：${x.visual || ""}\n旁白：${x.voiceover || ""}\n声音：${x.sound || ""}\n参考：${x.reference || ""}`).join("\n\n");
    return `你是资深影视编剧。基于选定的创意方向，撰写完整的创意脚本（文学脚本）：
【选定方向】「${chosenDir().name || ""}」${chosenDir().logline || ""}
【总时长】${state.meta.duration}
【核心信息】${get("stage1.brd.must_info", "") || "（待填写必传信息）"}
${extraBlock()}

脚本格式要求：
【第X段 / XX"-XX"】
■ 场景：（时间、地点、环境氛围）
■ 画面：（人物动作、关键事件，用现在时描写）
■ 旁白/台词：（逐字稿，标注“旁白”或角色名）
■ 声音设计：（音乐情绪变化、关键音效）
■ 参考片：（片名+链接+参考维度）

额外要求：
1. 严格控制每段时长，总时长误差不超过±5秒
2. 旁白每秒3-4字，台词每秒2-3字
3. 开场前3秒必须有钩子
4. 结尾必须包含品牌/产品露出和slogan，自然露出
5. 标注全片节奏BPM建议和音乐风格参考

当前段落摘要：
${s}`;
  }
  function promptStage4() {
    const segs = state.stage3.segments;
    let s = "（待填写创意脚本）";
    if (segs.length) s = segs.map((x, i) => `【段落${i + 1} / ${x.time || ""}】\n场景：${x.scene || ""}\n画面：${x.visual || ""}\n旁白：${x.voiceover || ""}\n声音：${x.sound || ""}\n参考：${x.reference || ""}`).join("\n\n");
    return `你是资深分镜师。将以下创意脚本拆解为专业的文字分镜表：
【创意脚本】
${s}
【影片总时长】${state.meta.duration}
【画幅比例】${state.meta.aspect_ratio}
${extraBlock()}

请输出标准分镜表格，每行一个镜头，包含字段：
| 镜号 | 景别 | 运镜 | 画面描述 | 旁白/台词 | 时长 | 音效/音乐 | 备注 |

专业规范：
1. 景别：WS远景/FS全景/MS中景/MCU近景/CU特写/ECU大特写
2. 运镜：固定/推/拉/横摇/竖摇/平移/跟拍/升降/环绕/手持
3. 画面描述具体到构图、光影、人物动作和表情
4. 时长精确到0.5秒，所有镜头时长累加等于总时长
5. 备注标注特殊拍摄要求与转场方式

输出完成后，附一段“剪辑节奏说明”。`;
  }
  function promptStage5Lock() {
    const l = state.stage5.style_lock || {};
    return `以下是同一部影片的分镜图生成规则，请严格遵守以保证风格统一：
【人物设定】${l.char || "（主角外貌、服装、年龄特征）"}
【主场景设定】${l.scene || "（主要场景的环境、年代、色调）"}
【整体视觉风格】${l.style || "（电影感、自然光、暖黄+青蓝对比色）"}
【画幅比例】${state.meta.aspect_ratio}

每次生成分镜图时，以上设定保持不变，只改变镜头的景别、机位、人物动作与场景细节变化。
所有分镜图必须保持：同一人物长相、同一色彩体系、同一光影逻辑、同一画质质感。`;
  }
  function promptStage5Shot(sh) {
    const l = state.stage5.style_lock || {};
    return `生成一张专业电影分镜图（故事板风格），对应以下镜头：
【镜头内容】${sh.desc || ""}
【景别】${sh.shot_size || ""}
【运镜】${sh.movement || ""}
【整体影调】${l.tone || "（冷色调、低对比度）"}
【美术风格】${l.style || "（电影感/写实主义）"}
【画幅比例】${state.meta.aspect_ratio}

画面要求：
1. 标准故事板线稿+淡彩风格，黑白或单色
2. 构图精准，体现景别和机位角度
3. 标注人物位置、视线方向、关键道具
4. 用箭头标注镜头运动方向
5. 底部留白用于填写镜号和文字说明
6. 风格统一：使用同一套人物造型和场景基调

负面提示：不要过于精细的插画、不要3D渲染感、不要彩色海报质感、人物不要正脸特写。`;
  }
  function promptStage6() {
    const shots = state.stage4.shots;
    let tbl = "（待填写文字分镜）";
    if (shots.length) tbl = "| 镜号 | 景别 | 运镜 | 画面描述 | 时长 |\n" + shots.map((s, i) => `| ${i + 1} | ${s.shot_size || ""} | ${s.movement || ""} | ${(s.desc || "").slice(0, 40)} | ${s.duration || 0} |`).join("\n");
    const refs = state.stage7.style_refs.filter(r => r).join("；") || "（参考片链接）";
    return `你是剪辑指导，请为以下分镜脚本输出动态分镜（Animatic）制作规范：
【分镜脚本】
${tbl}
【全片时长】${state.meta.duration}
【参考节奏片】${refs}

请输出：
1. 剪辑时序表：按镜头编号列出精确时长（精确到帧）
2. 镜头运动模拟方案：哪些镜头做 Ken Burns 效果（推/拉/摇）
3. 转场方案：每个转场的类型和时长
4. 声音设计草稿：音乐分段 / 关键音效点 / 旁白时间码
5. 节奏校验点：全片关键节拍点
6. 初剪完成后的自检清单（5条）

要求：时间码精确到0.1秒，总时长误差±0.5秒。`;
  }
  function promptStage7Mood() {
    const s7 = state.stage7;
    return `请为以下影片项目设计一套视觉参考体系（Moodboard 文字描述，用于找图/生成参考图）：
【影片类型】${state.meta.video_type}
【创意方向】「${chosenDir().name || ""}」${chosenDir().logline || ""}
【情绪基调】${s7.mood || "（温暖治愈/冷峻科技/复古怀旧/紧张悬疑）"}

请输出：
1. 主色板：3-5种主色调，附色值（HEX）和占比，说明每种颜色承载的情绪
2. 光影风格：硬光/柔光？自然光/戏剧光？对比强度？
3. 影调关键词：5-8个专业形容词
4. 参考片推荐：3部，每部说明参考什么
5. 摄影质感：焦段偏好、景深控制、机位高度
6. 画面颗粒感：是否加胶片颗粒/数字噪点

每项配1句解释，让美术和调色师一眼看懂方向。`;
  }
  function promptStage7Char() {
    const segs = state.stage3.segments;
    const sum = segs.length ? segs.map(s => `- ${s.visual || ""}（${s.time || ""}）`).join("\n") : "（待填写创意脚本）";
    return `基于以下创意脚本，输出完整的人物与美术设定清单：
【创意脚本摘要】
${sum}
【影片年代/背景】${state.stage7.era || "（现代都市/民国/未来科幻）"}

输出结构：
一、角色设定：角色名+年龄+职业+性格关键词；外形特征；演员参考；服装风格；妆发要求
二、核心场景设定：场景名+功能定位；空间描述；色调与光线；置景参考；预算等级
三、关键道具：道具名+出现场景+功能/象征意义+外观描述+筹备方式

要求：所有设定符合人物逻辑和剧情需要，避免为了好看而堆砌。`;
  }

  // ===================== 渲染：通用组件 =====================
  function promptBlock(title, text) {
    const id = "pb_" + Math.random().toString(36).slice(2);
    return `<div class="prompt"><div class="prompt-bar"><span>${title}</span><button onclick="App.copy('${id}')">复制</button></div><pre id="${id}">${esc(text)}</pre></div>`;
  }
  function field(path, label, ph, type) {
    type = type || "text";
    const v = get(path, "");
    if (type === "area") return `<div class="fi"><label class="lbl">${label}</label><textarea oninput="App.onInput('${path}',this)" placeholder="${ph || ""}">${esc(v)}</textarea></div>`;
    return `<div class="fi"><label class="lbl">${label}</label><input type="text" value="${esc(v)}" placeholder="${ph || ""}" oninput="App.onInput('${path}',this)"></div>`;
  }

  // ===================== 完成度 / 自动存档 =====================
  function completeness() {
    const s = state;
    const stages = [
      { id: "project", title: "项目设置", ok: !!(s.meta && s.meta.project_name && s.meta.project_name.trim()), miss: "项目名称" },
      { id: "stage1", title: "需求提炼", ok: !!(s.stage1 && s.stage1.raw_need && s.stage1.raw_need.trim()) || Object.values((s.stage1 && s.stage1.brd) || {}).some(v => v && String(v).trim()), miss: "原始需求 / BRD" },
      { id: "stage2", title: "创意策划", ok: ((s.stage2 && s.stage2.directions) || []).some(d => d && d.name), miss: "至少 1 套创意方向" },
      { id: "stage3", title: "创意脚本", ok: ((s.stage3 && s.stage3.segments) || []).some(d => d && (d.visual || d.voiceover)), miss: "脚本段落" },
      { id: "stage4", title: "文字分镜", ok: ((s.stage4 && s.stage4.shots) || []).length > 0, miss: "分镜表" },
      { id: "stage5", title: "分镜图", ok: ((s.stage5 && s.stage5.boards) || []).some(b => b && (b.image_data || b.gen_prompt)) || Object.values((s.stage5 && s.stage5.style_lock) || {}).some(v => v && String(v).trim()), miss: "一致性锁定 / 分镜图" },
      { id: "stage6", title: "动态分镜", ok: ["timeline", "kb_effects", "transitions", "sound_design", "beat_points", "checklist"].some(k => s.stage6 && s.stage6[k] && String(s.stage6[k]).trim()), miss: "动态分镜规范" },
      { id: "stage7", title: "提报资料", ok: ((s.stage7 && s.stage7.actors) || []).length > 0 || ((s.stage7 && s.stage7.art_set) || []).length > 0 || ((s.stage7 && s.stage7.props) || []).length > 0 || (s.stage7 && s.stage7.mood && s.stage7.mood.trim()) || (s.stage7 && s.stage7.moodboard && s.stage7.moodboard.color_palette && s.stage7.moodboard.color_palette.trim()), miss: "影调/角色/场景/道具" },
      { id: "stage8", title: "PPT 整合", ok: !!(s.stage8 && s.stage8._checked_pages && Object.values(s.stage8._checked_pages).some(Boolean)) || (s.stage8 && s.stage8.ppt_title && s.stage8.ppt_title.trim()), miss: "PPT 页面确认 / 标题" },
    ];
    const done = stages.filter(x => x.ok).length;
    return { stages, done, total: stages.length, pct: Math.round(done / stages.length * 100), missing: stages.filter(x => !x.ok).map(x => x.title) };
  }
  function _autosaveInfo() {
    try { const a = JSON.parse(localStorage.getItem(LS_AUTOSAVE)); if (a && a.ts) return { ts: a.ts, label: new Date(a.ts).toLocaleString("zh-CN"), data: a.data }; } catch (e) {}
    return null;
  }
  function _restoreAutosave() {
    const as = _autosaveInfo();
    if (!as) { setMsg("没有可恢复的自动存档"); return; }
    if (!confirm("用自动存档覆盖当前内容？未保存的改动会丢失。")) return;
    state = JSON.parse(JSON.stringify(as.data)); save(); current = "project"; rerender();
    setMsg("🕘 已恢复自动存档（" + as.label + "）");
  }

  // ===================== 各阶段渲染 =====================
  function renderProject() {
    const m = state.meta;
    const comp = completeness();
    const dash = `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;margin-bottom:18px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <span style="font-weight:700;font-size:15px">📊 方案完成度</span>
    <span style="font-weight:800;font-size:20px;color:${m.accent_color}">${comp.pct}%</span>
  </div>
  <div style="height:8px;background:#eef0f3;border-radius:6px;overflow:hidden;margin-bottom:10px"><div style="height:100%;width:${comp.pct}%;background:${m.accent_color};border-radius:6px"></div></div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
    ${comp.stages.map(x => `<span onclick="App.go('${x.id}')" style="cursor:pointer;font-size:12px;padding:3px 9px;border-radius:20px;border:1px solid ${x.ok ? '#c8e6c9' : '#ffe0b2'};background:${x.ok ? '#f1f8f2' : '#fff8ef'};color:${x.ok ? '#2e7d32' : '#b26a00'}">${x.ok ? '✅' : '⚠️'} ${x.title}</span>`).join('')}
  </div>
  ${comp.missing.length ? `<div style="font-size:12px;color:#b42318">待完成：${comp.missing.join('、')}</div>` : `<div style="font-size:12px;color:#2e7d32">🎉 全部环节已填写，可导出全案 / 生成 PPTX</div>`}
</div>`;
    const as = _autosaveInfo();
    const asDirty = as && JSON.stringify(as.data) !== JSON.stringify(state);
    const asHtml = as ? `<div style="font-size:12px;color:#667085;margin-top:10px">🕘 上次自动保存：${as.label}${asDirty ? ` ｜ <button class="mini" onclick="App._restoreAutosave()">↩ 恢复自动存档</button>` : ` ｜ 与当前内容一致`}</div>` : "";
    let ex = VIDEO_TYPES[m.video_type].extra.map(e => `<li><code>${e[0]}</code>：${e[1]}</li>`).join("");
    return `
    ${dash}
    <h2>⚙️ 项目设置</h2><p class="cap">全局上下文贯穿后续所有环节，请先填好。</p>
    <div class="grid2">
      ${field("meta.project_name", "项目名称", "如：星河科技 2025 品牌宣传片")}
      ${field("meta.client", "客户 / 品牌", "如：星河科技")}
      <div class="fi"><label class="lbl">影片类型</label><select onchange="App.onType(this.value)">${Object.keys(VIDEO_TYPES).map(t => `<option ${t === m.video_type ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="fi"><label class="lbl">影片时长</label><input type="text" value="${esc(m.duration)}" placeholder="如：30秒 / 2分钟" oninput="App.set('meta.duration',this.value);App.save()"></div>
      <div class="fi"><label class="lbl">画幅比例</label><select onchange="App.set('meta.aspect_ratio',this.value);App.rerender()">${ASPECTS.map(a => `<option ${a === m.aspect_ratio ? "selected" : ""}>${a}</option>`).join("")}</select></div>
      ${field("meta.channel", "投放渠道", "如：抖音 / 分众 / 官网")}
    </div>
    ${field("meta.audience", "目标受众画像", "如：25-40岁一线城市新中产")}
    <div class="grid2">
      <div class="fi"><label class="lbl">提报 PPT 主色</label><input type="color" value="${m.accent_color}" oninput="App.set('meta.accent_color',this.value);App.save()"></div>
      <div class="fi"><label class="lbl">当前类型说明</label><div class="cap" style="margin-top:0;padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:#fafbfc">${VIDEO_TYPES[m.video_type].desc}</div></div>
    </div>
    <div class="card"><b>本类型差异化参数（后续环节自动加入提示词）</b><ul>${ex}</ul></div>
    <details class="rules"><summary>📜 五条专业铁律（贯穿全程）</summary>${IRON_RULES.map(r => `<p>• ${r}</p>`).join("")}</details>
    <div class="export" style="margin-top:14px">
      <button class="primary" onclick="App.saveProject()">💾 保存为项目</button>
      <button onclick="App.loadProject()">📂 载入项目</button>
      <button onclick="App.newProject()">🆕 新建项目</button>
      <button class="primary" onclick="App.exportPlan()">📤 导出全案</button>
      <button onclick="App.copyAllPrompts()">📋 复制全案提示词</button>
    </div>${asHtml}`;
  }
  function renderStage1() {
    const p = promptStage1();
    const b = state.stage1.brd;
    const m1 = typeMode();
    return `<h2>📋 环节1 · 需求提炼</h2><p class="cap">把客户原话提炼成可执行的《需求简报 BRD》。</p>
    ${modeCard1(m1)}
    ${proPoints(["用结构化问卷替代自由访谈，必问7项。", "区分“客户说要的”和“客户真正需要的”。", "输出《需求简报 BRD》：背景/目标/受众/诉求/禁忌。"])}
    <label class="lbl">① 客户原始需求 / 会议纪要</label><textarea oninput="App.set('stage1.raw_need',this.value);App.save()" placeholder="粘贴客户原话、微信记录、brief…">${esc(state.stage1.raw_need)}</textarea>
    <div class="attach-box" style="margin-top:10px">
      <button class="btn" onclick="document.getElementById('rawFileInput').click()">📎 添加文件（Word / PPT / 图片 / 音频 / 视频）</button>
      <input id="rawFileInput" type="file" multiple accept=".doc,.docx,.ppt,.pptx,.pdf,image/*,audio/*,video/*" style="display:none" onchange="App.addRawFile(this.files)">
      ${rawFileList()}
    </div>
    ${promptBlock("🤖 本环节 AI 提示词（复制给大模型）", p)}
    <div class="refresh"><button onclick="App.rerender()">🔄 刷新提示词</button></div>
    <h3>② 《需求简报 BRD》填写</h3>
    ${field("stage1.brd.positioning", "项目定位（类型+场景+渠道）", "", "area")}
    ${field("stage1.brd.core_goal", "核心目标（动词开头）", "", "area")}
    ${field("stage1.brd.audience", "目标受众（画像+心态+角色）", "", "area")}
    ${field("stage1.brd.must_info", "必传信息（3-5条，按优先级）", "", "area")}
    ${field("stage1.brd.style", "风格倾向（调性关键词）", "", "area")}
    ${field("stage1.brd.constraints", "约束条件（时长/预算/周期/禁忌）", "", "area")}
    ${field("stage1.brd.hidden", "隐性需求推断（标注“推断”）", "", "area")}`;
  }
  function _fmtSize(b) { if (!b && b !== 0) return ''; if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
  function rawFileList() {
    const atts = state.stage1.attachments || [];
    if (!atts.length) return '';
    const chip = a => {
      const t = a.type || '';
      const isImg = t.startsWith('image/'), isAudio = t.startsWith('audio/'), isVideo = t.startsWith('video/');
      let preview = '';
      if (isImg) preview = `<img src="${a.dataUrl}" style="max-width:120px;max-height:90px;border-radius:6px;display:block;margin-bottom:6px">`;
      else if (isAudio) preview = `<audio controls src="${a.dataUrl}" style="width:180px"></audio>`;
      else if (isVideo) preview = `<video controls src="${a.dataUrl}" style="max-width:160px;max-height:110px;border-radius:6px;display:block;margin-bottom:6px"></video>`;
      else preview = `<span style="font-size:22px">📄</span>`;
      const idx = (state.stage1.attachments || []).indexOf(a);
      return `<div style="background:#141a22;border:1px solid #2a3340;border-radius:10px;padding:10px;margin:8px 8px 0 0;display:inline-block;vertical-align:top;max-width:200px">
        ${preview}
        <div style="font-size:12px;color:#cdd6e0;word-break:break-all;margin-bottom:4px">${esc(a.name)}</div>
        <div style="font-size:11px;color:#8a93a3;margin-bottom:6px">${esc(a.type || '文件')} · ${_fmtSize(a.size)}</div>
        <a href="${a.dataUrl}" download="${esc(a.name)}" style="font-size:12px;color:#6db3ff;margin-right:8px">⬇ 下载</a>
        <span onclick="App.delRawFile(${idx})" style="font-size:12px;color:#ff7b72;cursor:pointer">🗑 删除</span>
      </div>`;
    };
    return `<div style="margin-top:4px">${atts.map(chip).join('')}</div>`;
  }
  function addRawFile(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (!state.stage1.attachments) state.stage1.attachments = [];
    let pending = files.length, failed = 0;
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => {
        state.stage1.attachments.push({ name: f.name, type: f.type || "application/octet-stream", size: f.size || 0, dataUrl: ev.target.result });
        if (--pending <= 0) { save(); rerender(); setMsg("📎 已添加 " + (files.length - failed) + " 个文件" + (failed ? "（" + failed + " 个失败）" : "")); }
      };
      r.onerror = () => { failed++; if (--pending <= 0) { save(); rerender(); setMsg("⚠️ 部分文件读取失败"); } };
      try { r.readAsDataURL(f); } catch (e) { failed++; if (--pending <= 0) { save(); rerender(); } }
    });
  }
  function delRawFile(idx) {
    if (!state.stage1.attachments) return;
    state.stage1.attachments.splice(idx, 1);
    save(); rerender();
  }
  function renderStage2() {
    const p = promptStage2();
    const dirs = state.stage2.directions;
    const m2 = typeMode();
    while (dirs.length < 3) dirs.push({});
    const ex = VIDEO_TYPES[state.meta.video_type].extra.map(e => field("stage2.extra." + jsonKey(e[0]), "差异化参数 · " + e[0], e[1])).join("");
    const chosen = Math.min(state.stage2.chosen || 0, dirs.length - 1);
    let cards = dirs.map((d, i) => `
      <div class="card"><h4>方向 ${i + 1}</h4>
        ${field("stage2.directions." + i + ".name", "方向名称（四字以内）", "")}
        ${field("stage2.directions." + i + ".logline", "一句话创意（≤25字）", "")}
        ${field("stage2.directions." + i + ".narrative", "叙事结构", "", "area")}
        ${field("stage2.directions." + i + ".visual_tone", "视觉调性", "", "area")}
        ${field("stage2.directions." + i + ".emotion_curve", "情绪曲线", "")}
        ${field("stage2.directions." + i + ".rationale", "适配理由", "", "area")}
        ${field("stage2.directions." + i + ".references", "参考片链接", "", "area")}
      </div>`).join("");
    return `<h2>💡 环节2 · 创意策划</h2><p class="cap">产出 3 套差异化方向，客户选定一套进入脚本细化。</p>
    ${modeCard2(m2)}
    ${proPoints(["商业视频五大创意范式。", "至少 3 套差异化方向（保守/冒险/平衡），给客户选择感。", "每套附：创意概念+叙事结构+风格关键词+参考片。"])}
    ${ex}
    ${renderAITools("stage2")}
    ${promptBlock("🤖 本环节 AI 提示词", p)}
    <div class="refresh"><button onclick="App.rerender()">🔄 刷新提示词</button></div>
    <h3>3 套创意方向</h3>
    <label class="lbl">选定提报方向（后续环节围绕它展开）</label>
    <select onchange="App.set('stage2.chosen',parseInt(this.value));App.rerender()">${dirs.map((d, i) => `<option value="${i}" ${i === chosen ? "selected" : ""}>方向 ${i + 1}：「${d.name || "未命名"}」</option>`).join("")}</select>
    ${cards}`;
  }
  function renderStage3() {
    const p = promptStage3();
    const d3 = chosenDir();
    const segs = state.stage3.segments;
    if (!segs.length) segs.push({});
    let rows = segs.map((s, i) => `
      <div class="card seg">
        <div class="seg-h">段落 ${i + 1} ${s.time ? "· " + esc(s.time) : ""}
          <button class="mini" onclick="App.delSeg(${i})">🗑 删除</button></div>
        ${field("stage3.segments." + i + ".time", "时间区间", "00\"-08\"")}
        ${field("stage3.segments." + i + ".scene", "场景", "")}
        ${field("stage3.segments." + i + ".visual", "画面（人物动作/事件）", "", "area")}
        ${field("stage3.segments." + i + ".voiceover", "旁白/台词", "", "area")}
        ${field("stage3.segments." + i + ".sound", "声音设计", "", "area")}
        ${field("stage3.segments." + i + ".reference", "参考片（片名+链接+参考维度）", "", "area")}
      </div>`).join("");
    return `<h2>📝 环节3 · 创意脚本</h2><p class="cap">文学脚本 + 参考视频清单，按段落控制时长。</p>
    ${d3.name || d3.logline ? `<div style="background:#f5f8ff;border:1px solid #d6e4ff;border-radius:10px;padding:10px 12px;margin:4px 0 14px">
      🎯 当前选用创意方向：<b>${esc(d3.name || "未命名")}</b>${d3.logline ? ` ｜ 一句话创意：<b>${esc(d3.logline)}</b>` : ""}
      ${d3.narrative ? `<div style="margin-top:4px;font-size:12px;color:#5f6368">叙事结构：${esc(d3.narrative)}</div>` : ""}
      <div style="margin-top:8px"><button class="mini" onclick="App.seedScriptFromDirection()">⚡ 用该方向初始化脚本结构</button></div>
    </div>` : `<div class="cap" style="margin:4px 0 14px">💡 提示：先在「环节2 · 创意策划」选定一套方向，这里可一键把创意带入脚本。</div>`}
    ${proPoints(["创意脚本=文学脚本，侧重“讲什么故事”，不分镜头。", "包含：场景+人物动作+台词/旁白+音效/音乐。", "必须配套参考视频清单：每段对应1-2条参考片。"])}
    ${promptBlock("🤖 本环节 AI 提示词", p)}
    <div class="refresh"><button onclick="App.rerender()">🔄 刷新提示词</button></div>
    <h3>脚本段落</h3>${rows}
    <button onclick="App.addSeg()">➕ 添加段落</button>
    <div class="grid2">
      ${field("stage3.rhythm_bpm", "节奏 BPM 建议", "")}
      ${field("stage3.music_style", "音乐风格参考", "")}
    </div>`;
  }
  function seedScriptFromDirection() {
    const d = chosenDir();
    if (!d.name && !d.logline) { setMsg("请先在「环节2 · 创意策划」选定一套创意方向"); return; }
    const hasContent = state.stage3.segments.some(s => s && (s.visual || s.voiceover));
    if (hasContent && !confirm("已有脚本段落，仍要按创意方向生成新骨架（插入到开头）？")) return;
    const skeleton = [
      { time: '00"–', scene: "开场钩子", visual: (d.logline || "") + (d.narrative ? " ｜ " + d.narrative : ""), voiceover: "", sound: "", reference: "" },
      { time: "–", scene: "发展与铺垫", visual: "围绕核心创意展开情节", voiceover: "", sound: "", reference: "" },
      { time: "–", scene: "高潮 / 转折", visual: "创意最具冲击力的瞬间", voiceover: "", sound: "", reference: "" },
      { time: "–", scene: "收尾 / 行动", visual: "呼应开头，落到品牌或行动指令", voiceover: "", sound: "", reference: "" },
    ];
    state.stage3.segments = hasContent ? skeleton.concat(state.stage3.segments) : skeleton;
    save(); rerender();
    setMsg("⚡ 已按创意方向「" + (d.name || "未命名") + "」生成脚本骨架");
  }
  function renderStage4() {
    const p = promptStage4();
    const shots = state.stage4.shots;
    const d4c = chosenDir();
    const ctx4 = `<div class="cap" style="margin:4px 0 12px">🎯 创意方向：<b>${esc(d4c.name || "未选定")}</b>${d4c.logline ? `（${esc(d4c.logline)}）` : ""} ｜ 👥 受众：${esc(state.meta.audience || "未填")} ｜ 📡 渠道：${esc(state.meta.channel || "未填")} ｜ ⏱ 时长：${esc(state.meta.duration || "未填")}</div>`;
    if (!shots.length) shots.push({});
    const head = `<div class="trow th"><span>镜号</span><span>景别</span><span>运镜</span><span>画面描述</span><span>旁白/台词</span><span>时长(s)</span><span>音效/音乐</span><span>备注/转场</span></div>`;
    let rows = shots.map((s, i) => `
      <div class="trow">
        <span>${i + 1}</span>
        <span><select onchange="App.set('stage4.shots.${i}.shot_size',this.value);App.save()">${SHOT_SIZES.map(o => `<option ${o === s.shot_size ? "selected" : ""}>${o}</option>`).join("")}</select></span>
        <span><select onchange="App.set('stage4.shots.${i}.movement',this.value);App.save()">${CAMERA_MOVES.map(o => `<option ${o === s.movement ? "selected" : ""}>${o}</option>`).join("")}</select></span>
        <span><textarea oninput="App.set('stage4.shots.${i}.desc',this.value);App.save()">${esc(s.desc)}</textarea></span>
        <span><textarea oninput="App.set('stage4.shots.${i}.dialogue',this.value);App.save()">${esc(s.dialogue)}</textarea></span>
        <span><input type="number" step="0.5" value="${s.duration || 0}" oninput="App.set('stage4.shots.${i}.duration',parseFloat(this.value)||0);App.save()"></span>
        <span><textarea oninput="App.set('stage4.shots.${i}.sound',this.value);App.save()">${esc(s.sound)}</textarea></span>
        <span><textarea oninput="App.set('stage4.shots.${i}.note',this.value);App.save()">${esc(s.note)}</textarea></span>
      </div>`).join("");
    const total = shots.reduce((a, s) => a + (parseFloat(s.duration) || 0), 0);
    return `<h2>🎬 环节4 · 文字分镜</h2><p class="cap">八列分镜表 = 拍摄执行蓝图。</p>
    ${ctx4}
    ${proPoints(["文字分镜=拍摄蓝图，给导演/摄影/制片。", "标准八列：镜号/景别/运镜/画面/台词/时长/音效/备注。", "广告片15秒约8-12镜；宣传片每分钟约15-25镜。"])}
    ${promptBlock("🤖 本环节 AI 提示词", p)}
    <div class="refresh"><button onclick="App.rerender()">🔄 刷新提示词</button></div>
    <h3>分镜表（八列）</h3>
    <button class="mini" onclick="App.buildShotsFromScript()">⚡ 从创意脚本段落快速建镜位</button>
    ${head}${rows}
    <button onclick="App.addShot()">➕ 添加镜头</button>
    <div class="info">镜头数：${shots.length} ｜ 时长合计：${total.toFixed(1)}s ｜ 目标：${state.meta.duration}</div>
    ${field("stage4.rhythm_note", "剪辑节奏说明", "", "area")}`;
  }
  // ===================== 环节5 分镜图（数据增强 + 结构化补充）=====================

  // 合并镜头数据：环节4原始 + stage5覆盖 → 最终用于提示词的数据
  function _mergedShot(i) {
    const sh = (state.stage4.shots || [])[i] || {};
    const bd = (state.stage5.boards || [])[i] || {};
    return {
      shot_size: bd.shot_size_override || sh.shot_size || "",
      movement:  bd.movement_override  || sh.movement  || "",
      desc:      bd.desc_override      || sh.desc      || "",
      dialogue:  sh.dialogue || "",
      duration:  sh.duration || 0,
      sound:     sh.sound    || "",
      note:      sh.note     || "",
    };
  }

  // 构建最终文生图提示词（基础层 + 补充层 + 一致层）
  function _buildFullPrompt(i) {
    const m = _mergedShot(i);
    const bd = (state.stage5.boards || [])[i] || {};
    const l = state.stage5.style_lock || {};
    const parts = [];

    // 基础层：分镜数据
    parts.push(`【镜头 ${i+1}】`);
    if (m.shot_size) parts.push(`景别：${m.shot_size}`);
    if (m.movement)  parts.push(`运镜：${m.movement}`);
    if (m.desc)      parts.push(`画面描述：${m.desc}`);
    if (m.dialogue)  parts.push(`台词/旁白：${m.dialogue}`);

    // 补充层：构图/光线/动作/机位/道具/色彩
    const sups = [];
    if (bd.composition)     sups.push(`构图：${bd.composition}`);
    if (bd.lighting)        sups.push(`光线：${bd.lighting}`);
    if (bd.character_action) sups.push(`人物动作与表情：${bd.character_action}`);
    if (bd.camera_angle)    sups.push(`机位角度：${bd.camera_angle}`);
    if (bd.props_detail)    sups.push(`关键道具：${bd.props_detail}`);
    if (bd.color_note)      sups.push(`色彩倾向：${bd.color_note}`);
    if (bd.extra_info)      sups.push(`补充说明：${bd.extra_info}`);
    if (sups.length) parts.push("【画面补充】\n" + sups.join("\n"));

    // 一致层：人物/场景/风格/影调
    const lock = [];
    if (l.char)  lock.push(`人物设定：${l.char}`);
    if (l.scene) lock.push(`主场景：${l.scene}`);
    if (l.style) lock.push(`视觉风格：${l.style}`);
    if (l.tone)  lock.push(`影调：${l.tone}`);
    if (lock.length) parts.push("【一致性约束】\n" + lock.join("\n"));

    parts.push(`【画幅】${state.meta.aspect_ratio}`);
    parts.push("【要求】电影分镜图（故事板风格），标准线稿+淡彩，构图精准，标注镜头运动方向，底部留白用于填写镜号和说明。");
    return parts.join("\n\n");
  }

  function renderStage5() {
    const l = state.stage5.style_lock || {};
    const shots = state.stage4.shots;
    let boards = state.stage5.boards;
    const synced = !!shots.length;
    if (synced) {
      if (boards.length !== shots.length) { boards = shots.map((_, i) => boards[i] || {}); state.stage5.boards = boards; save(); }
    } else {
      if (!boards.length) boards.push({});
    }

    // ---- 一致性锁定区域（文字 + 参考图上传 + AI生成）----
    function lockBlock(key, title, placeholder) {
      const img = l[key + "_img"] || "";
      const prompt = l[key + "_prompt"] || "";
      const imgHtml = img ? `<img class="lock-ref" src="${img}" alt="${title}参考图">` : `<div class="lock-ref ph">📷 ${title}参考图（可上传或 AI 生成）</div>`;
      return `<div class="lock-col">
        <h5>${title}</h5>
        ${imgHtml}
        <textarea oninput="App._setLock('${key}',this.value)" placeholder="${placeholder}">${esc(l[key] || "")}</textarea>
        <div class="lock-actions">
          <label class="mini" style="cursor:pointer;display:inline-block">📎 上传参考图<input type="file" accept="image/*" style="display:none" onchange="App._uploadLockImg('${key}',this.files[0])"></label>
          <button class="mini" onclick="App._genLockImg('${key}')">🤖 AI 生成参考图</button>
          ${img ? `<button class="mini" onclick="App._clearLockImg('${key}')">✕ 清除</button>` : ""}
        </div>
        ${prompt ? `<div class="ai-tip" style="margin-top:6px">💡 上次 AI 生成提示词：${esc(prompt.slice(0,120))}${prompt.length>120?"…":""}</div>` : ""}
      </div>`;
    }
    const lockHtml = `<h3>一致性锁定（批量生成前先定）</h3>
      <div class="lock-row">
        ${lockBlock("char", "👤 人物设定", "主角外貌、服装、年龄、体型特征…")}
        ${lockBlock("scene", "🏠 主场景设定", "环境描述、年代、色调、关键道具…")}
      </div>
      <div class="grid2" style="margin-top:4px">
        ${field("stage5.style_lock.style", "整体视觉风格", "电影感、自然光、暖黄+青蓝对比色")}
        ${field("stage5.style_lock.tone", "整体影调", "冷色调、低对比度")}
      </div>
      ${promptBlock("🔒 一致性控制提示词", promptStage5Lock())}
      ${renderAITools("stage5")}`;

    // ---- 结构化补充字段的渲染 ----
    function supField(bd, key, label, placeholder, isArea) {
      const tag = isArea ? "textarea" : "input";
      const val = esc(bd[key] || "");
      if (isArea) return `<div class="fi"><label class="lbl">${label}</label><textarea oninput="App._setBoardField(${bd._i},'${key}',this.value)" placeholder="${placeholder}">${val}</textarea></div>`;
      return `<div class="fi"><label class="lbl">${label}</label><input oninput="App._setBoardField(${bd._i},'${key}',this.value)" placeholder="${placeholder}" value="${val}"></div>`;
    }

    // ---- 逐镜分镜图（从文字分镜读取，文生图）----
    let cardsHtml;
    if (synced) {
      cardsHtml = shots.map((sh, i) => {
        const bd = boards[i] || {}; bd._i = i;
        const m = _mergedShot(i);
        const genImg = bd.image_data || "";
        const genPrompt = bd.gen_prompt || _buildFullPrompt(i);
        const expanded = bd._expanded || false;
        const hasOverride = !!(bd.desc_override || bd.shot_size_override || bd.movement_override);
        const hasSupplement = !!(bd.composition || bd.lighting || bd.character_action || bd.camera_angle || bd.props_detail || bd.color_note || bd.extra_info);
        const previewHtml = genImg
          ? `<img src="${genImg}" alt="镜${i+1}分镜图">`
          : `<div class="ph">🎬 文生图生成预览</div>`;

        // 数据来源标注
        const srcParts = [];
        if (hasOverride) srcParts.push(`<span class="ovr">已覆盖 ${Object.entries(bd).filter(([k,v]) => (k==="desc_override"||k==="shot_size_override"||k==="movement_override") && v).length} 项</span>`);
        if (hasSupplement) srcParts.push("已补充画面细节");
        const srcNote = srcParts.length ? ` · ${srcParts.join(" · ")}` : "";

        return `<div class="shot-card">
          <div class="sh">
            <span class="idx">${i+1}</span> 镜${i+1} · ${m.shot_size || "?"} · ${m.movement || "?"}
            <span class="shot-toggle" onclick="App._toggleShotDetail(${i})">${expanded ? "▲ 收起详情" : "▼ 展开详情"}</span>
          </div>
          <div class="shot-info">
            <span>📐 ${m.shot_size || "未设景别"}</span>
            <span>🎥 ${m.movement || "未设运镜"}</span>
            <span>⏱ ${m.duration || "?"}s</span>
          </div>
          <div class="shot-src">📋 数据来源：<b>环节4 文字分镜</b>${srcNote}</div>
          <div class="gen-area">
            <div class="gen-preview">${previewHtml}</div>
          </div>
          <div class="gen-actions">
            <button class="mini" onclick="App._genShotImg(${i})">🚀 文生图</button>
            <button class="mini" onclick="App._copyFullPrompt(${i})">📋 复制提示词</button>
            <label class="mini" style="cursor:pointer">📎 手动上传<input type="file" accept="image/*" style="display:none" onchange="App.onImage(${i},this.files[0])"></label>
            ${genImg ? `<button class="mini" onclick="App._clearShotImg(${i})">✕ 清除</button>` : ""}
          </div>

          <div class="shot-detail${expanded ? " open" : ""}">
            <!-- 覆盖项：可覆盖环节4的分镜数据 -->
            <h5 style="margin:4px 0 6px;font-size:12px;color:#5f6368">🔧 分镜数据覆盖（留空则使用环节4原始数据）</h5>
            <div class="sup-row">
              ${(() => {
                let h = "";
                h += `<div class="fi"><label class="lbl">景别覆盖</label><select onchange="App._setBoardField(${i},'shot_size_override',this.value)" style="font-size:12px"><option value="">（使用原始：${esc(sh.shot_size||"无")}）</option>${SHOT_SIZES.map(o => `<option ${o===bd.shot_size_override?"selected":""}>${o}</option>`).join("")}</select></div>`;
                h += `<div class="fi"><label class="lbl">运镜覆盖</label><select onchange="App._setBoardField(${i},'movement_override',this.value)" style="font-size:12px"><option value="">（使用原始：${esc(sh.movement||"无")}）</option>${CAMERA_MOVES.map(o => `<option ${o===bd.movement_override?"selected":""}>${o}</option>`).join("")}</select></div>`;
                return h;
              })()}
            </div>
            <div class="fi"><label class="lbl">画面描述覆盖（原始：${esc((sh.desc||"").slice(0,50))}${(sh.desc||"").length>50?"…":""}）</label><textarea oninput="App._setBoardField(${i},'desc_override',this.value)" placeholder="如需修改画面描述，在此填写（覆盖原始）">${esc(bd.desc_override || "")}</textarea></div>

            <!-- 补充项：环节4没有的维度 -->
            <h5 style="margin:8px 0 6px;font-size:12px;color:#1967d2">💡 画面补充信息（每个维度单独填写，AI 提示词自动合并）</h5>
            <div class="sup-grid">
              ${supField(bd, "composition", "构图说明", "三分法/对称/引导线/留白…")}
              ${supField(bd, "lighting", "光线方向与质感", "主光方向、色温、软硬光…")}
              ${supField(bd, "character_action", "人物动作与表情", "具体动作、表情、视线方向…")}
              ${supField(bd, "camera_angle", "机位角度", "平视/俯拍/仰拍/过肩/低角度…")}
              ${supField(bd, "props_detail", "关键道具", "画面中需强调的道具及位置")}
              ${supField(bd, "color_note", "色彩倾向", "本镜特定色调（如偏暖/冷/去饱和）")}
            </div>
            <div class="fi">${supField(bd, "extra_info", "自由补充", "任何其他需要补充的细节…", true)}</div>

            <!-- 合并后的最终提示词 -->
            <div class="sup-merged">
              <label class="lbl">📋 合并后的 AI 文生图提示词（基础 + 补充 + 一致性）</label>
              <textarea oninput="App._setBoardPrompt(${i},this.value)" placeholder="AI 文生图最终提示词…">${esc(genPrompt)}</textarea>
              <div style="margin-top:4px;display:flex;gap:6px">
                <button class="mini" onclick="App._regenPrompt(${i})">🔄 重新合并提示词</button>
                <span style="font-size:11px;color:var(--sub)">修改覆盖项/补充项后点此按钮重新生成合并提示词</span>
              </div>
            </div>
          </div>
        </div>`;
      }).join("");
    } else {
      // 独立模式：手动图位（简化版）
      cardsHtml = boards.map((bd, i) => {
        bd._i = i;
        const genImg = bd.image_data || "";
        const genPrompt = bd.gen_prompt || "";
        const expanded = bd._expanded || false;
        const previewHtml = genImg
          ? `<img src="${genImg}" alt="分镜图位${i+1}">`
          : `<div class="ph">🎬 文生图生成预览</div>`;
        return `<div class="shot-card">
          <div class="sh">
            <span class="idx">${i+1}</span> 分镜图位 ${i+1}
            <span class="shot-toggle" onclick="App._toggleShotDetail(${i})">${expanded ? "▲ 收起详情" : "▼ 展开详情"}</span>
          </div>
          <div class="cap">（独立模式：未关联文字分镜，请手动描述画面）</div>
          <div class="gen-area"><div class="gen-preview">${previewHtml}</div></div>
          <div class="gen-actions">
            <button class="mini" onclick="App._genShotImg(${i})">🚀 文生图</button>
            <button class="mini" onclick="App._copyFullPrompt(${i})">📋 复制提示词</button>
            <label class="mini" style="cursor:pointer">📎 手动上传<input type="file" accept="image/*" style="display:none" onchange="App.onImage(${i},this.files[0])"></label>
            ${genImg ? `<button class="mini" onclick="App._clearShotImg(${i})">✕ 清除</button>` : ""}
            <button class="mini" onclick="App.delBoard(${i})">🗑 删除图位</button>
          </div>
          <div class="shot-detail${expanded ? " open" : ""}">
            <div class="sup-grid">
              ${supField(bd, "composition", "构图说明", "三分法/对称/引导线…")}
              ${supField(bd, "lighting", "光线方向与质感", "主光方向、色温…")}
              ${supField(bd, "character_action", "人物动作与表情", "具体动作、表情…")}
              ${supField(bd, "camera_angle", "机位角度", "平视/俯拍/仰拍…")}
              ${supField(bd, "props_detail", "关键道具", "画面中需强调的道具")}
              ${supField(bd, "color_note", "色彩倾向", "本镜特定色调")}
            </div>
            <div class="fi">${supField(bd, "extra_info", "自由补充", "任何其他需要补充的细节…", true)}</div>
            <div class="sup-merged">
              <label class="lbl">📋 AI 文生图提示词</label>
              <textarea oninput="App._setBoardPrompt(${i},this.value)" placeholder="AI 文生图提示词…">${esc(genPrompt)}</textarea>
            </div>
          </div>
        </div>`;
      }).join("") + `<button onclick="App.addBoard()">➕ 添加分镜图位</button>`;
    }

    return `<h2>🖼️ 环节5 · 分镜图</h2><p class="cap">${synced ? "从环节4文字分镜读取镜头数据 → 补充画面细节 → AI 文生图。" : "独立模式：手动添加分镜图位，AI 文生图。"}</p>
    ${proPoints(["分镜图=画面化的分镜脚本，每格对应一个镜头。", "直接读取环节4文字分镜数据，展开详情可覆盖/补充各维度。", "补充信息按维度拆分（构图/光线/动作/机位/道具/色彩），自动合并为完整提示词。"])}
    ${lockHtml}
    <h3>逐镜分镜图 · 文生图 <span style="font-weight:400;font-size:12px;color:var(--sub)">（点击「▼ 展开详情」编辑覆盖项与补充项）</span></h3>${cardsHtml}`;
  }

  // ---- stage5 辅助函数 ----
  function _mergedShot(i) { /* defined above, kept for external use */ return _mergedShot(i); }
  function _buildFullPrompt(i) { return _buildFullPrompt(i); }
  function _setLock(key, val) { state.stage5.style_lock[key] = val; save(); }
  function _setBoardField(i, key, val) { if (!state.stage5.boards[i]) state.stage5.boards[i] = {}; state.stage5.boards[i][key] = val; save(); }
  function _toggleShotDetail(i) { if (!state.stage5.boards[i]) state.stage5.boards[i] = {}; state.stage5.boards[i]._expanded = !state.stage5.boards[i]._expanded; save(); rerender(); }
  function _regenPrompt(i) {
    const bd = state.stage5.boards[i] || {};
    const prompt = _buildFullPrompt(i);
    bd.gen_prompt = prompt; save(); rerender();
    setMsg(`✅ 镜${i+1} 提示词已重新合并`);
  }
  function _copyFullPrompt(i) {
    const bd = state.stage5.boards[i] || {};
    const prompt = bd.gen_prompt || _buildFullPrompt(i);
    navigator.clipboard.writeText(prompt).then(() => setMsg(`✅ 镜${i+1} 提示词已复制`)).catch(() => setMsg("复制失败"));
  }
  function _uploadLockImg(key, file) {
    if (!file) return; const r = new FileReader();
    r.onload = e => { state.stage5.style_lock[key + "_img"] = e.target.result; save(); rerender(); };
    r.readAsDataURL(file);
  }
  function _genLockImg(key) {
    const l = state.stage5.style_lock || {};
    const titles = { char: "人物设定", scene: "主场景设定" };
    const prompt = `请根据以下描述生成一张${titles[key]}参考图/概念图：\n${l[key] || "（无文字描述，请根据影片类型自由发挥）"}\n影片类型：${state.meta.video_type}\n视觉风格：${l.style || "电影感写实"}\n影调：${l.tone || "冷色调"}`;
    state.stage5.style_lock[key + "_prompt"] = prompt; save(); rerender();
    navigator.clipboard.writeText(prompt).then(() => {
      setMsg(`✅ 「${titles[key]}」AI 提示词已复制！请打开 Midjourney / DALL·E / SD 粘贴生成，生成后将图片上传或拖入此处。`);
    }).catch(() => { setMsg(`💡 「${titles[key]}」提示词已生成（见面板底部）。请复制后到 AI 工具中生成。`); });
  }
  function _clearLockImg(key) { delete state.stage5.style_lock[key + "_img"]; delete state.stage5.style_lock[key + "_prompt"]; save(); rerender(); }
  function _setBoardPrompt(i, val) { if (!state.stage5.boards[i]) state.stage5.boards[i] = {}; state.stage5.boards[i].gen_prompt = val; save(); }
  function _genShotImg(i) {
    const bd = state.stage5.boards[i] || {};
    const prompt = bd.gen_prompt || _buildFullPrompt(i);
    if (!state.stage5.boards[i]) state.stage5.boards[i] = {};
    state.stage5.boards[i].gen_prompt = prompt; save();
    navigator.clipboard.writeText(prompt).then(() => {
      setMsg(`✅ 镜${i+1} 文生图提示词已复制！请到 Midjourney / DALL·E / SD 粘贴生成，生成后点「📎 手动上传」贴入。`);
    }).catch(() => { setMsg(`💡 镜${i+1} 提示词已保存。请复制后到 AI 工具生成，再手动上传。`); });
  }
  function _clearShotImg(i) { if (state.stage5.boards[i]) { state.stage5.boards[i].image_data = ""; } save(); rerender(); }
  function renderStage6() {
    const p = promptStage6();
    const s = state.stage6;
    return `<h2>🎞️ 环节6 · 动态分镜</h2><p class="cap">Animatic = 成本最低的节奏校验工具。</p>
    ${proPoints(["动态分镜=分镜图按时间线串起来+临时配音+临时音乐+简单运镜。", "核心价值：验证节奏，看出「会不会拖沓」。", "工具：Premiere/剪映均可，甚至 PPT 都能做。"])}
    ${renderAITools("stage6")}
    ${promptBlock("🤖 本环节 AI 提示词", p)}
    <div class="refresh"><button onclick="App.rerender()">🔄 刷新提示词</button></div>
    <h3>动态分镜制作规范</h3>
    ${field("stage6.timeline", "① 剪辑时序表（镜号+精确时长+出入点）", "", "area")}
    ${field("stage6.kb_effects", "② 镜头运动模拟方案（Ken Burns）", "", "area")}
    ${field("stage6.transitions", "③ 转场方案", "", "area")}
    ${field("stage6.sound_design", "④ 声音设计草稿（音乐/音效/旁白时间码）", "", "area")}
    ${field("stage6.beat_points", "⑤ 节奏校验点（关键节拍）", "", "area")}
    ${field("stage6.checklist", "⑥ 初剪自检清单（5条）", "", "area")}`;
  }
  function renderStage7() {
    const s7 = state.stage7;
    const mb = s7.moodboard;
    const refs = s7.style_refs; while (refs.length < 1) refs.push("");
    let refItems = refs.map((r, i) => field("stage7.style_refs." + i, "参考片 " + (i + 1), "片名+链接+参考维度（如构图/色调）")).join("") + `<button onclick="App.addRef()">➕ 添加参考片</button>`;
    let actors = s7.actors; if (!actors.length) actors.push({});
    let actorCards = actors.map((a, i) => `<div class="card"><h4>角色 ${i + 1}</h4>
      ${field("stage7.actors." + i + ".name", "角色名/年龄/职业/性格", "")}
      ${field("stage7.actors." + i + ".look", "外形特征", "", "area")}
      ${field("stage7.actors." + i + ".actor_ref", "演员参考（2-3位公众人物）", "", "area")}
      ${field("stage7.actors." + i + ".wardrobe", "服装风格（主色系+关键单品）", "", "area")}
      ${field("stage7.actors." + i + ".makeup", "妆发要求", "", "area")}
      <button class="mini" onclick="App.delActor(${i})">🗑 删除角色</button></div>`).join("") + `<button onclick="App.addActor()">➕ 添加角色</button>`;
    let art = s7.art_set; if (!art.length) art.push({});
    let artCards = art.map((sc, i) => `<div class="card"><h4>场景 ${i + 1}</h4>
      ${field("stage7.art_set." + i + ".name", "场景名+功能定位", "")}
      ${field("stage7.art_set." + i + ".space", "空间描述（面积/结构/陈设）", "", "area")}
      ${field("stage7.art_set." + i + ".tone", "色调与光线", "", "area")}
      ${field("stage7.art_set." + i + ".budget", "预算等级（低/中/高）", "")}
      <button class="mini" onclick="App.delArt(${i})">🗑 删除场景</button></div>`).join("") + `<button onclick="App.addArt()">➕ 添加场景</button>`;
    let props = s7.props; if (!props.length) props.push({});
    let propCards = props.map((p, i) => `<div class="card"><h4>道具 ${i + 1}</h4>
      ${field("stage7.props." + i + ".name", "道具名+出现场景", "")}
      ${field("stage7.props." + i + ".meaning", "功能/象征意义", "", "area")}
      ${field("stage7.props." + i + ".prep", "筹备方式（采购/定制/借拍）", "")}
      <button class="mini" onclick="App.delProp(${i})">🗑 删除道具</button></div>`).join("") + `<button onclick="App.addProp()">➕ 添加道具</button>`;
    return `<h2>🎨 环节7 · 提报资料</h2><p class="cap">影调/风格/美术/置景/演员/服化道——七大专案。</p>
    ${proPoints(["七大模块：影调/风格/美术/置景/演员/服装/道具。", "影调：色调色板+光影风格参考图。", "风格：参考片截图/海报，标注参考维度。"])}
    ${renderAITools("stage7")}
    <div class="grid2">
      ${field("stage7.mood", "情绪基调（如 温暖治愈/冷峻科技）", "")}
      ${field("stage7.era", "影片年代 / 背景", "现代都市/民国/未来科幻")}
    </div>
    <div class="tabs">
      <div class="tab"><h3>影调 Moodboard</h3>${promptBlock("🧑 影调参考提示词", promptStage7Mood())}
        ${field("stage7.moodboard.color_palette", "主色板（HEX+占比+情绪）", "", "area")}
        ${field("stage7.moodboard.light_style", "光影风格", "", "area")}
        ${field("stage7.moodboard.tone_keywords", "影调关键词（5-8个）", "", "area")}
        ${field("stage7.moodboard.ref_films", "参考片推荐（3部+参考维度）", "", "area")}
        ${field("stage7.moodboard.photo_texture", "画面颗粒感", "", "area")}</div>
      <div class="tab"><h3>风格参考</h3>${refItems}</div>
      <div class="tab"><h3>角色与服化道</h3>${promptBlock("🧑 角色与服化道设定提示词", promptStage7Char())}${actorCards}</div>
      <div class="tab"><h3>美术置景与道具</h3><h4>美术置景</h4>${artCards}<h4>道具清单</h4>${propCards}</div>
    </div>`;
  }
  function renderStage8() {
    const s8 = state.stage8;
    if (!s8._checked_pages) s8._checked_pages = {};
    const chk = s8._checked_pages;
    const pages = [
      { id:"p1",  label:"P1 封面 · 项目名+创意方向+主视觉" },
      { id:"p2",  label:"P2 目录 · 八大模块" },
      { id:"p3",  label:"P3 项目理解 · 需求解读" },
      { id:"p4",  label:"P4 核心策略 · 为什么选这个方向" },
      { id:"p5",  label:"P5 创意概念 · 一句话创意+情绪关键词" },
      { id:"p6",  label:"P6 故事架构 · 叙事结构+情绪曲线" },
      { id:"p7",  label:"P7-P9 分镜精选 · 关键镜头分镜图" },
      { id:"p10", label:"P10 视觉风格 · Moodboard+影调色板" },
      { id:"p11", label:"P11 美术置景 · 主场景+服化道" },
      { id:"p12", label:"P12 演员角色 · 角色设定+选角" },
      { id:"p13", label:"P13 制作排期 · 筹备-拍摄-后期" },
      { id:"p14", label:"P14 执行团队 · 主创+同类案例" },
      { id:"p15", label:"P15 结尾页 · Slogan+联系方式" },
    ];
    const allChecked = pages.every(p => chk[p.id]);
    const anyChecked = pages.some(p => chk[p.id]);
    const toggleAll = () => { const v = !allChecked; pages.forEach(p => chk[p.id] = v); save(); rerender(); };
    const toggleOne = (id) => { chk[id] = !chk[id]; save(); rerender(); };
    let listHtml = pages.map(p => {
      const c = chk[p.id] ? " checked" : "";
      return `<label class="chk pgchk" onclick="event.stopPropagation()"><input type="checkbox"${c} onchange="App._togglePage('${p.id}')">${p.label}</label>`;
    }).join("");
    const count = pages.filter(p => chk[p.id]).length;
    return `<h2>📊 环节8 · PPT 整合</h2><p class="cap">把前面所有产出按 15 页标准结构编排，导出可提报创意方案。</p>
    <div class="grid2">
      ${field("stage8.ppt_title", "封面主标题", "留空则用项目名称")}
      ${field("stage8.ppt_subtitle", "封面副标题", "留空则用「创意方向名」")}
      ${field("stage8.contact", "结尾联系方式", "公司/电话/邮箱")}
      ${field("stage8.schedule_text", "排期备注", "", "area")}
    </div>
    ${field("stage8.team_text", "执行团队 / 同类案例", "核心主创介绍 + 同类项目经验…", "area")}
    <h3>15 页结构预览 · 勾选确认已完成页面 <span style="font-weight:400;font-size:12px;color:var(--sub)">（已确认 ${count}/${pages.length} 页）</span></h3>
    <div class="card light" style="margin-bottom:4px">
      <button class="mini" onclick="App._toggleAllPages()" style="margin-bottom:8px">${allChecked ? "☐ 取消全选" : "☑ 全选所有页面"}</button>
      <div class="pglist">${listHtml}</div>
    </div>
    <h3>✅ 提报前质量自检</h3>${SELFCHECK.map(c => `<label class="chk"><input type="checkbox"> ${c}</label>`).join("")}
    <div class="export"><button class="primary" onclick="App.exportPPTX()">🚀 生成并导出 PPTX</button>
    <button onclick="App.exportJSON()">⬇️ 导出 JSON</button>
    <button onclick="App.importJSON()">⬆️ 导入 JSON</button>
    <button class="danger" onclick="App.reset()">🗑 清空重置</button>
    <span id="expmsg"></span></div>`;
  }

  function proPoints(arr) { return `<div class="card light"><b>📌 本环节专业要点</b><ul>${arr.map(a => `<li>${a}</li>`).join("")}</ul></div>`; }
  function jsonKey(s) { return s.replace(/[^一-龥A-Za-z0-9]/g, "_"); }

  // ===================== PPT 页面勾选 =====================
  function _togglePage(id) {
    if (!state.stage8._checked_pages) state.stage8._checked_pages = {};
    state.stage8._checked_pages[id] = !state.stage8._checked_pages[id];
    save(); rerender();
  }
  function _toggleAllPages() {
    if (!state.stage8._checked_pages) state.stage8._checked_pages = {};
    const chk = state.stage8._checked_pages;
    const pages = ["p1","p2","p3","p4","p5","p6","p7","p10","p11","p12","p13","p14","p15"];
    const all = pages.every(p => chk[p]);
    pages.forEach(p => chk[p] = !all);
    save(); rerender();
  }

  // ===================== 动态列表操作 =====================
  function addSeg() { state.stage3.segments.push({}); save(); rerender(); }
  function delSeg(i) { state.stage3.segments.splice(i, 1); if (!state.stage3.segments.length) state.stage3.segments.push({}); save(); rerender(); }
  function addShot() { state.stage4.shots.push({}); save(); rerender(); }
  function addBoard() { state.stage5.boards.push({}); save(); rerender(); }
  function delBoard(i) { state.stage5.boards.splice(i, 1); if (!state.stage5.boards.length) state.stage5.boards.push({}); save(); rerender(); }
  function setFullMode(v) { state._fullMode = v; save(); rerender(); }
  function buildShotsFromScript() { const segs = state.stage3.segments; state.stage4.shots = segs.map(s => ({ desc: s.visual || "", dialogue: s.voiceover || "", sound: s.sound || "", note: "参考：" + (s.reference || "") })); if (!state.stage4.shots.length) state.stage4.shots.push({}); save(); rerender(); }
  function addRef() { state.stage7.style_refs.push(""); save(); rerender(); }
  function addActor() { state.stage7.actors.push({}); save(); rerender(); }
  function delActor(i) { state.stage7.actors.splice(i, 1); save(); rerender(); }
  function addArt() { state.stage7.art_set.push({}); save(); rerender(); }
  function delArt(i) { state.stage7.art_set.splice(i, 1); save(); rerender(); }
  function addProp() { state.stage7.props.push({}); save(); rerender(); }
  function delProp(i) { state.stage7.props.splice(i, 1); save(); rerender(); }
  function onType(v) { state.meta.video_type = v; save(); rerender(); }
  function onImage(i, file) {
    if (!file) return; const r = new FileReader();
    r.onload = e => { if (!state.stage5.boards[i]) state.stage5.boards[i] = {}; state.stage5.boards[i].image_data = e.target.result; save();
      const img = document.querySelectorAll(".card img")[i]; if (img) img.src = e.target.result; };
    r.readAsDataURL(file);
  }

  // ===================== PPTX 导出（pptxgenjs）=====================
  function exportPPTX() {
    if (typeof PptxGenJS === "undefined") { setMsg("PPTX 库未加载，请用浏览器打开本文件"); return; }
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    const A = state.meta.accent_color || "#C8102E";
    const FONT = "Microsoft YaHei";
    const add = (s, t, o) => { o = o || {}; o.fontFace = FONT; s.addText(t, o); };
    const rect = (s, x, y, w, h, c) => s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: hex(c) }, line: { width: 0 } });
    const topbar = (s, t) => { rect(s, 0, 0, 13.333, 1.15, A); add(s, t, { x: 0.6, y: 0.18, w: 12.1, h: 0.8, fontSize: 26, bold: true, color: "FFFFFF" }); };
    const footer = (s, n) => { add(s, state.meta.project_name + "  ·  创意提报方案", { x: 0.6, y: 7.05, w: 9, h: 0.35, fontSize: 9, color: "9AA0A6" }); add(s, String(n), { x: 11.8, y: 7.05, w: 1, h: 0.35, fontSize: 9, color: "9AA0A6", align: "right" }); };
    const bullet = (s, x, y, w, h, items, size) => {
      const tb = s.addText(items.map(it => ({ text: it, options: { bullet: { code: "25AA" }, color: "3C4043", fontSize: size || 14, breakLine: true, paraSpaceAfter: 8 } })), { x, y, w, h, fontFace: FONT, color: "3C4043" });
      return tb;
    };

    // P1 封面
    let s = pptx.addSlide(); rect(s, 0, 0, 13.333, 7.5, A); rect(s, 0, 5.3, 13.333, 0.06, "FFFFFF");
    const d = chosenDir();
    const ptitle = state.stage8.ppt_title || state.meta.project_name || "商业视频创意方案";
    const psub = state.stage8.ppt_subtitle || (d.name ? "创意方向 · 「" + d.name + "」" : "创意提报方案");
    add(s, ptitle, { x: 0.9, y: 1.6, w: 11.5, h: 1, fontSize: 40, bold: true, color: "FFFFFF" });
    add(s, psub, { x: 0.9, y: 2.9, w: 11.5, h: 0.8, fontSize: 22, color: "F1F3F4" });
    add(s, `客户：${state.meta.client || ""}  ｜  类型：${state.meta.video_type}  ｜  时长：${state.meta.duration}  ｜  画幅：${state.meta.aspect_ratio}`, { x: 0.9, y: 5.6, w: 11.5, h: 0.6, fontSize: 13, color: "E8EAED" });

    // P2 目录
    s = pptx.addSlide(); topbar(s, "目录 · CONTENTS");
    const toc = [["01", "项目理解", "我们对需求的解读"], ["02", "核心策略", "为什么选这个方向"], ["03", "创意概念", "一句话创意与情绪关键词"], ["04", "故事架构", "叙事结构与情绪曲线"], ["05", "分镜精选", "关键镜头分镜图与说明"], ["06", "视觉风格", "Moodboard 与影调色板"], ["07", "美术置景", "主场景与服化道总览"], ["08", "演员角色", "角色设定与选角方向"], ["09", "制作排期", "筹备-拍摄-后期时间线"], ["10", "执行团队", "主创介绍与同类案例"]];
    toc.forEach((it, i) => { const col = i % 2, row = Math.floor(i / 2); const x = 0.9 + col * 5.9, y = 1.6 + row * 0.95; add(s, it[0], { x, y, w: 1, h: 0.8, fontSize: 30, bold: true, color: A }); add(s, [[{ text: it[1], options: { fontSize: 16, bold: true, color: "202124" } }], [{ text: it[2], options: { fontSize: 11, color: "80868B" } }]], { x: x + 1, y: y + 0.05, w: 4.9, h: 0.8 }); });
    footer(s, 2);

    // P3 项目理解
    s = pptx.addSlide(); topbar(s, "01 · 项目理解");
    const b = state.stage1.brd || {};
    bullet(s, 0.9, 1.6, 11.5, 5, [["项目定位", b.positioning || "（待补充）"], ["核心目标", b.core_goal || "（待补充）"], ["目标受众", b.audience || "（待补充）"], ["必传信息", b.must_info || "（待补充）"], ["风格倾向", b.style || "（待补充）"], ["约束条件", b.constraints || "（待补充）"], ["隐性需求（推断）", b.hidden || "（待补充）"]], 15);
    footer(s, 3);

    // P4 核心策略
    s = pptx.addSlide(); topbar(s, "02 · 核心策略");
    const d4 = chosenDir();
    add(s, "为什么选「" + (d4.name || "该方向") + "」这个方向", { x: 0.9, y: 1.5, w: 11.5, h: 0.5, fontSize: 18, bold: true, color: A });
    bullet(s, 0.9, 2.2, 11.5, 4.5, [["一句话创意", d4.logline || "（待补充）"], ["适配理由", d4.rationale || "（待补充）"], ["目标受众契合", (state.stage1.brd || {}).audience || "（待补充）"], ["策略推导", "从“受众-渠道双约束”出发：本片投放在「" + (state.meta.channel || "渠道") + "」，受众为「" + ((state.stage1.brd || {}).audience || "目标人群") + "」，因此采用该叙事结构与视觉调性以最大化转化。"]], 15);
    footer(s, 4);

    // P5 创意概念
    s = pptx.addSlide(); topbar(s, "03 · 创意概念");
    add(s, [[{ text: "一句话创意  ", options: { fontSize: 14, bold: true, color: "80868B" } }, { text: d4.logline || "（待补充）", options: { fontSize: 24, bold: true, color: A } }]], { x: 0.9, y: 1.5, w: 11.5, h: 1.2 });
    bullet(s, 0.9, 3.0, 11.5, 3.5, [["核心概念阐述", d4.narrative || "（待补充）"], ["视觉调性", d4.visual_tone || "（待补充）"], ["情绪曲线", d4.emotion_curve || "（待补充）"]], 15);
    footer(s, 5);

    // P6 故事架构
    s = pptx.addSlide(); topbar(s, "04 · 故事架构");
    const segs = state.stage3.segments;
    if (!segs.length) add(s, "（待补充：请在环节3完成创意脚本）", { x: 0.9, y: 1.6, w: 11.5, h: 4.5, fontSize: 16, color: "80868B" });
    else { let y = 1.6; segs.forEach((seg, i) => { add(s, "段落" + (i + 1), { x: 0.9, y, w: 1.4, h: 0.7, fontSize: 16, bold: true, color: A }); add(s, [[{ text: (seg.time || "") + "  ", options: { fontSize: 12, bold: true, color: "80868B" } }, { text: seg.visual || "（待补充）", options: { fontSize: 14, color: "202124" } }], [{ text: "旁白：" + (seg.voiceover || ""), options: { fontSize: 12, color: "5F6368" } }]], { x: 2.3, y, w: 10.1, h: 0.7 }); y += 0.95; }); }
    footer(s, 6);

    // P7-P9 分镜精选
    const boards = state.stage5.boards, shots = state.stage4.shots;
    const chunks = []; for (let i = 0; i < Math.min(boards.length, 9); i += 3) chunks.push(boards.slice(i, i + 3));
    if (!chunks.length) chunks.push([]);
    let pg = 7;
    chunks.forEach((chunk, ci) => {
      const sl = pptx.addSlide(); topbar(sl, `05 · 分镜精选（${ci + 1}/${chunks.length}）`);
      chunk.forEach((bd, j) => {
        const gi = ci * 3 + j, sh = shots[gi] || {}; const x = 0.9 + j * 4.25, y = 1.5;
        if (bd && bd.image_data) { try { sl.addImage({ data: bd.image_data, x, y, w: 3.9 }); } catch (e) { rect(sl, x, y, 3.9, 2.6, "ECEFF1"); } }
        else rect(sl, x, y, 3.9, 2.6, "ECEFF1");
        const cap = `镜${gi + 1} · ${sh.shot_size || ""} · ${sh.movement || ""}\n${sh.desc || "（待补充画面描述）"}`;
        add(sl, cap, { x, y: y + 2.75, w: 3.9, h: 2.4, fontSize: 12, color: "3C4043" });
      });
      footer(sl, pg); pg++;
    });
    while (pg <= 9) { const sl = pptx.addSlide(); topbar(sl, `05 · 分镜精选（${pg - 6}/3）`); add(sl, "（更多镜头见文字分镜表 / 动态分镜）", { x: 0.9, y: 3, w: 11.5, h: 1, fontSize: 14, color: "80868B" }); footer(sl, pg); pg++; }

    // P10 视觉风格
    s = pptx.addSlide(); topbar(s, "06 · 视觉风格");
    const mb = state.stage7.moodboard || {};
    bullet(s, 0.9, 1.6, 7.0, 5, [["主色板", mb.color_palette || "（待补充）"], ["光影风格", mb.light_style || "（待补充）"], ["影调关键词", mb.tone_keywords || "（待补充）"], ["参考片推荐", mb.ref_films || "（待补充）"], ["摄影质感", mb.photo_texture || "（待补充）"]], 14);
    add(s, "风格参考片", { x: 8.3, y: 1.6, w: 4.2, h: 0.5, fontSize: 15, bold: true, color: A });
    const refs = state.stage7.style_refs.filter(r => r).map(r => ({ text: r, options: { bullet: { code: "25AA" }, fontSize: 12, color: "3C4043", breakLine: true, paraSpaceAfter: 6 } }));
    if (refs.length) s.addText(refs, { x: 8.3, y: 2.1, w: 4.2, h: 4, fontFace: FONT }); else add(s, "（待补充）", { x: 8.3, y: 2.1, w: 4.2, h: 1, fontSize: 13, color: "80868B" });
    footer(s, 10);

    // P11 美术置景
    s = pptx.addSlide(); topbar(s, "07 · 美术置景");
    let y = 1.6;
    add(s, "主场景概念", { x: 0.9, y, w: 11.5, h: 0.5, fontSize: 16, bold: true, color: A }); y += 0.55;
    if (state.stage7.art_set.length) state.stage7.art_set.forEach(sc => { bullet(s, 0.9, y, 11.5, 0.9, [[sc.name || "（场景）", `  空间：${sc.space || ""} ｜ 色调光线：${sc.tone || ""} ｜ 预算：${sc.budget || ""}`]], 13); y += 0.95; });
    else { add(s, "（待补充）", { x: 0.9, y, w: 11.5, h: 0.5, fontSize: 13, color: "80868B" }); y += 0.6; }
    y += 0.3; add(s, "核心道具", { x: 0.9, y, w: 11.5, h: 0.5, fontSize: 16, bold: true, color: A }); y += 0.55;
    if (state.stage7.props.length) state.stage7.props.forEach(p => { bullet(s, 0.9, y, 11.5, 0.8, [[p.name || "（道具）", `  意义：${p.meaning || ""} ｜ 筹备：${p.prep || ""}`]], 13); y += 0.85; });
    else add(s, "（待补充）", { x: 0.9, y, w: 11.5, h: 0.5, fontSize: 13, color: "80868B" });
    footer(s, 11);

    // P12 演员与角色
    s = pptx.addSlide(); topbar(s, "08 · 演员与角色");
    if (!state.stage7.actors.length) add(s, "（待补充：请在环节7填写角色设定）", { x: 0.9, y: 1.6, w: 11.5, h: 4.5, fontSize: 16, color: "80868B" });
    else { let yy = 1.5; state.stage7.actors.forEach(a => { add(s, a.name || "（角色）", { x: 0.9, y: yy, w: 11.5, h: 0.5, fontSize: 16, bold: true, color: A }); yy += 0.5; bullet(s, 0.9, yy, 11.5, 1.6, [["外形", a.look || "（待补充）"], ["演员参考", a.actor_ref || "（待补充）"], ["服装", a.wardrobe || "（待补充）"], ["妆发", a.makeup || "（待补充）"]], 12); yy += 1.9; }); }
    footer(s, 12);

    // P13 制作排期
    s = pptx.addSlide(); topbar(s, "09 · 制作排期");
    const phases = [["筹备期", "需求确认/创意定稿/分镜与动态分镜/选角置景/服化道筹备", "第1-2周"], ["拍摄期", "主场景拍摄/补拍/素材整理", "第3周"], ["后期期", "剪辑/调色/配音配乐/特效/成片交付", "第4-5周"]];
    phases.forEach((ph, i) => { const x = 0.9 + i * 4.1; rect(s, x, 1.7, 3.7, 0.7, A); add(s, ph[0], { x, y: 1.7, w: 3.7, h: 0.7, fontSize: 18, bold: true, color: "FFFFFF", align: "center" }); add(s, ph[1], { x, y: 2.6, w: 3.7, h: 2.6, fontSize: 13, color: "3C4043" }); add(s, ph[2], { x, y: 5.3, w: 3.7, h: 0.5, fontSize: 13, bold: true, color: A, align: "center" }); });
    if (state.stage8.schedule_text) add(s, "备注：" + state.stage8.schedule_text, { x: 0.9, y: 6.0, w: 11.5, h: 0.8, fontSize: 12, color: "5F6368" });
    footer(s, 13);

    // P14 执行团队
    s = pptx.addSlide(); topbar(s, "10 · 执行团队");
    add(s, state.stage8.team_text || "（请在 PPT 整合页填写主创介绍与同类案例）", { x: 0.9, y: 1.6, w: 11.5, h: 4.5, fontSize: 14, color: "3C4043" });
    footer(s, 14);

    // P15 结尾
    s = pptx.addSlide(); rect(s, 0, 0, 13.333, 7.5, A);
    const slogan = (chosenDir().logline) || "让创意，成为生意。";
    add(s, slogan, { x: 0.9, y: 2.6, w: 11.5, h: 1.5, fontSize: 34, bold: true, color: "FFFFFF" });
    if (state.stage8.contact) add(s, state.stage8.contact, { x: 0.9, y: 4.3, w: 11.5, h: 0.8, fontSize: 16, color: "F1F3F4" });
    add(s, state.meta.project_name || "商业视频创意方案", { x: 0.9, y: 6.4, w: 11.5, h: 0.5, fontSize: 12, color: "E8EAED" });

    const name = (state.meta.project_name || "创意方案").replace(/\s+/g, "_");
    pptx.writeFile({ fileName: name + "_创意提报方案.pptx" }).then(() => setMsg("✅ 已生成并下载 PPTX")).catch(e => setMsg("生成失败：" + e));
  }

  function setMsg(m) { const el = document.getElementById("expmsg"); if (el) el.textContent = m; }

  // ===================== JSON 备份 =====================
  function exportJSON() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "video_project.json"; a.click(); setMsg("⬇️ 已导出 JSON"); }
  function importJSON() { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json"; inp.onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { try { const d = JSON.parse(ev.target.result); Object.assign(state, d); save(); rerender(); setMsg("✅ 已导入"); } catch (err) { setMsg("导入失败：" + err); } }; r.readAsText(f); }; inp.click(); }
  function reset() { if (confirm("确定清空所有内容？")) { state = defaultState(); save(); current = "project"; rerender(); } }

  // ===================== 导出全案 / 复制提示词（v2.01 交付能力）=====================
  function _expKV(rows) {
    const f = rows.filter(r => r[1] != null && String(r[1]).trim() !== "");
    if (!f.length) return '<p class="muted">（未填写）</p>';
    return '<table class="ex">' + f.map(r => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("") + '</table>';
  }
  function expStage1Html() {
    const b = state.stage1.brd || {};
    let h = `<p class="raw">${esc(state.stage1.raw_need || "（未填写客户原始需求）")}</p>`;
    const atts = state.stage1.attachments || [];
    if (atts.length) {
      h += '<div class="atts" style="margin:8px 0"><b>📎 原始需求附件（' + atts.length + ' 个）：</b>' + atts.map(a => {
        const isImg = (a.type || '').startsWith('image/');
        const inner = isImg ? `<img src="${a.dataUrl}" style="max-width:160px;max-height:120px;border-radius:6px;display:block;margin:4px 0">` : `📄 ${esc(a.name)}（${esc(a.type || '文件')}）`;
        return `<div class="att" style="margin:6px 0">${inner}<br><a href="${a.dataUrl}" download="${esc(a.name)}">⬇ ${esc(a.name)}</a></div>`;
      }).join('') + '</div>';
    }
    h += _expKV([["项目定位", b.positioning],["核心目标", b.core_goal],["目标受众", b.audience],["必传信息", b.must_info],["风格倾向", b.style],["约束条件", b.constraints],["隐性需求推断", b.hidden]]);
    return h;
  }
  function expStage2Html() {
    const dirs = state.stage2.directions || [];
    const chosen = state.stage2.chosen || 0;
    if (!dirs.length) return '<p class="muted">（未填写创意方向）</p>';
    return dirs.map((d, i) => {
      const extra = Object.keys(d).filter(k => k !== "name")
        .map(k => `<div class="kv"><b>${esc(k)}：</b>${esc(d[k])}</div>`).join("");
      return `<div class="dir${i === chosen ? " chosen" : ""}"><b>方向 ${i + 1}：${esc(d.name || "未命名")}</b>${i === chosen ? ' <span class="tag">已选定</span>' : ""}${extra}</div>`;
    }).join("");
  }
  function expStage3Html() {
    const segs = state.stage3.segments || [];
    if (!segs.length) return '<p class="muted">（未填写脚本段落）</p>';
    return segs.map((s, i) => `<div class="seg"><b>段落 ${i + 1} ${s.time ? "· " + esc(s.time) : ""}</b>${_expKV([["场景", s.scene],["画面", s.visual],["旁白/台词", s.voiceover],["声音设计", s.sound],["参考片", s.reference]])}</div>`).join("");
  }
  function expStage4Html() {
    const shots = state.stage4.shots || [];
    if (!shots.length) return '<p class="muted">（未填写分镜表）</p>';
    const head = "<tr><th>镜号</th><th>景别</th><th>运镜</th><th>画面描述</th><th>旁白/台词</th><th>时长</th><th>音效/音乐</th><th>备注</th></tr>";
    const rows = shots.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.shot_size || "")}</td><td>${esc(s.movement || "")}</td><td>${esc(s.desc || "")}</td><td>${esc(s.dialogue || "")}</td><td>${esc(s.duration || 0)}</td><td>${esc(s.sound || "")}</td><td>${esc(s.note || "")}</td></tr>`).join("");
    return '<table class="shot"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
  }
  function expStage5Html() {
    const l = state.stage5.style_lock || {};
    const labels = { char: "人物设定", scene: "主场景设定", style: "整体视觉风格", tone: "影调" };
    let h = '<div class="locks">';
    ["char", "scene", "style", "tone"].forEach(k => {
      const img = l[k + "_img"] || "";
      h += `<div class="lock"><b>${labels[k]}</b>${img ? `<img src="${img}" alt="${labels[k]}">` : ""}<div class="kv">${esc(l[k] || "（未填写）")}</div></div>`;
    });
    h += '</div>';
    const boards = state.stage5.boards || [];
    if (boards.length) {
      h += '<h4>逐镜分镜图</h4>';
      h += boards.map((b, i) => {
        const img = b.image_data || "";
        const ov = [b.shot_size_override, b.movement_override, b.desc_override].filter(Boolean).join(" / ");
        return `<div class="board"><b>镜 ${i + 1}</b>${img ? `<img src="${img}" alt="镜 ${i + 1}">` : ""}<div class="kv">${esc(ov || b.gen_prompt || "（未生成）")}</div></div>`;
      }).join("");
    }
    return h;
  }
  function expStage6Html() {
    const s = state.stage6;
    return _expKV([["剪辑时序/时间线", s.timeline],["Ken Burns 效果", s.kb_effects],["转场方案", s.transitions],["声音设计", s.sound_design],["节奏校验点", s.beat_points],["初剪自检清单", s.checklist]]);
  }
  function expStage7Html() {
    const s7 = state.stage7;
    let h = _expKV([["情绪基调", s7.mood],["影片年代/背景", s7.era]]);
    const refs = (s7.style_refs || []).filter(r => r);
    if (refs.length) h += '<div class="kv"><b>参考片：</b>' + refs.map(r => esc(r)).join("；") + '</div>';
    const block = (title, arr, keys) => {
      if (!arr || !arr.length) return "";
      return `<h4>${title}</h4>` + arr.map(o => `<div class="kv">${keys.map(k => o[k] ? `<b>${esc(k)}：</b>${esc(o[k])} ` : "").join("")}</div>`).join("");
    };
    h += block("角色设定", s7.actors, ["name", "age", "job", "trait", "look", "actor_ref", "costume", "makeup"]);
    h += block("核心场景", s7.art_set, ["name", "func", "space", "tone", "set_ref", "budget"]);
    h += block("关键道具", s7.props, ["name", "scene", "meaning", "look", "prepare"]);
    return h;
  }
  function expStage8Html() {
    const s = state.stage8;
    let h = _expKV([["PPT 主标题", s.ppt_title],["PPT 副标题", s.ppt_subtitle],["联系方式", s.contact],["排期说明", s.schedule_text],["团队说明", s.team_text]]);
    const chk = s._checked_pages || {};
    const ids = Object.keys(chk).filter(k => chk[k]);
    if (ids.length) h += '<div class="kv"><b>已确认页面：</b>' + ids.join("、") + '</div>';
    return h;
  }
  function exportPlan() {
    const m = state.meta;
    const A = m.accent_color || "#C8102E";
    const now = new Date().toLocaleString("zh-CN");
    const secs = [
      [1, "需求提炼", expStage1Html()], [2, "创意策划", expStage2Html()], [3, "创意脚本", expStage3Html()],
      [4, "文字分镜", expStage4Html()], [5, "分镜图", expStage5Html()], [6, "动态分镜", expStage6Html()],
      [7, "提报资料", expStage7Html()], [8, "PPT 整合", expStage8Html()],
    ];
    let body = "";
    secs.forEach(([n, t, html]) => {
      body += `<section><h2><span class="num" style="background:${A}">${n}</span>${esc(t)}</h2>${html}<div class="prompt"><div class="prompt-bar"><span>🤖 本环节 AI 提示词</span></div><pre>${esc(stagePrompt(n))}</pre></div></section>`;
    });
    const meta = `<span>客户/品牌：${esc(m.client || "—")}</span><span>类型：${esc(m.video_type)}</span><span>时长：${esc(m.duration || "—")}</span><span>画幅：${esc(m.aspect_ratio)}</span><span>渠道：${esc(m.channel || "—")}</span><span>受众：${esc(m.audience || "—")}</span>`;
    const doc = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.project_name || "商业视频创意方案")} · 全案</title><style>
*{box-sizing:border-box} body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#1f2733;margin:0;background:#fff;line-height:1.6}
.bar{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 20px;display:flex;gap:14px;align-items:center}
.bar button{background:${A};color:#fff;border:0;padding:8px 16px;border-radius:8px;font-size:14px;cursor:pointer}
.bar span{color:#667085;font-size:13px}
header{padding:28px 28px 18px;border-bottom:3px solid ${A};margin:0 0 8px}
header h1{margin:0 0 10px;font-size:26px}
.meta{display:flex;flex-wrap:wrap;gap:6px 18px;color:#475467;font-size:13px}
section{padding:18px 28px;border-bottom:1px solid #f0f0f0}
section h2{font-size:19px;margin:0 0 12px;display:flex;align-items:center;gap:10px}
.num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;color:#fff;font-size:14px;font-weight:700}
.raw{background:#f7f8fa;border-left:3px solid ${A};padding:10px 12px;white-space:pre-wrap;font-size:13px;color:#344054}
table{border-collapse:collapse;width:100%;margin:8px 0;font-size:13px}
table.ex th,table.ex td{border:1px solid #e5e7eb;padding:7px 10px;text-align:left;vertical-align:top}
table.ex th{background:#f7f8fa;width:120px;font-weight:600;white-space:nowrap}
table.shot th,table.shot td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left;vertical-align:top;font-size:12px}
table.shot{table-layout:fixed}
.kv{margin:4px 0;font-size:13px}
.kv b{color:#344054}
.muted{color:#98a2b3;font-style:italic;font-size:13px}
.dir,.seg{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin:8px 0}
.dir.chosen{border-color:${A};background:#fff7f8}
.tag{background:${A};color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:6px}
.locks{display:flex;flex-wrap:wrap;gap:12px}
.lock{flex:1 1 220px;border:1px solid #e5e7eb;border-radius:8px;padding:10px}
.lock img,.board img{max-width:100%;border-radius:6px;margin:6px 0;display:block}
.board{border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin:8px 0}
.prompt{margin-top:14px;background:#fbfbfd;border:1px solid #eceef1;border-radius:8px;overflow:hidden}
.prompt-bar{background:#f1f3f5;padding:6px 12px;font-size:13px;font-weight:600;color:#344054}
.prompt pre{margin:0;padding:12px;white-space:pre-wrap;word-break:break-word;font-size:12.5px;color:#1f2733}
footer{padding:16px 28px;color:#98a2b3;font-size:12px}
@media print{.bar{display:none}section{page-break-inside:avoid}}
</style></head><body>
<div class="bar no-print"><button onclick="window.print()">🖨️ 打印 / 存为 PDF</button><span>由 VIDEO工作流 导出 · ${esc(now)}</span></div>
<header><h1>${esc(m.project_name || "未命名项目")} · 全案创意方案</h1><div class="meta">${meta}</div></header>
${body}
<footer>本方案由「VIDEO工作流」v${APP_VERSION} 一键导出 · 导出时间 ${esc(now)}</footer>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { setMsg("⚠️ 浏览器拦截了新窗口，请允许弹出窗口后重试"); return; }
    w.document.open(); w.document.write(doc); w.document.close();
    setMsg("📤 已生成全案文档（新标签页，可打印/存为 PDF）");
  }
  function copyAllPrompts() {
    const names = { 1:"需求提炼", 2:"创意策划", 3:"创意脚本", 4:"文字分镜", 5:"分镜图", 6:"动态分镜", 7:"提报资料", 8:"PPT 整合" };
    let txt = "【VIDEO工作流 v" + APP_VERSION + " · 全案 AI 提示词包】\n项目：" + (state.meta.project_name || "未命名") + "\n";
    for (let n = 1; n <= 8; n++) txt += "\n================ 环节" + n + " · " + names[n] + " ================\n" + stagePrompt(n) + "\n";
    navigator.clipboard.writeText(txt).then(() => setMsg("📋 已复制全案 8 环节提示词到剪贴板")).catch(() => setMsg("复制失败，请手动选择"));
  }

  // ===================== 项目库（服务器端） =====================
  const API_BASE2 = '/api';
  async function apiFetch(url, opts) {
    try {
      const r = await fetch(API_BASE2 + url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}));
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || r.statusText); }
      return await r.json();
    } catch (e) { setMsg('服务器连接失败: ' + e.message); throw e; }
  }
  // ---- 本机多项目库（localStorage，纯静态可用）----
  function _projList() { try { const a = JSON.parse(localStorage.getItem(LS_PROJECTS) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function _projSave(list) {
    try { localStorage.setItem(LS_PROJECTS, JSON.stringify(list)); return true; }
    catch (e) { setMsg("⚠️ 项目库保存失败：浏览器本地存储已满，请删除部分项目或清理缓存后重试"); return false; }
  }
  // 仅持久化项目内容，剔除运行时大对象（案例库缓存 _cases 等），避免 localStorage 配额溢出导致保存静默失败
  function _snapshot() { const snap = JSON.parse(JSON.stringify(state)); delete snap._cases; delete snap._fullMode; return snap; }
  async function saveProject() {
    const name = (state.meta.project_name || "").trim() || "未命名项目";
    const data = _snapshot();
    const list = _projList();
    if (state._projectId) {
      const i = list.findIndex(p => p.id === state._projectId);
      if (i >= 0) { list[i].name = name; list[i].client = state.meta.client || ""; list[i].video_type = state.meta.video_type; list[i].updated = new Date().toLocaleString("zh-CN"); list[i].data = data; if (_projSave(list)) setMsg("✅ 已更新项目：「" + name + "」（本机项目库）"); return; }
    }
    const id = "p_" + Date.now().toString(36);
    state._projectId = id;
    list.unshift({ id, name, client: state.meta.client || "", video_type: state.meta.video_type, updated: new Date().toLocaleString("zh-CN"), data });
    if (_projSave(list)) { save(); setMsg("✅ 已保存项目：「" + name + "」（本机项目库，共 " + list.length + " 个）"); }
  }
  async function newProject() {
    if (!confirm('新建空白项目？当前未保存的内容将被清空，已保存的项目库不受影响。')) return;
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    location.reload();
  }
  async function loadProject() {
    const list = _projList();
    if (!list.length) { setMsg("📂 本机项目库暂无项目，请先点「💾 保存为项目」"); return; }
    let html = '<div style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="margin:0">📂 本机项目库（' + list.length + ' 个）</h3><button class="btn" onclick="App.go(\'project\')">关闭</button></div>'
      + '<p class="cap" style="margin:0 0 14px">项目保存在本浏览器（localStorage），换设备 / 清缓存会丢失；重要项目请用「⬇️ 导出 JSON」备份。</p>';
    list.forEach(p => {
      html += '<div style="background:#141a22;border:1px solid #2a3340;border-radius:10px;padding:12px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px">'
        + '<div style="min-width:0"><b style="color:#fff">' + esc(p.name) + '</b><br><span class="cap">' + (p.client || '') + ' · ' + (p.video_type || '') + ' · ' + (p.updated || '') + '</span></div>'
        + '<div style="flex:0 0 auto"><button class="btn primary" style="margin-right:8px" onclick="App._loadOne(\'' + p.id + '\')">载入</button>'
        + '<button class="btn" onclick="App._delOne(\'' + p.id + '\')">删除</button></div></div>';
    });
    html += '</div>';
    document.getElementById('main').innerHTML = html;
  }
  async function _loadOne(id) {
    const list = _projList();
    const p = list.find(x => x.id === id);
    if (!p || !p.data || !p.data.meta) { setMsg("项目数据无效"); return; }
    state = JSON.parse(JSON.stringify(p.data));
    // 兜底：补齐缺失的环节壳，避免旧版 / 部分项目导致渲染崩溃
    const dft = defaultState();
    if (!state.meta) state.meta = dft.meta;
    ["stage1", "stage2", "stage3", "stage4", "stage5", "stage6", "stage7", "stage8"].forEach(k => { if (!state[k]) state[k] = dft[k]; });
    state._projectId = id; save(); current = 'project'; rerender();
    setMsg('✅ 已载入项目：「' + (p.name || '') + '」');
  }
  async function _delOne(id) {
    if (!confirm('确定删除该项目？此操作不可恢复。')) return;
    const list = _projList().filter(p => p.id !== id);
    if (_projSave(list)) {
      if (state._projectId === id) { delete state._projectId; save(); }
      loadProject();
    }
  }
  // ===================== 主渲染 =====================
  // ===================== 完整工作流（与分段工作流区分）=====================
  function stagePrompt(n) {
    try {
      if (n === 1) return promptStage1();
      if (n === 2) return promptStage2();
      if (n === 3) return promptStage3();
      if (n === 4) return promptStage4();
      if (n === 5) return "【分镜图 · 一致性控制】\n" + promptStage5Lock();
      if (n === 6) return promptStage6();
      if (n === 7) return "【影调】\n" + promptStage7Mood() + "\n\n【角色与服化道】\n" + promptStage7Char();
      if (n === 8) return "（PPT 整合环节：将前 7 环节全部产出按 15 页标准结构编排并导出 PPTX，无单独提示词；直接打开「环节8 · PPT 整合」点「导出 PPTX」即可。）";
    } catch (e) { return "（暂无可生成提示词）"; }
    return "";
  }
  function runFull() { state._fullMode = true; save(); setMsg("🚀 已开启完整工作流：请按 环节1→8 顺序推进，前一环节产出将带入后一环节"); go("stage1"); }
  function toggleAllPrompts() { state._showAllPrompts = !state._showAllPrompts; save(); rerender(); }
  function renderFull() {
    const flow = [
      { n: 1, t: "需求提炼", in: "客户原话 / 会议纪要", out: "《需求简报 BRD》" },
      { n: 2, t: "创意策划", in: "BRD + 影片类型差异化参数", out: "3 套创意方向（选定 1 套）" },
      { n: 3, t: "创意脚本", in: "选定创意方向", out: "文学脚本 + 参考片清单" },
      { n: 4, t: "文字分镜", in: "创意脚本段落", out: "八列分镜表" },
      { n: 5, t: "分镜图", in: "文字分镜（镜头）", out: "故事板 + 一致性锁定" },
      { n: 6, t: "动态分镜", in: "分镜图 + 时长", out: "Animatic 节奏校验" },
      { n: 7, t: "提报资料", in: "前序所有产出", out: "影调/风格/美术/服化道七大模块" },
      { n: 8, t: "PPT 整合", in: "全部环节产出", out: "15 页可提报创意方案" },
    ];
    const pipe = flow.map(f => `<div class="flow-node"><div class="fn-h">环节 ${f.n} · ${f.t}</div>
      <div class="fn-io"><span class="fn-in">输入：${f.in}</span><span class="fn-out">产出：${f.out}</span></div></div>${f.n < 8 ? '<div class="flow-arrow">↓</div>' : ''}`).join("");
    let html = `<h2>🧭 完整工作流</h2>
      <p class="cap">完整工作流 = 8 大环节<b>顺序推进</b>，前一环节产出自动带入后一环节，终态输出 15 页可提报创意方案（PPTX）。适合从 0 到 1 完整交付一个项目。</p>
      <div class="pro-card">📌 <b>与「分段工作流」的区别：</b>分段工作流把每个环节当作<b>独立工具</b>使用（例如单独打开「创意脚本」写一版文学脚本），不要求跑完前面环节；完整工作流则强调<b>环节间的串联与因果</b>——这一步的产出是下一步的输入。</div>
      <div style="margin:14px 0;display:flex;gap:10px;flex-wrap:wrap">
        <button class="primary" onclick="App.runFull()">🚀 从头运行完整工作流</button>
        <button onclick="App.toggleAllPrompts()">${state._showAllPrompts ? "收起全部提示词" : "📋 生成全部 8 环节 AI 提示词"}</button>
      </div>
      <h3>全流程链路（输入 → 产出）</h3>
      <div class="flow-pipe">${pipe}</div>`;
    if (state._showAllPrompts) {
      const names = { 1:"需求提炼", 2:"创意策划", 3:"创意脚本", 4:"文字分镜", 5:"分镜图", 6:"动态分镜", 7:"提报资料", 8:"PPT 整合" };
      html += '<h3>全部环节 AI 提示词（逐一复制给大模型）</h3>';
      for (let n = 1; n <= 8; n++) {
        html += `<div class="card"><h4>环节${n} · ${names[n]}</h4>${promptBlock("🤖 提示词", stagePrompt(n))}</div>`;
      }
    }
    return html;
  }

  // ===================== 案例库 =====================
  function caseCard(c, score) {
    return `<div class="case-card">
      <span class="cc-type ${c.type}">${c.type}</span>
      ${score != null ? `<span style="display:inline-block;background:#6B2FBF;color:#fff;font-size:11px;padding:2px 7px;border-radius:10px;margin-left:6px;vertical-align:middle">相似度 ${score}</span>` : ""}
      <h4>${esc(c.title)}</h4>
      <span class="cc-brand">${esc(c.brand)} · ${esc(c.country)}</span>
      <div class="cc-desc">${esc(c.desc)}</div>
      <div class="cc-meta">
        <span>📐 ${esc(c.industry)}</span>
        <span>📅 ${c.year}</span>
        ${c.director && c.director !== "—" ? `<span>🎬 ${esc(c.director)}</span>` : ""}
      </div>
      <div class="cc-foot">
        <span class="cc-src">来源 · ${esc(c.source)}</span>
        <a class="cc-watch" href="${esc(c.ref)}" target="_blank" rel="noopener">▶ 观看视频</a>
      </div>
      <div class="cc-link" title="${esc(c.ref)}"><span>🔗</span><a href="${esc(c.ref)}" target="_blank" rel="noopener">${esc(shortUrl(c.ref))}</a></div>
    </div>`;
  }

  function renderCaseLib() {
    const filter = state._caseFilter || { type:"全部", industry:"全部", year:"全部", search:"" };
    const cases = state._cases || [];
    const TYPES = ["全部","广告片","企业宣传片","微电影","产品宣传片","短视频","口播","AI漫剧"];
    const INDUSTRIES = ["全部","科技数码","汽车","食品饮料","服装时尚","互联网","体育用品","日化美妆","餐饮","家居","家电","教育","游戏娱乐","珠宝","航空旅游","金融保险","零售","公益"];
    const YEARS = ["全部","2026","2025","2024","2023","2022"];
    const THRS = [["不限",0],["≥0.3",0.3],["≥0.4",0.4],["≥0.5",0.5],["≥0.6",0.6]];
    const KS = [8,12,16,20];
    if (state._semThreshold === undefined) state._semThreshold = 0;
    if (state._semTopk === undefined) state._semTopk = 12;

    const setFilter = (k, v) => { if (!state._caseFilter) state._caseFilter = {}; state._caseFilter[k] = v; save(); rerender(); };
    const sel = (k) => `onchange="App._setCaseFilter('${k}',this.value)"`;

    // 模式切换条
    const semantic = !!state._semantic;
    const toggleBar = `<div style="display:flex;gap:8px;margin:6px 0 12px;align-items:center;flex-wrap:wrap">
      <button onclick="App._setSemantic(false)" style="padding:6px 14px;border:1px solid #d0d5dd;border-radius:8px;cursor:pointer;background:${!semantic?'#C8102E':'#fff'};color:${!semantic?'#fff':'#344054'};font-weight:600">🔍 本地筛选</button>
      <button onclick="App._setSemantic(true)" style="padding:6px 14px;border:1px solid #d0d5dd;border-radius:8px;cursor:pointer;background:${semantic?'#6B2FBF':'#fff'};color:${semantic?'#fff':'#344054'};font-weight:600">🧠 语义检索（RAG）</button>
      <span style="color:#667085;font-size:12px">${semantic?'后端向量检索 · 一句话找片':'本地关键词 + 分类筛选'}</span>
    </div>`;

    // —— 语义检索模式 ——
    if (semantic) {
      const res = state._semResults; // null=未检索, []=无结果, [..]=结果
      let resHtml;
      if (res === null || res === undefined) {
        resHtml = `<div class="cap">输入一句话描述你想要的视频（例如：科技产品发布会开场、温情节日团聚、运动品牌逆袭励志），点「语义检索」即可按语义相似度匹配真实案例。可叠加类型/行业/时间元数据过滤。</div>`;
      } else if (res.length === 0) {
        resHtml = `<div class="cap">未找到相关案例，换个描述或放宽筛选条件试试。</div>`;
      } else {
        resHtml = `<div class="case-grid">${res.map(c => caseCard(c, c._score)).join("")}</div>`;
      }
      return `<h2>📚 案例库 <span style="font-weight:400;font-size:13px;color:var(--sub)">· 语义检索（RAG）</span></h2>
    <p class="cap">基于中文 BGE 向量模型的后端语义检索：用自然语言描述创意方向，自动按语义相似度匹配最相关的真实商业视频案例（支持叠加类型/行业/时间过滤）。</p>
    ${toggleBar}
    <div class="case-filters">
      <input id="semQ" placeholder="🧠 用一句话描述想要的视频…" value="${esc(state._semQ||"")}" style="flex:2;min-width:220px">
      <span class="fsep">类型</span>
      <select ${sel("type")}>${TYPES.map(t => `<option ${filter.type===t?"selected":""}>${t}</option>`).join("")}</select>
      <span class="fsep">行业</span>
      <select ${sel("industry")}>${INDUSTRIES.map(t => `<option ${filter.industry===t?"selected":""}>${t}</option>`).join("")}</select>
      <span class="fsep">时间</span>
      <select ${sel("year")}>${YEARS.map(t => `<option ${filter.year===t?"selected":""}>${t}</option>`).join("")}</select>
            <span class="fsep">阈值</span>
      <select id="semThr">${THRS.map(t => `<option value="${t[1]}" ${state._semThreshold===t[1]?"selected":""}>${t[0]}</option>`).join("")}</select>
      <span class="fsep">数量</span>
      <select id="semK">${KS.map(k => `<option ${state._semTopk===k?"selected":""}>${k}</option>`).join("")}</select>
<button class="primary" onclick="App._semSearch()">语义检索</button>
    </div>
    <div id="semResults">${resHtml}</div>`;
    }

    // —— 本地筛选模式 ——
    const filtered = cases.filter(c => {
      if (filter.type !== "全部" && c.type !== filter.type) return false;
      if (filter.industry !== "全部" && c.industry !== filter.industry) return false;
      if (filter.year !== "全部" && String(c.year) !== filter.year) return false;
      if (filter.search && !(c.title+c.brand+c.desc+c.country).toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });

    return `<h2>📚 案例库 <span style="font-weight:400;font-size:13px;color:var(--sub)">· 100个国内外商业视频案例</span></h2>
    <p class="cap">网络收集的真实商业视频案例，涵盖广告片/企业宣传片/微电影/产品宣传片/短视频/口播/AI漫剧 七大类型。每条标注来源平台（YouTube / 新片场 / 抖音）并附<b>真实视频外链</b>，点击卡片底部「▶ 观看视频」或链接即可跳转原平台观看。</p>
    ${toggleBar}
    <div class="case-filters">
      <select ${sel("type")}>${TYPES.map(t => `<option ${filter.type===t?"selected":""}>${t}</option>`).join("")}</select>
      <span class="fsep">行业</span>
      <select ${sel("industry")}>${INDUSTRIES.map(t => `<option ${filter.industry===t?"selected":""}>${t}</option>`).join("")}</select>
      <span class="fsep">时间</span>
      <select ${sel("year")}>${YEARS.map(t => `<option ${filter.year===t?"selected":""}>${t}</option>`).join("")}</select>
      <input placeholder="🔍 搜索品牌/标题…" value="${esc(filter.search||"")}" oninput="App._setCaseFilter('search',this.value)" style="flex:1;min-width:160px">
      <span class="factive">${filtered.length} 个结果</span>
    </div>
    <div class="case-grid">${filtered.map(c => caseCard(c)).join("")}</div>`;
  }
  function _setCaseFilter(k, v) { if (!state._caseFilter) state._caseFilter = {}; state._caseFilter[k] = v; save(); rerender(); }
  function _setSemantic(on) { state._semantic = on; state._semResults = null; save(); rerender(); }
  function _semSearch() {
    const q = (document.getElementById("semQ") || {}).value || "";
    if (!q.trim()) { setMsg("请先输入一句话描述你想要的视频"); return; }
    state._semQ = q; save();
    const f = state._caseFilter || {};
    const params = new URLSearchParams();
    params.set("q", q);
    if (f.type && f.type !== "全部") params.set("type", f.type);
    if (f.industry && f.industry !== "全部") params.set("industry", f.industry);
    if (f.year && f.year !== "全部") params.set("year", f.year);
    const thrEl = document.getElementById("semThr");
    const kEl = document.getElementById("semK");
    const thr = thrEl ? (parseFloat(thrEl.value) || 0) : 0;
    const k = kEl ? (parseInt(kEl.value) || 12) : 12;
    state._semThreshold = thr; state._semTopk = k; save();
    if (thr > 0) params.set("threshold", String(thr));
    params.set("top_k", String(k));
    const box = document.getElementById("semResults");
    if (box) box.innerHTML = `<div class="cap">🧠 向量检索中（首次加载模型可能稍慢，请稍候）…</div>`;
    fetch("/api/cases/search?" + params.toString()).then(r => r.json()).then(res => {
      const list = Array.isArray(res) ? res : [];
      state._semResults = list.map(x => { if (x.case) x.case._score = x.score; return x.case; });
      if (box) {
        if (!list.length) { box.innerHTML = `<div class="cap">未找到相关案例，换个描述或放宽筛选条件试试。</div>`; return; }
        box.innerHTML = `<div class="case-grid">${list.map(x => caseCard(x.case, x.score)).join("")}</div>`;
      }
    }).catch(e => {
      if (box) box.innerHTML = `<div class="cap" style="color:#B42318">⚠️ 语义检索服务不可用（需后端 RAG 服务运行于 /api/cases/search）。可切换回「本地筛选」继续使用分类检索。</div>`;
    });
  }
  function _loadCases() {
    fetch("data/cases.json").then(r => r.json()).then(data => {
      state._cases = data; if (current === "caselib") rerender();
    }).catch(() => {
      setMsg("案例数据加载失败，请检查 data/cases.json");
    });
  }

  function stageNav() {
    const idx = STAGES.findIndex(s => s.id === current);
    if (idx < 0) return "";
    const prev = idx > 0 ? STAGES[idx - 1] : null;
    const next = idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
    const bs = "padding:9px 15px;border-radius:8px;border:1px solid #2a3340;background:#141a22;color:#cdd6e0;cursor:pointer;font-size:14px";
    const bp = "padding:9px 15px;border-radius:8px;border:1px solid #2f6df6;background:#2f6df6;color:#fff;cursor:pointer;font-size:14px;font-weight:600";
    let html = '<div style="display:flex;justify-content:space-between;gap:12px;margin-top:26px;padding-top:16px;border-top:1px solid #2a3340">';
    html += prev ? `<button class="navbtn" style="${bs}" onclick="App.go('${prev.id}')">← ${prev.icon} ${prev.title}</button>` : `<span style="font-size:13px;color:#5a6675;align-self:center">← 已是首个环节</span>`;
    html += next ? `<button class="navbtn primary" style="${bp}" onclick="App.go('${next.id}')">${next.icon} ${next.title} →</button>` : `<span style="font-size:13px;color:#5a6675;align-self:center">已是最后一个环节 →</span>`;
    html += '</div>';
    return html;
  }
  function render() {
    const nav = document.getElementById("nav");
    let navHtml = `<button class="navbtn nav-full ${current === "full" ? "active" : ""}" onclick="App.go('full')">🧭 完整工作流</button>`;
    navHtml += `<div class="nav-sep">分段工作流 · 各环节可独立使用 ↓</div>`;
    navHtml += STAGES.map(s => `<button class="navbtn ${s.id === current ? "active" : ""}" onclick="App.go('${s.id}')">${s.icon} ${s.title}</button>`).join("");
    navHtml += `<div class="nav-sep" style="margin-top:10px">📚 案例参考</div>`;
    navHtml += `<button class="navbtn ${current === "caselib" ? "active" : ""}" onclick="App.go('caselib')">📚 案例库</button>`;
    nav.innerHTML = navHtml;
    const meta = state.meta;
    document.getElementById("ctx").textContent = `当前项目：${meta.project_name || "未命名"} ｜ 类型：${meta.video_type} ｜ 时长：${meta.duration} ｜ 画幅：${meta.aspect_ratio}`;
    const main = document.getElementById("main");
    let html = "";
    if (current === "full") html = renderFull();
    else if (current === "caselib") { html = renderCaseLib(); _loadCases(); }
    else if (current === "project") html = renderProject();
    else if (current === "stage1") html = renderStage1();
    else if (current === "stage2") html = renderStage2();
    else if (current === "stage3") html = renderStage3();
    else if (current === "stage4") html = renderStage4();
    else if (current === "stage5") html = renderStage5();
    else if (current === "stage6") html = renderStage6();
    else if (current === "stage7") html = renderStage7();
    else if (current === "stage8") html = renderStage8();
    if (state._fullMode && current !== "full") {
      html = `<div class="pro-card">🧭 <b>完整工作流模式进行中</b>：当前环节产出会自动带入下一环节。完成环节8 后点「导出 PPTX」交付。 <button class="mini" onclick="App.setFullMode(false)">退出完整模式</button></div>` + html;
    }
    if (STAGES.some(s => s.id === current)) html += stageNav();
    main.innerHTML = html;
  }
  function rerender() { render(); }
  function go(id) { current = id; render(); }
  function copy(id) { const el = document.getElementById(id); if (el) { navigator.clipboard.writeText(el.textContent).then(() => setMsg("已复制提示词")); } }

  // 暴露全局
  window.App = { onInput, onCheck, set, save, rerender, go, copy, addSeg, delSeg, addShot, addBoard, delBoard, buildShotsFromScript, addRef, addActor, delActor, addArt, delArt, addProp, delProp, onType, onImage, exportPPTX, exportJSON, importJSON, reset, setFullMode, runFull, toggleAllPrompts, toggleAITool, _togglePage, _toggleAllPages, _setLock, _uploadLockImg, _genLockImg, _clearLockImg, _setBoardPrompt, _setBoardField, _toggleShotDetail, _regenPrompt, _copyFullPrompt, _genShotImg, _clearShotImg, _setCaseFilter,
    saveProject, loadProject, newProject, _loadOne, _delOne, addRawFile, delRawFile, _setSemantic, _semSearch, exportPlan, copyAllPrompts, seedScriptFromDirection, _restoreAutosave,
  };

  document.addEventListener("DOMContentLoaded", render);
})();

