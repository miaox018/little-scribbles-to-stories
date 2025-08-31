# StoryMagic - Little Scribbles to Stories

## 项目目标
将孩子的手绘涂鸦转换为专业的插图故事书，既保留原始创意，也保证连贯的阅读体验。

### 核心功能
- **图像分析**：使用 GPT-4o 进行视觉理解与低成本文本提取
- **插图生成**：使用 GPT-Image-1（gpt-image-1）生成高质量插图
- **故事文本**：提取并保存每页故事文本到 `original_text`/`final_text`
- **角色一致性**：按需保持角色视觉一致（仅当页面存在角色时）
- **队列处理**：可靠的多页面异步处理与重试
- **维护模式**：可一键对公众关闭访问（管理员可绕过）

### 设计原则（简洁优先）
- 由第 1 页设定风格与基调，后续页面在有角色时遵循一致性；无角色时优先创造力。
- 避免沉重的“全局角色表”，改用轻量风格线索与必要的一致性约束。
- 仅在需要时调用昂贵模型，并缓存可复用分析结果。

## 🆕 最新更新 (2025年1月)

### 队列系统实现
为了解决多页面故事处理失败的问题，我们实现了一个可靠的队列系统：

#### 处理模式（双路径可切换）
- **简洁管线（Simple Pipeline）**：以第 1 页锚定风格；后续页面按需保持一致。
- **队列异步处理**：每页独立作业，坚固的重试与最终化。

可通过特性开关进行切换/并行验证：
- `SIMPLE_PIPELINE=true` 启用简洁管线与新的编排/执行函数
- 默认保留现有队列路径，便于回滚

#### 架构总览（简洁管线 + Agentic 队列）
1. **transform-story**：入口，按特性开关将请求路由到简洁编排或传统队列
2. **simple-orchestrator（新）**：
   - 仅对第 1 页生成插图与简要风格线索（如色彩、笔触、构图）
   - 轻量文本提取（存 `original_text`/`final_text`）
   - 扫描 2..N 页是否含角色（`has_character`），并将风格线索/缩略图存入每页作业的 `payload`
3. **simple-page-worker（新）**：
   - 逐页执行：
     - `has_character=true`：应用来自第 1 页的简短一致性约束
     - `has_character=false`：仅沿用风格线索，释放场景创作
   - 采用退避与 `resume_at`，缓存 `visual_analysis`，幂等保存
4. **现有队列**：保留 `enqueue-story` + `page-worker` 路径以确保平滑过渡
5. **story_page_jobs**：统一作业表，持久化状态/重试/上下文

#### 技术优势
- ✅ 可靠的异步处理（不依赖EdgeRuntime.waitUntil）
- ✅ 自链式函数调用确保工作持久性
- ✅ 原子性作业声明和完成
- ✅ 自动故事状态最终化
- ✅ 角色一致性保证

### 角色一致性（按需生效）
- 第 1 页产出风格线索；如侦测到角色，提炼必要的一致性描述
- 仅当页面实际包含角色时才施加约束；否则保留创作空间
- 仍支持 `character_version` 以兼容既有数据

---

## 🔁 后端工作流（Mermaid）

```mermaid
flowchart TB
  subgraph Client
    direction TB
    U["User uploads pages"]
    Start["Create Story"]
    Poll["Poll story status"]
    View["View Story / PDF"]
  end

  subgraph EdgeFns
    direction TB
    T["transform-story"]
    SO["simple-orchestrator"]
    PW["simple-page-worker"]
    ENQ["enqueue-story"]
    PWW["page-worker"]
    GS["get-shared-story"]
    RE["regenerate-page"]
    SE["send-story-email"]
  end

  subgraph DB
    direction TB
    S[("stories")]
    P[("story_pages")]
    J[("story_page_jobs")]
  end

  U --> Start --> T
  T -->|"SIMPLE_PIPELINE=true"| SO
  T -->|"SIMPLE_PIPELINE=false"| ENQ

  SO -->|"Gen Page 1 + style cues"| PW
  SO -->|"seed 2..N has_character/style"| J
  ENQ --> J
  PW -->|"claim next job"| J
  PWW -->|"claim next job"| J
  PW -->|"write page/text/status"| P
  PWW -->|"write page/text/status"| P
  PW -->|"finalize story"| S
  PWW -->|"finalize story"| S
  PW -->|"429/1015 defer"| J
  PWW -->|"429/1015 defer"| J
  Poll --> S
  GS --> P
  View --> GS
  RE --> PW
  SE --> P
```

## 🐛 关键问题发现与修复 (2025年1月)

