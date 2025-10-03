# 阿里云百炼模型数据导入脚本

本脚本用于将阿里云百炼平台的模型数据转换并导入到模型价格中心项目的数据库中。

## 脚本文件

- `fetch-provider-aliyun-bailian.py` - 主要导入脚本
- `test-aliyun-bailian-conversion.py` - 测试转换逻辑的脚本
- `README-aliyun-bailian.md` - 本说明文档

## 功能特性

### 数据转换

1. **模型信息转换**：
   - 模型名称、ID、描述
   - 上下文窗口大小和最大输出token数
   - 模型URL (文档链接)

2. **供应商分类**：
   - 根据 `provider` 字段自动分类为不同的供应商
   - Moonshot AI (百炼)
   - 通义千问 (百炼)  
   - DeepSeek (百炼)
   - 智谱AI (百炼)
   - 通义万相 (百炼)

3. **能力标签转换**：
   - 输入/输出模态支持 (`text_input`, `image_input`, `video_input` 等)
   - 功能支持 (`function_calling`, `web_search`, `cache`, `structured_output`)
   - 基础能力 (`chat`, `tools`)

4. **定价转换**：
   - **Token定价**：从 `元/千Token` 转换为 `USD/百万Token`
   - **视频定价**：从 `元/秒` 转换为 `USD/秒`
   - **图片定价**：从 `元/张` 转换为 `USD/张`
   - 支持多层级定价 (如不同上下文长度的不同价格)
   - 货币从人民币自动转换为美元 (使用近似汇率 1:0.14)

## 使用方法

### 1. 测试数据转换

在实际导入数据库之前，建议先使用测试脚本验证转换逻辑：

```bash
python3 scripts/test-aliyun-bailian-conversion.py aliyun-bailian-data.json
```

这会显示：
- 转换后的模型数量
- 前几个模型的详细转换结果
- 按供应商和定价模型的统计汇总
- 单个组件的测试结果

### 2. 导入数据库

安装后端依赖后，使用主脚本导入数据：

```bash
# 使用默认数据库配置
python3 scripts/fetch-provider-aliyun-bailian.py aliyun-bailian-data.json

# 指定数据库文件
python3 scripts/fetch-provider-aliyun-bailian.py aliyun-bailian-data.json --database backend/app.db

# 使用完整数据库URL
python3 scripts/fetch-provider-aliyun-bailian.py aliyun-bailian-data.json --database sqlite:///backend/app.db
```

### 3. 查看帮助

```bash
python3 scripts/fetch-provider-aliyun-bailian.py -h
```

## 前置条件

### 测试转换逻辑
- Python 3.8+
- 只需标准库，无外部依赖

### 导入数据库
- Python 3.8+
- 安装后端依赖：
  ```bash
  pip install -r backend/requirements.txt
  ```

## 数据映射详情

### 源数据格式 (aliyun-bailian-data.json)
```json
{
  "models": [
    {
      "name": "模型名称",
      "model_id": "模型ID",
      "description": "模型描述",
      "provider": "供应商代码",
      "capabilities": {
        "function_calling": true/false,
        "web_search": true/false,
        "input_modalities": {"text": true, "image": false},
        "output_modalities": {"text": true, "image": false},
        "cache": true/false,
        "structured_output": true/false
      },
      "pricing": [
        {
          "range": "价格档位描述",
          "input_price": 0.006,
          "output_price": 0.024,
          "cache_price": 0.0012,
          "unit": "元/千Token"
        }
      ],
      "context_window": 262144,
      "max_output_tokens": 32768,
      "doc_url": "https://help.aliyun.com/..."
    }
  ]
}
```

### 目标数据格式 (项目数据库)
```json
{
  "vendorName": "通义千问 (百炼)",
  "model": "通义千问3-Max",
  "vendorModelId": "qwen3-max",
  "description": "模型描述...",
  "maxContextTokens": 262144,
  "maxOutputTokens": 32768,
  "modelCapability": ["chat", "function_calling", "tools", "web_search"],
  "modelUrl": "https://help.aliyun.com/...",
  "priceModel": "token",
  "priceCurrency": "USD",
  "priceData": {
    "base": {
      "input_token_1m": 0.84,
      "output_token_1m": 3.36,
      "cache_token_1m": 0.168
    },
    "tiers": [...]
  },
  "note": "数据来源：阿里云百炼平台"
}
```

## 转换样例

### Token定价转换
- **输入**：`0.006 元/千Token` (输入价格)
- **输出**：`0.84 USD/百万Token` (0.006 × 0.14 × 1000)

### 供应商映射
- `qwen` → `通义千问 (百炼)`
- `deepseek` → `DeepSeek (百炼)`
- `moonshot-ai` → `Moonshot AI (百炼)`

### 能力标签映射
- `function_calling: true` → `["function_calling", "tools"]`
- `input_modalities.text: true` + `output_modalities.text: true` → `["chat", "text_input", "text_output"]`

## 注意事项

1. **汇率转换**：脚本使用固定汇率 1 CNY = 0.14 USD，实际使用时可能需要更新
2. **数据重复**：如果数据库中已存在相同的 (vendor, vendorModelId)，会进行更新而非创建
3. **供应商创建**：脚本会自动创建不存在的供应商记录，包含适当的描述和URL
4. **错误处理**：转换过程中的错误会被记录但不会中断整个流程

## 输出样例

```
Loading data from aliyun-bailian-data.json...
Converting data format...
Found 26 models to import...
Ensuring vendors exist: 通义千问 (百炼), DeepSeek (百炼), Moonshot AI (百炼), 智谱AI (百炼), 通义万相 (百炼)
Import finished: created=26, updated=0, errors=0
```

## 故障排除

### 常见问题

1. **ModuleNotFoundError: No module named 'sqlalchemy'**
   - 解决：安装后端依赖 `pip install -r backend/requirements.txt`

2. **找不到数据库文件**
   - 检查数据库路径是否正确
   - 使用 `--database` 参数指定正确路径

3. **数据转换错误**
   - 使用测试脚本先验证数据格式
   - 检查JSON文件结构是否正确

### 调试模式

如果遇到问题，可以：
1. 先运行测试脚本检查转换逻辑
2. 检查原始JSON数据格式
3. 验证数据库连接和权限

## 维护

脚本设计为一次性导入工具，如需定期更新数据：
1. 获取新的 aliyun-bailian-data.json 文件
2. 运行测试脚本验证
3. 运行导入脚本更新数据库