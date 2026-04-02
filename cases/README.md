# 人大中法升学案例库前台

这是一个为 `i乐湖` 场景重做的移动端优先案例库前台。

当前版本的重点已经从“视觉 demo”切换为“Feishu Base 作为管理后台的数据驱动前台”：

- `offer表` 控制案例展示内容
- `页面配置表` 控制前台页面文案配置
- 前台通过本地生成文件读取 Base 导出结果

## 当前范围

- 前台案例展示页面，不直接请求真实 Feishu API
- Feishu Base 作为后台源数据
- 通过导出脚本生成前台静态数据模块
- 移动端优先，保留搜索、Tab、筛选、列表和详情的最小前台结构

## 页面能力

- 案例列表页
  - 搜索框
  - `案例 / 专访` Tab
  - `申请季 / 院校专业 / 国家（地区）` 筛选面板
  - 基于 `offer表` 导出的案例卡片列表
- 案例详情页
  - 基于 `offer表` 的录取详情信息卡
  - 学生名片逻辑
  - 底部浮动咨询入口
- 专访页
  - 当前仍使用本地静态文章种子数据

## 目录结构

```text
ruc-suzhou-case-library/
├── index.html
├── README.md
└── src
    ├── app.js
    ├── components
    │   ├── filterPanel.js
    │   ├── previewModal.js
    │   └── shell.js
    ├── data
    │   ├── generated
    │   │   └── frontendData.js
    │   ├── documents.js
    │   ├── fieldMap.js
    │   ├── index.js
    │   └── mentors.js
    ├── pages
    │   ├── detailPage.js
    │   └── listPage.js
    ├── styles
    │   ├── base.css
    │   ├── components.css
    │   ├── layout.css
    │   └── tokens.css
    └── utils
        ├── formatters.js
        ├── selectors.js
        └── state.js
```

## 如何本地运行

在工作区根目录执行：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000/ruc-suzhou-case-library/
```

## 如何从飞书 Base 更新前台数据

在工作区根目录执行：

```bash
python3 feishu-bitable-sync/export_frontend_data.py
```

脚本会：

1. 读取 `config.json` 中的 Feishu 应用配置
2. 从当前 Base 拉取 `offer表`
3. 从当前 Base 拉取 `页面配置表`
4. 生成前台使用的：

```text
ruc-suzhou-case-library/src/data/generated/frontendData.js
```

也就是说，之后你在飞书后台中：

- 改 `offer表` 的案例内容、排序、前台展示开关、学生名片开关
- 改 `页面配置表` 的页面标题、按钮文案、说明文案

然后重新运行一次上面的导出命令，前台展示页就会同步更新。

## 当前字段原则

### offer表
- `是否前台展示`：决定该记录是否进入前台
- `排序权重` + `置顶标记`：控制前台展示顺序
- `是否展示学生名片` + `学生名片简介`：控制详情页名片模块
- `备注`：仅详情页展示，不在列表页展示

### 页面配置表
通过 `config_key -> config_value` 驱动页面文案。

当前已支持的 key 包括：

- `home.heroEyebrow`
- `home.heroTitle`
- `home.searchPlaceholder`
- `home.contactTitle`
- `home.contactDescription`
- `home.contactButtonText`
- `detail.contactTitle`
- `detail.contactDescriptionWithCard`
- `detail.contactDescriptionWithoutCard`
- `detail.contactButtonTextWithCard`
- `detail.contactButtonTextWithoutCard`
- `detail.studentCardTitle`
- `detail.studentCardDescription`
- `articles.sectionTitle`
- `articles.sectionDescription`

更完整的后台维护规范见：

- `ruc-suzhou-case-library/BACKEND_GUIDE.md`
- `ruc-suzhou-case-library/FIELD_MAPPING.md`

## 当前限制

- 现在是“改表后重新导出一次”的模式，不是自动实时刷新
- 前台暂未直接接微信小程序运行时
- 专访内容目前仍是本地种子数据，尚未接入 Base

## 未来可扩展方向

1. 增加自动监听 / webhook / 定时导出
2. 把专访内容也迁到 Base 配置
3. 继续为微信小程序页面结构做迁移适配
4. 增加咨询二维码 / 跳转配置 / 表单配置