### 问题描述
在6月21日之后出现了以下异常：
- 转换过程频繁失败，即使只有2张图片
- OpenAI API使用记录显示6月21日后没有新图像生成
- Supabase显示图像创建成功，但实际生成失败
- **多页面故事处理失败**: 3页以上故事经常卡在"processing"状态

### 根本原因分析
经过代码审查发现关键问题：

#### 1. **模型配置不一致** (最严重)
```typescript
// ❌ 函数间模型不一致的问题
// transform-story 使用 dall-e-3
// regenerate-page 使用 gpt-image-1 (项目想要使用的模型)

// ✅ 修复后：统一使用 GPT-image-1
model: 'gpt-image-1'  // OpenAI 2025年4月发布的新模型
```

#### 2. **不一致的图像尺寸和质量配置**
```typescript
// ❌ 函数间配置不一致
// transform-story: 1024x1792, quality: 'standard'
// regenerate-page: 1024x1536, quality: 'medium'

// ✅ 修复后：统一配置
size: '1024x1536'     // 2:3 比例，适合儿童故事书
quality: 'medium'     // 平衡成本和质量
```

#### 3. **不充分的Rate Limiting处理**
- 原本页面间延迟只有5秒，对商业级使用不够
- 重试次数和指数退避时间较短

#### 4. **异步处理架构缺陷** (新发现)
```typescript
// ❌ 不可靠的异步处理
EdgeRuntime.waitUntil() // Supabase Edge Functions不支持
setTimeout() // 函数终止后不执行

// ✅ 修复后：队列系统
// 自链式HTTP调用，每个页面独立处理
```

### 修复内容

#### ✅ **已修复的问题**
1. **统一API模型**: 所有函数现在都使用 `gpt-image-1` 模型 (2025年4月发布)
2. **统一图像配置**: 所有函数使用统一的 `1024x1536` 尺寸和 `medium` 质量
3. **修正长宽比描述**: 更正prompt中的比例描述从错误的3:4改为正确的2:3
4. **改进重试逻辑**: 为 `regenerate-page` 函数添加了与 `transform-story` 相同的重试机制
5. **增强Rate Limiting**: 页面间延迟从5秒增加到8秒
6. **正确响应处理**: 支持GPT-image-1的base64和URL两种返回格式
7. **队列系统**: 实现可靠的异步处理系统
8. **角色一致性**: 添加character_sheet和character_version系统

#### 🔧 **具体修复代码位置**
- `supabase/functions/regenerate-page/index.ts`: 确认使用GPT-image-1模型和重试逻辑
- `supabase/functions/transform-story/openai-api.ts`: 更新为GPT-image-1模型并支持base64响应
- `supabase/functions/transform-story/index.ts`: 增加页面间延迟时间，添加队列路由逻辑
- `supabase/functions/enqueue-story/index.ts`: 新的队列管理函数
- `supabase/functions/page-worker/index.ts`: 新的页面处理函数
- `supabase/migrations/20250808120000_character_sheet_and_jobs.sql`: 数据库架构更新

### 预期效果
修复后应该解决：
- ✅ 图像生成失败问题
- ✅ Rate limiting错误
- ✅ 数据库记录与实际生成不一致的问题
- ✅ 多页面故事处理失败问题
- ✅ 角色一致性问题

## 🚀 技术架构

### 前端技术栈
- **React + TypeScript**: 现代化前端框架
- **Vite**: 快速构建工具
- **Tailwind CSS**: 实用CSS框架
- **shadcn-ui**: 高质量UI组件库

### 后端技术栈
- **Supabase**: 后端即服务平台
- **PostgreSQL**: 数据库
- **Supabase Edge Functions**: 无服务器计算
- **Deno**: Edge Functions运行时

### AI集成
- **OpenAI GPT-4o**：图像/文本混合分析（低 Token 文本提取、可复用视觉分析）
- **OpenAI GPT-Image-1**：插图生成（建议统一 `size: 1024x1536`, `quality: medium`）
- **提示工程**：
  - 第 1 页：风格设定 + 友好短提示
  - 后续页：条件一致性（仅角色出现时），场景页更自由

### 队列与简洁管线
- **简洁管线**：`simple-orchestrator` + `simple-page-worker`（按需一致性 + 缓存 + 退避）
- **兼容路径**：保留 `enqueue-story` + `page-worker` 已有实现
- **存储与作业**：统一使用 `story_page_jobs`，`payload` 承载上下文（如 `has_character`, `style_prompt`, `page1_thumb`）

## 📁 项目结构

