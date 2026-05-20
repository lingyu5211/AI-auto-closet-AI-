# 穿搭功能设计说明书

## 概述

利用男女模特图片（`src/img/boy_model.png`, `src/img/girl_model.png`）改造穿搭功能，实现双模式体验：
- **智能穿搭页**：推荐结果以模特穿搭预览形式展示
- **虚拟试衣间**：基于模特底图自由叠加衣物图层

## 技术决策

| 决策 | 选择 |
|------|------|
| 模式 | 双模式并行（智能推荐 + 手动试穿） |
| 渲染方式 | Canvas 合成渲染 |
| 模特性别 | 默认跟随用户性别，页面可手动切换 |
| 模特图片 | 使用 src/img/ 中的图片，需先抠图处理 |

## 架构

```
matchStore (Pinia)
  ├── 智能穿搭页 (match/index)
  │   └── OutfitCard → OutfitPreview → TryOnCanvas (静态模式)
  └── 手动搭配页 (match/manual)
      └── DressingRoom → TryOnCanvas (交互模式)
```

共用组件 `TryOnCanvas` 提供两种模式：
- **静态模式** (`interactive=false`)：预览用，纯渲染输出
- **交互模式** (`interactive=true`)：试穿用，支持拖拽/缩放

## Canvas 渲染层级（从底到顶）

1. 背景层
2. 模特底图层（boy_model.png / girl_model.png）
3. 内衣/打底层 (z:100)
4. 上衣层 (z:200)
5. 下装层 (z:300)
6. 外套层 (z:400)
7. 鞋子层 (z:500)
8. 配饰层 (z:600)

## 衣物映射区域

每种衣物类型预设模特身上的渲染区域：
- 外套/上衣：胸部到腰部区域
- 下装：腰部到脚踝区域
- 鞋子：脚部区域
- 配饰：帽子（头部）/ 包包（手部）/ 围巾（颈部）

渲染时按衣物类型预设比例缩放。

## TryOnCanvas 组件 API

**Props:**
- `modelSrc: string` — 模特图片路径
- `clothes: Clothing[]` — 要渲染的衣物列表
- `interactive: boolean` — 是否可交互（默认 false）
- `canvasWidth: number` — 画布宽度
- `canvasHeight: number` — 画布高度

**Events:**
- `@update(clothes)` — 衣物位置/大小变更
- `@export(dataURL)` — 导出穿搭图片

**Exposed Methods:**
- `addClothing(item)` — 添加衣物
- `removeClothing(id)` — 移除衣物
- `exportImage()` — 导出为图片
- `reset()` — 清空画布

## 文件改动

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/TryOnCanvas.vue` | 新建 | Canvas 合成引擎 |
| `src/components/ModelSwitch.vue` | 新建 | 男/女模特切换 |
| `src/pages/match/index.vue` | 改造 | 卡片增加模特预览区 |
| `src/pages/match/manual.vue` | 重写 | 虚拟试衣间 |
| `src/components/OutfitCard.vue` | 改造 | 新增模特预览区域 |
| `src/store/match.ts` | 增强 | modelGender 状态 |

## 移除内容

manual.vue 中以下逻辑被 TryOnCanvas 替代：
- 照片上传 (uploadPhoto)
- maskCanvas + 手动抠图
- remove.bg 引导卡片
- 画笔擦除/恢复/快速抠图

## 实现顺序

1. TryOnCanvas 核心组件（静态模式）
2. 虚拟试衣间改造（manual.vue + 交互模式）
3. 智能推荐页改造（index.vue + OutfitCard）
4. match Store 增强（modelGender 状态）
5. 导出 + 联调
