# 电子衣橱 — AI智能穿搭助手

基于 uni-app (Vue 3) 的数字化衣橱管理应用，支持衣物管理、AI智能搭配推荐和虚拟试衣间。

## 功能模块

- **衣橱管理** — 添加/编辑/分类衣物，按类型、颜色、季节筛选
- **智能搭配** — 接入通义千问/通义万相 API，AI 自动生成穿搭方案
- **虚拟试衣间** — Canvas 引擎实现模特底图 + 衣物分层叠加，支持拖拽定位
- **穿搭日记** — 记录和分享日常穿搭
- **多端运行** — H5 + 微信小程序

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | uni-app 3.0 + Vue 3 + TypeScript |
| 构建 | Vite 5 |
| 状态管理 | Pinia |
| 3D 渲染 | Three.js |
| AI 接口 | DashScope (通义万相 wan2.6-t2i) |
| 样式 | SCSS |

## 快速开始

```bash
# 安装依赖
npm install

# 启动 H5 开发服务器
npm run dev:h5
# 浏览器打开 http://localhost:5176

# 启动微信小程序开发
npm run dev:mp-weixin

# 构建
npm run build:h5
npm run build:mp-weixin
```

## 项目结构

```
src/
├── api/            # API 接口（DashScope 等）
├── components/     # 通用组件
│   ├── TryOnCanvas.vue   # 虚拟试衣 Canvas 引擎
│   ├── ModelSwitch.vue   # 男女模特切换
│   ├── OutfitCard.vue    # 穿搭卡片
│   └── ...
├── composables/    # 组合式函数
├── img/            # 图片资源（模特图等）
├── pages/          # 页面
│   ├── wardrobe/   # 衣橱（添加/详情/列表）
│   ├── match/      # 智能搭配/虚拟试衣
│   ├── diary/      # 穿搭日记
│   ├── auth/       # 登录/注册
│   └── ...
├── store/          # Pinia 状态管理
├── styles/         # 全局样式
└── utils/          # 工具函数
```

## 注意事项

- 首次使用需在应用中配置 DashScope API Key
- 衣物照片建议使用白底平铺图，Canvas 叠加效果最佳
- 模特图需为竖版全身站立照（背景透明）
