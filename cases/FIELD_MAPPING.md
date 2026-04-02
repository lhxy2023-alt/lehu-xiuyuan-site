# 字段映射说明（当前以 Feishu Base 后台为准）

当前项目已不再以手写静态案例数据为主，而是以 Feishu Base 作为后台源头。

当前数据链路：

```text
Feishu Base（offer表 + 页面配置表）
  -> feishu-bitable-sync/export_frontend_data.py
  -> src/data/generated/frontendData.js
  -> 前台页面
```

因此这里不再只讨论“历史真实 JSON 字段”，而是明确：

- `offer表` 里哪些字段会进入前台
- 哪些字段是后台运营字段
- 哪些字段是前端派生字段
- `页面配置表` 里哪些 key 已被前台消费

---

## 1. offer表 → 前台字段映射

### 1.1 当前直接进入前台的字段

| Feishu 字段 | 前端字段 | 展示位置 | 说明 |
| --- | --- | --- | --- |
| 案例ID | `id` | 内部索引 | 作为前台唯一 ID 使用 |
| 申请季 | `applicationSeason` | 列表 / 详情 / 筛选 | 如 `24fall` / `25fall` / `26fall` |
| 匿名展示名 | `studentNameMasked` | 列表 / 详情 | 为空时回退 `学生姓名`，再不行用 `匿名同学` |
| 本科院校 / 本科学校 | `undergradSchool` | 列表 / 详情 / 筛选 | 优先读 `本科院校`，否则回退 `本科学校` |
| 本科专业 | `undergradMajor` | 列表 / 详情 / 筛选 | 直接展示 |
| GPA/均分 | `gpa` | 列表 / 详情 | 直接展示 |
| 雅思 | `ielts` | 列表 / 详情 | 有值才展示 |
| 托福 | `toefl` | 列表 / 详情 | 有值才展示 |
| GRE/GMAT | `greGmat` | 列表 / 详情 | 有值才展示 |
| 录取学校 / 录取院校 | `offerSchool` | 列表 / 详情 | 优先读 `录取学校`，否则回退 `录取院校` |
| 录取专业 | `offerProgram` | 列表 / 详情 | 直接展示 |
| 录取国家/地区 | `offerRegion` | 筛选 / 搜索 | 为空时当前会落成 `其他` |
| 实习经历 | `internships` | 详情页 | 有值才展示 |
| 科研经历 | `research` | 详情页 | 有值才展示 |
| 申请轮次 | `applicationRound` | 详情页 | 有值才展示 |
| 录取时间 | `admissionAt` | 详情页 | 有值才展示 |
| 最终去向说明 | `finalDestination` | 详情页 | 有值才展示 |
| 备注 | `notes` | 详情页 | 列表页不展示 |
| 案例说明/项目说明 | `description` | 搜索补充 / 详情补充 | 当前主要用于搜索增强 |
| 标签 | `displayTags` | 搜索增强 | 多值建议用 `/` 分隔 |
| 排序权重 | `sortOrder` | 排序控制 | 数字越大越靠前 |
| 置顶标记 | `isPinned` | 排序控制 | 置顶优先于排序权重 |

### 1.2 当前前台控制字段

| Feishu 字段 | 作用 | 当前逻辑 |
| --- | --- | --- |
| 是否前台展示 | 控制是否导出到前台 | 为空时，若记录具备基本内容则默认导出 |
| 置顶标记 | 控制前台是否置顶 | `是/true/1/on` 等会被识别为 true |
| 排序权重 | 控制同层排序 | 值越大越靠前 |
| 是否展示学生名片 | 控制详情页是否出现学生名片 | 为空时默认不展示 |
| 学生名片简介 | 学生名片文案 | 为空时脚本自动给默认文案 |

### 1.3 当前不直接前台展示，但仍值得保留的后台字段

| Feishu 字段 | 用途 |
| --- | --- |
| 学生姓名 | 内部真实信息，供匿名展示名回退 |
| 学生标识 | 未来可用于按学生维度聚合多个 offer |
| 最终选择标记 | 未来可用于展示“最终去向” |
| 宣传完成情况 | 后台运营流程字段 |
| record_id / 文本 | 系统或占位字段，不建议作为业务主字段 |

