# OpenRouter 模型抓取与导入脚本

该目录包含脚本 `fetch-provider-openrouter.py`，用于：
- 从 OpenRouter 抓取公开模型列表并保存为 JSON 文件；
- 将保存的模型文件导入到本项目的“模型数据库”。

脚本默认会将抓取结果保存为 `openrouter.models.json`，并在导入时自动创建/确保供应商（vendor）名称为 `OpenRouter`。

## 前置条件

- Python 3.11+（推荐）
- 已安装项目后端依赖（脚本会调用 `backend/app` 的数据库与服务逻辑）
  - 例如：sqlmodel、sqlalchemy、fastapi 等需已在当前 Python 环境可用
- 具有网络访问 `https://openrouter.ai` 的权限

> 注意：脚本通过导入项目的后端代码（`backend.app.*`），因此请从仓库根目录运行命令，或确保运行路径能正确找到项目根目录。

## 快速开始

- 抓取模型并写入默认文件：

```bash
python scripts/fetch-provider-openrouter.py
```

- 指定输出文件：

```bash
python scripts/fetch-provider-openrouter.py --output openrouter.models.json
```

- 从已保存的 JSON 文件导入到数据库：

```bash
python scripts/fetch-provider-openrouter.py --import openrouter.models.json
```

- 指定数据库文件导入（例如数据库在 backend/app.db）：

```bash
python scripts/fetch-provider-openrouter.py --import openrouter.models.json --database backend/app.db
```

- 查看帮助：

```bash
python scripts/fetch-provider-openrouter.py -h
```

## 命令行参数

- `--output FILE`：抓取时指定输出文件路径（默认：`openrouter.models.json`）。
- `--import FILE`：从指定的 JSON 文件导入模型到数据库。
  - 导入时会确保存在名为 `OpenRouter` 的供应商；如不存在会自动创建。
- `-d, --database DB`：指定数据库 URL 或文件路径。例如：`--database backend/app.db`。

## 导入逻辑与字段映射（概要）

- 供应商（vendor）：固定为 `OpenRouter`。
- 模型标识（vendorModelId）：优先从 `endpoint.provider_model_id` 推断；否则回退到 `slug/permaslug/model_variant_slug` 等。
- 模型名称（model）：优先使用返回的 `name`，否则回退到 `slug`。
- 描述（description）：来自响应中的 `description`。
- 上下文长度（maxContextTokens）：优先 `endpoint.context_length`，否则回退到顶层/嵌套的 `context_length`。
- 最大全文输出（maxOutputTokens）：来自 `endpoint.max_completion_tokens`（如有）。
- 能力（modelCapability）：综合 input/output modalities 与 endpoint 能力标记（如 `chat/completion/multipart/reasoning/tools`）。
- 定价（priceModel/priceCurrency/priceData）：
  - 若存在按 token 定价（`pricing.prompt` 或 `pricing.completion`），则视为 token 模式，自动换算为每百万 token 的价格（`input_token_1m` / `output_token_1m`）。
  - 若存在按请求数定价（`pricing.request`），则视为 call 模式（`price_per_call`）。
  - 货币默认 `USD`。
- 发布日期（releaseDate）：从 `created_at` 推断（若可解析）。

> 如果数据库中已存在相同（vendor, vendorModelId）的记录，则进行“更新”；否则“创建”。

## 数据库位置与环境变量

后端默认数据库 URL 为：`sqlite:///./app.db`（见 `backend/app/core/config.py`）。
该路径相对于进程工作目录（cwd）。如果你的数据库文件在 `backend/app.db`，可以直接在导入时指定：

```bash
python scripts/fetch-provider-openrouter.py --import openrouter.models.json --database backend/app.db
```

也可以使用完整 URL：

```bash
python scripts/fetch-provider-openrouter.py --import openrouter.models.json --database sqlite:///backend/app.db
```

仍可通过环境变量方式覆盖（可选）：

```bash
export DATABASE_URL=sqlite:///backend/app.db
python scripts/fetch-provider-openrouter.py --import openrouter.models.json
```

你也可以在 `.env` 中配置 `DATABASE_URL`，脚本会读取后端配置。

## 常见问题

- 报错“找不到后端模块”：请确认从仓库根目录运行命令，或者确保 `scripts` 上一级目录（项目根）在 `PYTHONPATH` 中。
- 导入后看不到数据：请确认连接的是同一个数据库文件（检查 `DATABASE_URL` 与当前工作目录）。
- OpenRouter 接口不可用：稍后重试，或检查网络连接与代理设置。

## 许可

本目录脚本随项目一起发布，遵循项目根目录中的许可证条款。
