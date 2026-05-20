# 电子衣橱 — 穿搭功能开发文档

## 快速启动

```bash
cd project1
npm run dev:h5
# 浏览器打开 http://localhost:5176
```

## 添加衣物路径

### 页面入口
底部 Tab → **我的衣橱** → **添加衣物**（`pages/wardrobe/add`）

### 必填字段（影响穿搭功能）
| 字段 | 说明 | 示例 |
|------|------|------|
| 名称 | 衣物名 | 白色T恤 |
| 类型 | top/pants/skirt/coat/shoes/accessory | 上衣 |
| 子类型 | T恤/牛仔裤/风衣… | T恤 |
| 颜色 | 用于穿搭描述 | 白色 |
| 季节 | 春/夏/秋/冬/四季 | 夏 |
| 照片 | **衣物平铺图或白底图** | 手机拍照/相册选择 |

### 衣物照片建议
- 平铺拍摄，**纯色背景**（白底最佳）
- 光照均匀，避免阴影
- 不要穿在人身上拍摄
- 照片会直接叠加到模特 Canvas 上

### 衣物激活
添加后需在衣橱列表中将衣物标记为 **激活状态**，只有激活的衣物才会出现在：
- 智能推荐搭配
- 虚拟试衣间候选列表

---

## 穿搭功能架构

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/components/TryOnCanvas.vue` | Canvas 合成引擎，模特底图 + 衣物分层叠加，支持静态预览/交互拖拽双模式 |
| `src/components/ModelSwitch.vue` | 男女模特切换按钮，v-model 绑定 |

### 改造文件

| 文件 | 改动 |
|------|------|
| `src/pages/match/manual.vue` | 重写为虚拟试衣间（913→280行） |
| `src/pages/match/index.vue` | 增加模特预览 + ModelSwitch |
| `src/components/OutfitCard.vue` | 增加 TryOnCanvas 预览模式 |
| `src/store/match.ts` | 增加 modelGender / modelImage |

### Canvas 渲染层级（底→顶）

```
Layer 0: 背景
Layer 1: 模特底图 (boy_model.png / girl_model.png)
Layer 2: 内衣/打底 (z:100)
Layer 3: 上衣 (z:200)
Layer 4: 下装 (z:300)
Layer 5: 外套 (z:400)
Layer 6: 鞋子 (z:500)
Layer 7: 配饰 (z:600)
```

### TryOnCanvas API

| Props | 类型 | 说明 |
|-------|------|------|
| modelSrc | string | 模特图片路径 |
| clothes | Clothing[] | 衣物列表 |
| interactive | boolean | 是否可拖拽（默认 false） |
| canvasWidth | number | 画布宽（默认 375） |
| canvasHeight | number | 画布高（默认 500） |

| Events | 说明 |
|--------|------|
| @update(layers) | 拖拽位置变更 |
| @export(dataURL) | 导出图片 |

| 方法 (defineExpose) | 说明 |
|---------------------|------|
| addClothing(item) | 添加衣物到画布 |
| removeClothing(id) | 移除 |
| reset() | 清空 |
| exportImage() | 导出图片 |

### 注意
- **不要**在 `<style lang="scss">` 中添加 `@use`/`@import` 变量文件 — `vite.config.ts` 的 `additionalData` 已全局注入
- 模特图位于 `src/img/boy_model.png` 和 `src/img/girl_model.png`，需先用 remove.bg 抠图
- 衣物照片建议白底平铺，Canvas 叠加效果最佳