---

## 2. 前端派生字段

这些字段不是后台直接填写，而是导出时生成的：

| 前端字段 | 来源 | 用途 |
| --- | --- | --- |
| `seasonKey` | 由申请季规整得到 | 内部使用 |
| `sourceRow` | 导出时顺序编号 | 内部追踪 |
| `undergradSchoolLabel` | 学校展示名映射 | 列表 / 详情展示优化 |
| `scoreList` | 由雅思 / 托福 / GRE/GMAT 合并 | 列表 / 详情 |
| `languageScoreText` | 由 `scoreList` 拼接 | 详情页 |
| `listTitle` | 由 `录取学校 + 录取专业 + offer` 派生 | 列表标题 |
| `logoText` | 由录取学校截取前两个字 | 列表学校徽标占位 |
| `detailSections` | 由详情字段按有值过滤生成 | 详情信息区 |
| `searchText` | 由多个字段拼接 | 前台搜索 |
| `studentCard` | 由名片开关 + 名片简介生成 | 详情页学生名片模块 |

---

## 3. 页面配置表 → 前台配置映射

当前前台已消费的配置 key 如下：

| config_key | 控制位置 | 默认值 |
| --- | --- | --- |
| `home.heroEyebrow` | 首页眉标题 | `i乐湖` |
| `home.heroTitle` | 首页主标题 | `i乐湖案例库` |
| `home.searchPlaceholder` | 首页搜索框占位文案 | `搜索学校、专业、成绩、国家（地区）` |
| `home.contactTitle` | 首页联系区标题 | `联系我们` |
| `home.contactDescription` | 首页联系区说明 | `想了解案例匹配、申请规划或合作方式，可直接联系顾问。` |
| `home.contactButtonText` | 首页联系按钮文案 | `立即联系` |
| `detail.contactTitle` | 详情页咨询标题 | `案例咨询` |
| `detail.contactDescriptionWithCard` | 有名片时详情页说明 | `可继续了解申请节奏与准备重点` |
| `detail.contactDescriptionWithoutCard` | 无名片时详情页说明 | `咨询入口与二维码后续接入` |
| `detail.contactButtonTextWithCard` | 有名片时详情页按钮文案 | `立即咨询` |
| `detail.contactButtonTextWithoutCard` | 无名片时详情页按钮文案 | `咨询入口待接入` |
| `detail.studentCardTitle` | 学生名片标题 | `学生名片` |
| `detail.studentCardDescription` | 学生名片说明 | `这部分保留为留白说明与后续联系入口，不重复展示案例主信息。` |
| `articles.sectionTitle` | 专访页标题 | `乐湖专访` |
| `articles.sectionDescription` | 专访页说明 | `后续用于承接 i乐湖 公众号内的学员专访内容。` |

---

## 4. 当前后台表现状提醒

### offer表 当前现状
根据当前实际表数据，存在以下问题：

- `是否前台展示` 大量为空
- `匿名展示名` 大量为空
- `录取国家/地区` 大量为空
- `排序权重` 大量为空
- `是否展示学生名片` 大量为空
- `录取学校` 很多为空，但 `录取院校` 有值
- `本科院校` 很多为空，但 `本科学校` 有值

因此当前导出脚本做了大量兼容回退。

### 页面配置表 当前现状
- 当前基本为空表
- 还没有真正建立 key 体系

---

## 5. 当前推荐维护原则

- `offer表` 负责案例内容与前台控制
- `页面配置表` 负责页面文案与配置
- 派生字段永远不要手工回填到后台作为“真实源字段”
- 空字段尽量允许隐藏，不要为展示而硬塞假文案
- 后台字段值尽量标准化，尤其是：
  - 布尔字段：统一 `是 / 否`
  - 国家地区：统一枚举值
  - 匿名展示名：统一命名格式

---

## 6. 相关文件

- 导出脚本：`feishu-bitable-sync/export_frontend_data.py`
- 后台维护说明：`ruc-suzhou-case-library/BACKEND_GUIDE.md`
- 前台 generated 数据：`ruc-suzhou-case-library/src/data/generated/frontendData.js`
