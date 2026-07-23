#!/usr/bin/env python3
"""商业视频全案策划引擎 · 后端服务（配置库 + 项目库）"""
import json, os, sys, time, uuid, shutil, threading, mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))  # standalone 目录
CONFIG_FILE = os.path.join(DATA_DIR, 'config.json')
PROJECTS_DIR = os.path.join(DATA_DIR, 'projects')

# ---------- 默认配置 ----------
DEFAULT_CONFIG = {
    "video_types": {
        "广告片": {"desc": "15s/30s/60s，信息密度高", "extra": [["黄金3秒钩子设计", "开场3秒抓住注意力"], ["产品露出策略", "产品出现时机与方式"]]},
        "企业宣传片": {"desc": "2-5分钟，张弛有度", "extra": [["企业核心信息层级", "按优先级排列"], ["叙事视角", "第三人称/第一人称/人物视角"]]},
        "微电影": {"desc": "3-10分钟，完整故事", "extra": [["人物小传", "主角背景与转变弧光"], ["三幕结构", "建置-对抗-结局"]]},
        "产品宣传片": {"desc": "60s-3分钟，卖点清晰", "extra": [["核心卖点排序", "按决策权重排列"], ["功能可视化", "每功能画面呈现"]]},
        "短视频": {"desc": "15-60秒，竖屏9:16", "extra": [["前三秒钩子", "提问/反差/结果前置"], ["字幕设计", "静音可读"], ["行动指令CTA", "结尾引导"]]},
    },
    "script_modes": ["旁白型", "对话型", "蒙太奇型", "采访型", "无台词型"],
    "aspect_ratios": ["16:9 横屏", "9:16 竖屏", "1:1 方形", "2.35:1 宽银幕"],
    "shot_sizes": ["WS 远景", "FS 全景", "MS 中景", "MCU 近景", "CU 特写", "ECU 大特写"],
    "camera_moves": ["固定", "推 Push in", "拉 Pull out", "横摇 Pan", "竖摇 Tilt", "平移 Track", "跟拍 Follow", "升降 Crane", "环绕 Orbit", "手持 Handheld"],
    "updated": "2026-07-20 13:20",
    "version": "beta2.0",
}

