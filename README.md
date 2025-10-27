# 试题后台管理系统 (EduPro)

## 项目概述

基于 **React.js + Node.js + Express + PostgreSQL** 的试题后台管理系统，用于管理和标注试题图片，支持学科、年级、知识点、题型和难度的分类标注。

## 技术栈

- **前端**: React.js 18 + Ant Design + Vite
- **后端**: Node.js + Express.js + Sequelize ORM
- **数据库**: PostgreSQL
- **图片存储**: 本地文件存储（可扩展云存储）

## 项目结构

```
EduPro/
├── backend/           # Node.js + Express 后端服务
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── models/       # Sequelize 数据模型
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   └── utils/        # 工具函数
│   ├── config/           # 配置文件
│   └── package.json
├── frontend/          # React.js 前端应用
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── pages/        # 页面组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── services/     # API 服务
│   │   └── utils/        # 工具函数
│   └── package.json
├── shared/            # 共享代码
│   └── types/         # TypeScript 类型定义
├── database/          # 数据库相关
│   └── schema.sql     # 数据库结构（已有）
└── uploads/           # 图片上传目录
```

## 核心功能

1. **题目管理** - 浏览、搜索、筛选试题，编辑题目属性
2. **知识点管理** - 添加、编辑、删除知识点
3. **属性配置** - 维护学科、年级、题型选项
4. **图片管理** - 显示题干图与答案图，建立关联
5. **状态管理** - 标记题目状态（未处理/已标注）

## 快速开始

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 配置数据库

```bash
# 创建 PostgreSQL 数据库
createdb edupro_db

# 导入数据库结构
psql -d edupro_db -f ../database/schema.sql
```

### 3. 启动后端服务

```bash
cd backend
npm run dev
```

### 4. 安装前端依赖

```bash
cd frontend
npm install
```

### 5. 启动前端服务

```bash
cd frontend
npm run dev
```

## 使用说明

1. 打开浏览器访问 `http://localhost:3002`
2. 进入题目列表查看所有试题
3. 点击题目查看题干图和答案图
4. 为题目选择属性标签（学科、年级、知识点、题型、难度）
5. 保存后系统自动更新题目状态为"已标注"

## API 文档

- 后端API运行在 `http://localhost:5001`
- 前端开发服务器运行在 `http://localhost:3002`
- 支持图片格式：JPG, PNG, GIF

## 许可证

MIT License