#!/usr/bin/env python3
"""视频案例 RAG 底座：中文 BGE embedding + numpy 余弦检索（支持元数据过滤）。

- build_index(): 从 data/cases.json 重建向量库（持久化到 data/vectors.npz）
- search(query, filters, top_k): 语义检索 top-k 相似案例，filters 支持 type/industry/year/source 精确过滤
"""
import json
import os
import numpy as np
from fastembed import TextEmbedding

MODEL = "BAAI/bge-small-zh-v1.5"
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "cases.json")
VEC = os.path.join(HERE, "data", "vectors.npz")

_embed_model = None
_cache = None  # (ids, mat)


def _get_model():
    global _embed_model
    if _embed_model is None:
        _embed_model = TextEmbedding(model_name=MODEL)
    return _embed_model


def _text(c):
    return " ".join(
        str(x)
        for x in [
            c.get("brand", ""),
            c.get("type", ""),
            c.get("industry", ""),
            c.get("desc", ""),
            c.get("director", "") or "",
            c.get("country", ""),
        ]
        if x
    )


def build_index():
    global _cache
    cases = json.load(open(DATA, encoding="utf-8"))
    texts = [_text(c) for c in cases]
    embs = list(_get_model().embed(texts))
    mat = np.array(embs, dtype="float32")
    ids = [c["id"] for c in cases]
    np.savez(VEC, ids=np.array(ids), mat=mat)
    _cache = (ids, mat)
    return len(cases)


def _load():
    global _cache
    if _cache is None:
        if not os.path.exists(VEC):
            build_index()
        else:
            d = np.load(VEC, allow_pickle=True)
            _cache = (d["ids"].tolist(), d["mat"])
    return _cache


def search(query, filters=None, top_k=8, threshold=0.0):
    ids, mat = _load()
    cases = {c["id"]: c for c in json.load(open(DATA, encoding="utf-8"))}
    qv = np.array(list(_get_model().embed([query]))[0], dtype="float32")
    mat_n = mat / np.linalg.norm(mat, axis=1, keepdims=True)
    qv_n = qv / np.linalg.norm(qv)
    sims = mat_n @ qv_n
    order = np.argsort(-sims)
    res = []
    for i in order:
        cid = ids[i]
        c = cases.get(cid)
        if not c:
            continue
        score = float(sims[i])
        if threshold > 0 and score < threshold:
            break
        if filters and not _pass(c, filters):
            continue
        res.append({"id": cid, "score": round(score, 4), "case": c})
        if len(res) >= top_k:
            break
    return res


def _pass(c, f):
    for k, v in f.items():
        if k == "type" and c.get("type") != v:
            return False
        if k == "industry" and c.get("industry") != v:
            return False
        if k == "year" and str(c.get("year")) != str(v):
            return False
        if k == "source" and c.get("source") != v:
            return False
    return True


if __name__ == "__main__":
    n = build_index()
    print("build_index done, cases:", n)
