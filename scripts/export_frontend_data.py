#!/usr/bin/env python3
"""Export Feishu Base data into the case-library frontend data module."""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "cases" / "src" / "data" / "generated" / "frontendData.js"
ENV_PATH = Path.home() / ".hermes" / ".env"

FEISHU_BASE_URL = "https://open.feishu.cn/open-apis"
FEISHU_API_TIMEOUT = int(os.getenv("FEISHU_API_TIMEOUT", "120"))
FEISHU_API_RETRIES = int(os.getenv("FEISHU_API_RETRIES", "3"))
APP_TOKEN = os.getenv("FEISHU_CASE_LIBRARY_APP_TOKEN", "RaubbCK5NagOFzsG7qXcKgt2nyc")
TABLE_IDS = {
    "offers": os.getenv("FEISHU_CASE_LIBRARY_OFFERS_TABLE_ID", "tblRFIdjLgxLE9fQ"),
    "config": os.getenv("FEISHU_CASE_LIBRARY_CONFIG_TABLE_ID", "tblmV61QXf4MZJot"),
    "schools": os.getenv("FEISHU_CASE_LIBRARY_SCHOOLS_TABLE_ID", "tblMgqhbiR4VKFfW"),
    "articles": os.getenv("FEISHU_CASE_LIBRARY_ARTICLES_TABLE_ID", "tbl8MQ5JqJgm7cvY"),
}

DEFAULT_PAGE_CONFIG = {
    "home.heroEyebrow": "i乐湖",
    "home.heroTitle": "人大申请案例库",
    "home.searchPlaceholder": "搜索学校、专业、成绩、国家（地区）",
    "home.contactTitle": "联系我们",
    "home.contactDescription": "想了解案例匹配、申请规划，可直接联系i乐湖小助手。",
    "home.contactButtonText": "立即联系",
    "detail.contactTitle": "案例咨询",
    "detail.contactDescriptionWithCard": "可继续了解申请节奏与准备重点",
    "detail.contactDescriptionWithoutCard": "咨询入口与二维码后续接入",
    "detail.contactButtonTextWithCard": "立即咨询",
    "detail.contactButtonTextWithoutCard": "咨询入口待接入",
    "detail.studentCardTitle": "学生名片",
    "detail.studentCardDescription": "这部分保留为留白说明与后续联系入口，不重复展示案例主信息。",
    "articles.sectionTitle": "乐湖专访",
    "articles.sectionDescription": "后续用于承接 i乐湖 公众号内的学员专访内容。",
    "contact.modalTitle": "选择一种方式联系我们",
    "contact.modalDescription": "可直接添加微信，或填写问卷星后等待我们联系。",
    "contact.wechatQrLabel": "添加i乐湖小助手微信",
    "contact.wechatQrImage": "public/contact-qrs/wechat-qr-v2.jpg",
    "contact.formQrLabel": "填写问卷星表单",
    "contact.formQrImage": "public/contact-qrs/form-qr-v2.jpg",
}


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"").strip("'"))