def init():
    os.makedirs(PROJECTS_DIR, exist_ok=True)
    if not os.path.exists(CONFIG_FILE):
        json.dump(DEFAULT_CONFIG, open(CONFIG_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    # 修复老配置文件
    cfg = json.load(open(CONFIG_FILE, encoding='utf-8'))
    for k, v in DEFAULT_CONFIG.items():
        if k not in cfg:
            cfg[k] = v
    json.dump(cfg, open(CONFIG_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

def load_config():
    return json.load(open(CONFIG_FILE, encoding='utf-8'))

def save_config(cfg):
    json.dump(cfg, open(CONFIG_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# ---------- HTTP ----------
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass  # quiet

    def _send(self, code, data, is_json=True):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json' if is_json else 'text/plain')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
        body = json.dumps(data, ensure_ascii=False) if is_json else data
        self.wfile.write(body.encode('utf-8'))

    def _read(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def do_OPTIONS(self):
        self._send(200, {})

    def do_GET(self):
        p = urlparse(self.path)
        path = p.path.rstrip('/')
        qs = parse_qs(p.query)
        try:
            # --- 配置库 ---
            if path == '/api/config':
                return self._send(200, load_config())
            # --- 项目库 ---
            elif path == '/api/projects':
                projects = []
                if os.path.isdir(PROJECTS_DIR):
                    for fn in sorted(os.listdir(PROJECTS_DIR), reverse=True):
                        if fn.endswith('.json'):
                            try:
                                d = json.load(open(os.path.join(PROJECTS_DIR, fn), encoding='utf-8'))
                                projects.append({"id": d.get("id"), "name": d.get("name"), "client": d.get("meta", {}).get("client", ""),
                                                 "video_type": d.get("meta", {}).get("video_type", ""), "updated": d.get("updated", "")})
                            except: pass
                return self._send(200, projects)
            # --- 单个项目详情 ---
            elif path.startswith('/api/projects/'):
                pid = path.split('/')[-1]
                fp = os.path.join(PROJECTS_DIR, f"{pid}.json")
                if not os.path.exists(fp):
                    return self._send(404, {"error": "项目不存在"})
                return self._send(200, json.load(open(fp, encoding='utf-8')))
            # --- 案例语义检索（RAG）---
            elif path == '/api/cases/search':
                import rag_store as _rs
                q = (qs.get('q', [''])[0] or '').strip()
                f = {k: qs.get(k, [''])[0] for k in ('type', 'industry', 'year', 'source') if qs.get(k, [''])[0]}
                try:
                    top_k = int(qs.get('top_k', ['8'])[0] or 8)
                except ValueError:
                    top_k = 8
                if not q:
                    return self._send(400, {"error": "缺少查询参数 q"})
                return self._send(200, _rs.search(q, f or None, top_k))
            elif path == '/api/cases/reindex':
                import rag_store as _rs
                return self._send(200, {"indexed": _rs.build_index()})
            # --- 静态文件回退（GET 兜底）---
            fp = os.path.join(ROOT_DIR, path.lstrip('/') or 'index.html')
            if os.path.isfile(fp):
                ct = mimetypes.guess_type(fp)[0] or 'application/octet-stream'
                with open(fp, 'rb') as f: data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', ct)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                return self._send(404, {"error": "not found"})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def do_POST(self):
        p = urlparse(self.path)
        path = p.path.rstrip('/')
        try:
            # --- 新增/更新项目 ---
            if path == '/api/projects':
                data = self._read()
                pid = data.get('id') or uuid.uuid4().hex[:12]
                data['id'] = pid
                data['updated'] = time.strftime('%Y-%m-%d %H:%M')
                json.dump(data, open(os.path.join(PROJECTS_DIR, f"{pid}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
                return self._send(200, {"id": pid, "updated": data['updated']})
            # --- 新增配置项（视频类型/脚本模式等）---
            elif path == '/api/config/add':
                data = self._read()
                cfg = load_config()
                for key, val in data.items():
                    if key in cfg and isinstance(cfg[key], list):
                        if isinstance(val, list):
                            cfg[key].extend(val)
                        else:
                            cfg[key].append(val)
                    elif key == 'video_types' and isinstance(val, dict):
                        cfg['video_types'].update(val)
                cfg['updated'] = time.strftime('%Y-%m-%d %H:%M')
                save_config(cfg)
                return self._send(200, cfg)
            else:
                return self._send(404, {"error": "not found"})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def do_PUT(self):
        p = urlparse(self.path)
        path = p.path.rstrip('/')
        try:
            if path == '/api/config':
                data = self._read()
                cfg = load_config()
                op = data.get('op')
                # 修改视频类型描述
                if op == 'typeDesc':
                    t = data.get('type')
                    if t in cfg['video_types']:
                        cfg['video_types'][t]['desc'] = data.get('desc', '')
                # 重命名视频类型
                elif op == 'typeRename':
                    frm = data.get('from'); to = (data.get('to') or '').strip()
                    if frm in cfg['video_types'] and to and to != frm:
                        cfg['video_types'][to] = cfg['video_types'].pop(frm)
                # 给某类型新增细化参数
                elif op == 'typeExtraAdd':
                    t = data.get('type')
                    if t in cfg['video_types']:
                        cfg['video_types'][t].setdefault('extra', []).append([data.get('name', ''), data.get('desc', '')])
                # 修改某类型的某个细化参数
                elif op == 'typeExtraUpd':
                    t = data.get('type'); idx = data.get('idx')
                    if t in cfg['video_types']:
                        extra = cfg['video_types'][t].setdefault('extra', [])
                        if isinstance(idx, int) and 0 <= idx < len(extra):
                            extra[idx] = [data.get('name', ''), data.get('desc', '')]
                # 删除某类型的某个细化参数
                elif op == 'typeExtraDel':
                    t = data.get('type'); idx = data.get('idx')
                    if t in cfg['video_types']:
                        extra = cfg['video_types'][t].setdefault('extra', [])
                        if isinstance(idx, int) and 0 <= idx < len(extra):
                            extra.pop(idx)
                # 重命名列表项（脚本模式/画幅/景别/运镜）
                elif op == 'itemRename':
                    key = data.get('key'); frm = data.get('from'); to = (data.get('to') or '').strip()
                    if key in cfg and isinstance(cfg[key], list) and frm in cfg[key] and to:
                        cfg[key][cfg[key].index(frm)] = to
                # 删除列表项
                elif op == 'itemDel':
                    key = data.get('key'); val = data.get('value')
                    if key in cfg and isinstance(cfg[key], list) and val in cfg[key]:
                        cfg[key].remove(val)
                else:
                    return self._send(400, {"error": "未知操作: " + str(op)})
                cfg['updated'] = time.strftime('%Y-%m-%d %H:%M')
                save_config(cfg)
                return self._send(200, cfg)
            else:
                return self._send(404, {"error": "not found"})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def do_DELETE(self):
        p = urlparse(self.path)
        path = p.path.rstrip('/')
        try:
            if path.startswith('/api/projects/'):
                pid = path.split('/')[-1]
                fp = os.path.join(PROJECTS_DIR, f"{pid}.json")
                if not os.path.exists(fp):
                    return self._send(404, {"error": "项目不存在"})
                os.remove(fp)
                return self._send(200, {"deleted": pid})
            # 删除配置项
            elif path.startswith('/api/config/'):
                key = path.split('/')[-1]
                data = self._read()
                cfg = load_config()
                if key in cfg and isinstance(cfg[key], list):
                    for v in data.get('values', []):
                        if v in cfg[key]:
                            cfg[key].remove(v)
                elif key == 'video_types':
                    for v in data.get('keys', []):
                        cfg['video_types'].pop(v, None)
                cfg['updated'] = time.strftime('%Y-%m-%d %H:%M')
                save_config(cfg)
                return self._send(200, cfg)
            else:
                return self._send(404, {"error": "not found"})
        except Exception as e:
            self._send(500, {"error": str(e)})


def start(port=8100):
    init()
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"API server running on port {port}")
    server.serve_forever()

if __name__ == '__main__':
    start(int(sys.argv[1]) if len(sys.argv) > 1 else 8100)