```
├── src/
│   ├── components/           # React组件
│   │   ├── dashboard/       # 仪表板相关组件
│   │   └── ui/             # 基础UI组件
│   ├── hooks/              # React Hooks
│   ├── contexts/           # React Context
│   └── integrations/       # 第三方集成
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── transform-story/    # 核心转换功能
│   │   ├── enqueue-story/      # 队列管理
│   │   ├── page-worker/        # 页面处理工作器
│   │   └── regenerate-page/    # 页面重新生成
│   └── migrations/         # 数据库迁移
```

## 🔧 开发设置

### 环境要求
- Node.js 18+
- npm 或 yarn
- Supabase CLI

### 安装步骤
```bash
# 1. 克隆项目
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 环境变量配置
- 前端（Vercel）：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GOOGLE_AUTH_ENABLED`
  - `VITE_MAINTENANCE_MODE`（维护模式开关）
  - `SIMPLE_PIPELINE`（启用简洁管线的特性开关）
- 后端（Supabase Edge Functions）：
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 数据库迁移
需要手动应用队列系统迁移：
```sql
-- 在Supabase Dashboard SQL编辑器中运行
-- 文件: supabase/migrations/20250808120000_character_sheet_and_jobs.sql
```

## 🚀 部署到 Vercel

### 快速部署
1. **准备环境变量**：
   ```bash
   VITE_SUPABASE_URL=https://mpmbduoffaldnkhrkxxp.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE
   VITE_GOOGLE_AUTH_ENABLED=false
   ```

2. **部署到 Vercel**：
   - 连接 GitHub 仓库到 Vercel
   - 配置环境变量
   - 自动部署

详细部署指南请参考：[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

> 注意：Supabase Edge Functions 仅在 Supabase 端部署，Vercel 负责前端托管。

## 📊 使用限制与监控

### 用户限制 (非管理员)
- **每月故事数**: 根据订阅计划
- **每个故事页面数**: 最多8页  
- **页面重新生成**: 每个故事限制1次

### 管理员权限
- 无限制创建和重新生成
- 可管理其他用户权限
- 访问所有功能

## 🎨 艺术风格支持

1. **经典水彩 (classic_watercolor)**: 柔和的水彩画风格
2. **迪士尼动画 (disney_animation)**: 明亮的卡通美学
3. **写实数字艺术 (realistic_digital)**: 高质量数字插图
4. **日式动漫 (manga_anime)**: 日本动漫风格
5. **复古故事书 (vintage_storybook)**: 1950年代经典插图风格

## 🔄 故事转换流程

### 简洁管线（推荐体验路径）
1. **第 1 页**：生成插图 + 轻量风格线索 + 文本提取
2. **后续页**：
   - 有角色：引用风格线索＋简要一致性要求
   - 无角色：仅沿用风格线索，保持创意
3. **缓存与退避**：复用视觉分析；对 429/1015 设置 `resume_at` 延迟重试
4. **最终化**：按完成/部分/失败三态更新 `stories.status`

### 队列管线（稳定与回退）
1. **队列创建**：`enqueue-story` 创建作业
2. **页面处理**：`page-worker` 逐页处理并自唤醒
3. **状态更新**：原子声明与完成；失败时记录 `last_error`
4. **最终化**：自动统计完成度与失败页，设置 `stories.status`

## 🚨 故障排除

### 常见问题
1. **Rate Limiting错误**: 系统已有重试机制，通常会自动恢复
2. **图像生成失败**: 检查OpenAI API配额和网络连接
3. **存储错误**: 验证Supabase存储权限配置
4. **队列处理失败**: 检查page-worker函数日志和数据库作业状态

### 监控指标
- API调用成功率
- 图像生成时间
- 用户使用量
- 错误率统计
- 队列处理成功率
- 角色一致性验证

## 🔗 参考与背景
- 早期“简洁流”参考分支（统一 gpt-image-1，1024x1536，medium，轻量提示）：[pre-google-oauth](https://github.com/miaox018/little-scribbles-to-stories/tree/pre-google-oauth)
- 阶段性顺序逻辑（在单函数内顺序推进的思路，用于本次拆分为可持久队列的参考）：[stage-sequential-logic/async-processor.ts](https://github.com/miaox018/little-scribbles-to-stories/blob/stage-sequential-logic/supabase/functions/transform-story/async-processor.ts)

### 调试队列系统
```sql
-- 检查作业状态
SELECT * FROM story_page_jobs WHERE story_id = 'your-story-id';

-- 检查角色版本
SELECT id, character_version, character_sheet FROM stories WHERE id = 'your-story-id';
```

---

*最后更新: 2025年1月 - 增补简洁管线与后端工作流，保留可靠队列实现，统一模型与配置*