def request_json(
    path: str,
    *,
    token: str | None = None,
    method: str = "GET",
    payload: dict[str, Any] | None = None,
    query: dict[str, Any] | None = None,
) -> dict[str, Any]:
    url = f"{FEISHU_BASE_URL}{path}"
    if query:
        clean_query = {k: v for k, v in query.items() if v not in (None, "")}
        if clean_query:
            url = f"{url}?{urllib.parse.urlencode(clean_query)}"

    data = None
    headers: dict[str, str] = {}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    last_error: Exception | None = None
    for attempt in range(1, FEISHU_API_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=FEISHU_API_TIMEOUT) as response:
                result = json.loads(response.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            if exc.code < 500 and exc.code != 429:
                raise RuntimeError(f"Feishu API HTTP {exc.code}: {body[:500]}") from exc
            last_error = RuntimeError(f"Feishu API HTTP {exc.code}: {body[:500]}")
        except (TimeoutError, urllib.error.URLError) as exc:
            last_error = exc

        if attempt < FEISHU_API_RETRIES:
            wait_seconds = min(2 * attempt, 6)
            print(f"Feishu API request timed out or failed, retrying {attempt}/{FEISHU_API_RETRIES}...")
            time.sleep(wait_seconds)
    else:
        raise RuntimeError(f"Feishu API request failed after {FEISHU_API_RETRIES} attempts: {last_error}")

    if result.get("code") != 0:
        raise RuntimeError(f"Feishu API error {result.get('code')}: {result.get('msg')}")
    return result


def tenant_access_token() -> str:
    load_env_file(ENV_PATH)
    app_id = os.getenv("FEISHU_APP_ID") or os.getenv("LARK_APP_ID")
    app_secret = os.getenv("FEISHU_APP_SECRET") or os.getenv("LARK_APP_SECRET")
    if not app_id or not app_secret:
        raise RuntimeError("Missing FEISHU_APP_ID/FEISHU_APP_SECRET or LARK_APP_ID/LARK_APP_SECRET")

    result = request_json(
        "/auth/v3/tenant_access_token/internal",
        method="POST",
        payload={"app_id": app_id, "app_secret": app_secret},
    )
    return result["tenant_access_token"]


def fetch_records(token: str, table_id: str) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    page_token: str | None = None

    while True:
        result = request_json(
            f"/bitable/v1/apps/{APP_TOKEN}/tables/{table_id}/records/search",
            token=token,
            method="POST",
            payload={},
            query={"page_size": 500, "page_token": page_token},
        )
        data = result.get("data", {})
        records.extend(data.get("items", []))
        if not data.get("has_more"):
            return records
        page_token = data.get("page_token")


def value_parts(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        parts: list[str] = []
        for item in value:
            if isinstance(item, dict):
                text = item.get("text") or item.get("name") or item.get("link") or item.get("url")
                if text is not None:
                    parts.append(str(text))
            elif item is not None:
                parts.append(str(item))
        return parts
    if isinstance(value, dict):
        text = value.get("text") or value.get("name") or value.get("link") or value.get("url")
        return [str(text)] if text is not None else []
    if isinstance(value, bool):
        return ["是" if value else "否"]
    return [str(value)]


def field_text(fields: dict[str, Any], name: str) -> str | None:
    text = "".join(value_parts(fields.get(name))).strip()
    return text or None


def field_tags(fields: dict[str, Any], name: str) -> list[str]:
    raw_parts = value_parts(fields.get(name))
    tags: list[str] = []
    for raw in raw_parts:
        for part in re.split(r"[\s,，;；/]+", raw):
            tag = part.strip().lstrip("#")
            if tag and tag not in tags:
                tags.append(tag)
    return tags


def field_bool(fields: dict[str, Any], name: str, *, default: bool = False) -> bool:
    value = fields.get(name)
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    text = field_text(fields, name)
    if text is None:
        return default
    return text.strip().lower() in {"是", "yes", "y", "true", "1", "展示", "前台展示"}


def field_number(fields: dict[str, Any], name: str, *, default: int = 0) -> int:
    value = fields.get(name)
    if isinstance(value, (int, float)):
        return int(value)
    text = field_text(fields, name)
    if not text:
        return default
    match = re.search(r"-?\d+", text)
    return int(match.group()) if match else default


def field_date(fields: dict[str, Any], name: str) -> str | None:
    value = fields.get(name)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000).date().isoformat()
    return field_text(fields, name)


def normalize_asset_url(url: str | None) -> str | None:
    if not url:
        return None
    marker = "/public/"
    if "lhxy2023-alt.github.io" in url and marker in url:
        return f"public/{url.split(marker, 1)[1]}"
    return url


def list_title(school: str | None, program: str | None) -> str:
    return " ".join(part for part in [school, program] if part)


def logo_text(school: str | None) -> str:
    return (school or "")[:2]


def build_detail_sections(case: dict[str, Any]) -> list[dict[str, str]]:
    mapping = [
        ("录取学校", case.get("offerSchool")),
        ("录取专业", case.get("offerProgram")),
        ("本科学院", case.get("undergradCollege")),
        ("本科专业", case.get("undergradMajor")),
        ("GPA/均分", case.get("gpa")),
        ("英语成绩", case.get("englishScore")),
        ("GRE/GMAT", case.get("greGmat")),
        ("国家（地区）", case.get("offerRegion")),
        ("实习经历", case.get("internships")),
        ("科研经历", case.get("research")),
        ("申请时间", case.get("applicationAt")),
        ("录取时间", case.get("admissionAt")),
        ("备注", case.get("notes")),
    ]
    return [{"label": label, "value": value} for label, value in mapping if value]


def build_filter_groups(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    def unique(field: str) -> list[str]:
        values: list[str] = []
        for case in cases:
            value = case.get(field)
            if value and value not in values:
                values.append(value)
        return values

    colleges: list[dict[str, Any]] = []
    for college in unique("undergradCollege"):
        majors: list[str] = []
        for case in cases:
            if case.get("undergradCollege") == college and case.get("undergradMajor") and case["undergradMajor"] not in majors:
                majors.append(case["undergradMajor"])
        colleges.append({"value": college, "label": college, "majors": majors})

    return [
        {
            "id": "season",
            "label": "申请季",
            "field": "applicationSeason",
            "options": ["不限", *unique("applicationSeason")],
        },
        {
            "id": "program",
            "label": "学院专业",
            "field": "undergradCollege",
            "colleges": colleges,
        },
        {
            "id": "region",
            "label": "国家（地区）",
            "field": "offerRegions",
            "multiple": True,
            "options": unique("offerRegion"),
        },
    ]


def build_page_config(records: list[dict[str, Any]]) -> dict[str, str]:
    config = dict(DEFAULT_PAGE_CONFIG)
    for record in records:
        fields = record.get("fields", {})
        if not field_bool(fields, "enabled", default=True):
            continue
        key = field_text(fields, "config_key")
        value = field_text(fields, "config_value")
        if key and value is not None:
            config[key] = normalize_asset_url(value) or value
    return config


def build_school_logos(records: list[dict[str, Any]]) -> dict[str, str]:
    logos: dict[str, str] = {}
    for record in records:
        fields = record.get("fields", {})
        school = field_text(fields, "学校名称")
        url = normalize_asset_url(field_text(fields, "校徽图片URL"))
        if school and url:
            logos[school] = url
    return logos


def build_cases(records: list[dict[str, Any]], school_logos: dict[str, str]) -> list[dict[str, Any]]:
    visible_records: list[dict[str, Any]] = []
    for record in records:
        fields = record.get("fields", {})
        if field_bool(fields, "是否前台展示", default=True):
            visible_records.append(record)

    cases: list[dict[str, Any]] = []
    for index, record in enumerate(visible_records, start=1):
        fields = record.get("fields", {})
        record_id = record.get("record_id") or f"row-{index}"
        season = (field_text(fields, "申请季") or "").lower()
        student_name = field_text(fields, "学生姓名") or "匿名"
        internal_name = field_text(fields, "学生（后台真名）") or student_name
        offer_school = field_text(fields, "录取学校")
        offer_program = field_text(fields, "录取专业")
        display_tags = field_tags(fields, "标签")
        english_score = field_text(fields, "英语成绩")
        gre_gmat = field_text(fields, "GRE/GMAT")
        score_list = [item for item in [english_score, gre_gmat] if item]
        show_card = field_bool(fields, "是否展示学生名片", default=False)
        card_copy = field_text(fields, "学生名片简介")

        case: dict[str, Any] = {
            "id": f"{season or 'case'}-{record_id}",
            "recordId": record_id,
            "applicationSeason": season,
            "seasonKey": season,
            "sourceRow": index,
            "studentDisplayName": student_name,
            "studentNameMasked": student_name,
            "anonymousMode": student_name == "匿名",
            "internalStudentName": internal_name,
            "studentKey": internal_name,
            "undergradCollege": field_text(fields, "本科学院"),
            "undergradCollegeLabel": field_text(fields, "本科学院"),
            "undergradMajor": field_text(fields, "本科专业"),
            "gpa": field_text(fields, "GPA/均分"),
            "englishScore": english_score,
            "greGmat": gre_gmat,
            "offerSchool": offer_school,
            "offerProgram": offer_program,
            "schoolLogoUrl": school_logos.get(offer_school or ""),
            "offerRegion": field_text(fields, "国家（地区）"),
            "description": None,
            "internships": field_text(fields, "实习经历"),
            "research": field_text(fields, "科研经历"),
            "applicationRound": None,
            "applicationAt": field_text(fields, "申请时间"),
            "admissionAt": field_text(fields, "录取时间"),
            "notes": field_text(fields, "备注"),
            "finalDestination": None,
            "isFinalOffer": field_bool(fields, "是否是最终去向", default=False),
            "sortOrder": field_number(fields, "排序权重"),
            "isPinned": False,
            "displayTags": display_tags,
            "studentCard": (
                {
                    "copy": card_copy
                    or f"{student_name}愿意分享选校定位、申请节奏、文书推进与拿到 offer 后的真实体验。",
                    "contactLabel": "与我咨询",
                }
                if show_card
                else None
            ),
        }
        case["scoreList"] = score_list
        case["languageScoreText"] = english_score
        case["tags"] = [
            {"label": season, "type": "season"},
            *[{"label": tag, "type": "default"} for tag in display_tags],
        ]
        case["listTitle"] = list_title(offer_school, offer_program)
        case["logoText"] = logo_text(offer_school)
        case["detailSections"] = build_detail_sections(case)
        case["searchText"] = " ".join(
            str(value)
            for value in [
                case.get("applicationSeason"),
                case.get("studentDisplayName"),
                case.get("undergradCollege"),
                case.get("undergradCollegeLabel"),
                case.get("undergradMajor"),
                case.get("gpa"),
                case.get("englishScore"),
                case.get("greGmat"),
                case.get("offerSchool"),
                case.get("offerProgram"),
                case.get("offerRegion"),
                *display_tags,
            ]
            if value
        )
        cases.append(case)

    cases.sort(key=lambda item: (item.get("sortOrder") or 0, item.get("applicationSeason") or ""), reverse=True)
    for index, case in enumerate(cases, start=1):
        case["sourceRow"] = index
    return cases


def build_articles(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    articles: list[dict[str, Any]] = []
    for index, record in enumerate(records, start=1):
        fields = record.get("fields", {})
        tags = [tag.lower() for tag in field_tags(fields, "标签")]
        article = {
            "id": f"article-{index}",
            "subject": field_text(fields, "专访对象"),
            "summary": field_text(fields, "简介"),
            "backgroundImageUrl": normalize_asset_url(field_text(fields, "背景图URL")),
            "url": field_text(fields, "专访链接") or "#",
            "weight": field_number(fields, "展示权重"),
            "uploadTime": field_date(fields, "上传时间"),
            "tagCodes": tags,
            "isHot": "hot" in tags,
            "isNew": "new" in tags,
            "isFeatured": "featured" in tags,
        }
        if article["subject"]:
            articles.append(article)

    articles.sort(key=lambda item: (item.get("weight") or 0, item.get("uploadTime") or ""), reverse=True)
    if articles and not any(item["isFeatured"] for item in articles):
        articles[0]["isFeatured"] = True
    return articles


def write_frontend_data(
    *,
    cases: list[dict[str, Any]],
    filter_groups: list[dict[str, Any]],
    page_config: dict[str, str],
    articles: list[dict[str, Any]],
) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    sections = [
        ("cases", cases),
        ("filterGroups", filter_groups),
        ("pageConfig", page_config),
        ("articles", articles),
    ]
    body = ["// Auto-generated by scripts/export_frontend_data.py. Do not edit manually."]
    for name, value in sections:
        body.append(f"export const {name} = {json.dumps(value, ensure_ascii=False, indent=2)};")
    OUTPUT.write_text("\n".join(body) + "\n", encoding="utf-8")


def main() -> int:
    token = tenant_access_token()
    offer_records = fetch_records(token, TABLE_IDS["offers"])
    config_records = fetch_records(token, TABLE_IDS["config"])
    school_records = fetch_records(token, TABLE_IDS["schools"])
    article_records = fetch_records(token, TABLE_IDS["articles"])

    school_logos = build_school_logos(school_records)
    cases = build_cases(offer_records, school_logos)
    page_config = build_page_config(config_records)
    articles = build_articles(article_records)
    filter_groups = build_filter_groups(cases)

    write_frontend_data(
        cases=cases,
        filter_groups=filter_groups,
        page_config=page_config,
        articles=articles,
    )
    print(
        f"Exported {len(cases)} visible cases, {len(articles)} articles, "
        f"{len(page_config)} config keys -> {OUTPUT}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"export_frontend_data.py failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
