# 架構總覽
本文件提供 my-showroom 程式碼庫的快速、實用概覽，協助貢獻者迅速上手與貢獻。請隨專案演進持續更新。

## 1. 專案結構
[Project Root]/
├── public/                        # 靜態資產
├── src/
│   ├── app/                       # Next.js App Router pages/layouts
│   │   ├── (site)/layout.tsx       # 可選的站台版型包裝
│   │   ├── (site)/projects/[id]/page.tsx # 前台專案詳情頁（獨立路由）
│   │   ├── admin/                  # 後台登入 + 管理介面路由
│   │   │   ├── login/page.tsx       # 後台登入
│   │   │   ├── dashboard/page.tsx   # 舊路由轉址到 /admin/profile
│   │   │   ├── profile/page.tsx     # 後台分頁路由（獨立）
│   │   │   ├── projects/page.tsx
│   │   │   ├── projects/[id]/page.tsx # 後台專案獨立編輯頁
│   │   │   ├── carousel/page.tsx
│   │   │   ├── carousel/[id]/page.tsx # 後台輪播獨立編輯頁
│   │   │   ├── experience/page.tsx
│   │   │   ├── skills/page.tsx
│   │   │   ├── socials/page.tsx
│   │   │   └── messages/page.tsx
│   │   ├── layout.tsx              # 根版型
│   │   ├── page.tsx                # 主頁
│   │   ├── globals.css             # 全域樣式
│   │   ├── error.tsx               # 路由錯誤邊界
│   │   └── global-error.tsx        # 全域錯誤邊界
│   ├── components/                # UI 元件（前台 + 後台）
│   │   ├── admin/                  # 後台分頁元件
│   │   │   ├── AdminShell.tsx       # 後台共用 Shell（驗證 + Tabs 導覽）
│   │   │   ├── shared/              # 後台共用元件
│   │   │   │   └── ColorPicker.tsx  # 顏色選擇器（Default + Custom colors）
│   │   ├── Hero.tsx, About.tsx...  # 前台區塊元件
│   │   └── *.module.css            # 各區塊的 CSS Modules
│   └── lib/
│       └── supabase.ts             # Supabase client
├── .env                            # 環境變數（本機）
├── next.config.js
├── package.json
└── README.md

## 2. 高階系統示意圖
[訪客/管理員]
   |
   v
[Next.js 前端（Client Components）]
   |
   v
[Supabase]
   |-- Auth（email/password）
   |-- Postgres（內容資料表）
   |-- Storage（作品/輪播圖片）

## 3. 核心元件

### 3.1 前端（Web App）
名稱：My Showroom Web App
說明：單頁作品集站點，包含動畫區塊（Hero/About/Projects/Experience/Contact），另有後台管理介面提供內容 CRUD、排序與上傳。
補充：專案列表提供詳情路由，後台專案/輪播改為獨立編輯頁面。
技術：Next.js（App Router）、React、TypeScript、Tailwind CSS、CSS Modules、NextUI、Framer Motion、Swiper、DnD Kit、Plate（WYSIWYG 編輯器）
部署：Vercel 或任何相容 Next.js 的主機

### 3.2 後端服務

#### 3.2.1 Supabase
名稱：Supabase Backend
說明：負責驗證、內容儲存與圖片託管。前端直接從 Client Components 呼叫 Supabase。
技術：Supabase（Postgres、Auth、Storage）
部署：Supabase 雲端服務

## 4. 資料儲存

### 4.1 PostgreSQL（Supabase）
名稱：作品集內容資料庫
類型：PostgreSQL
用途：存放個人資料、作品集、經歷、技能、社群連結與訪客留言。
主要資料表：
- profile
- projects
- carousel_projects
- project_tag_colors
- experience
- skills
- social_links
- messages
補充欄位：
- projects.content：Plate 編輯器內容（建議 json/jsonb）
- project_tag_colors：跨 projects / carousel_projects 共用的 tag 顏色設定

### 4.2 Storage（Supabase）
名稱：作品圖片
類型：Supabase Storage
用途：存放作品圖片與輪播圖片。
Buckets：
- project-images
- carousel-images
補充：
- project-images/content/：Plate 內容內貼上圖片的上傳路徑

- project-images/content/：Plate 內容內貼上圖片的上傳路徑

## 5. 核心功能更新 (2025-12-29)
### 5.1 專案編輯器 (ProjectEditor)
*   **工具列增強**：恢復並強化了文字樣式、標題、區塊引用、程式碼區塊等功能。
*   **欄位佈局 (Column Layout)**：
    *   整合 `@platejs/layout`，支援多欄位排版。
    *   後台編輯器與前台頁面皆支援 RWD（桌面雙欄、手機單欄）。
*   **顏色選擇器 (ColorPicker)**：
    *   支援「預設顏色」與「自訂顏色」。
    *   新增「確認新增」與「刪除自訂顏色」功能，並同步更新 `project_tag_colors` 表格。
*   **儲存行為優化**：
    *   新專案儲存後重定向至該專案的編輯頁。
    *   既有專案儲存後停留在當前編輯頁。
*   **Markdown 表格**：支援從 Notion/Markdown 貼上表格。

### 5.2 輪播管理 (Carousel)
*   **獨立管理介面**：
    *   `CarouselList`：可拖瑞排序的輪播列表。
    *   `CarouselEditor`：獨立的輪播專案編輯器，支援圖片上傳與標籤管理。
*   **資料結構**：
    *   使用 `carousel_projects` 表格儲存輪播資料。
    *   共用 `project_tag_colors` 確保標籤顏色一致。

## 6. 外部整合 / API
服務：Supabase
用途：驗證、資料庫、儲存
整合方式：Supabase JS SDK（@supabase/supabase-js）

## 6. 部署與基礎設施
雲端服務商：Vercel（建議），或任何相容 Next.js 的主機
主要服務：Next.js 執行環境、Supabase 託管服務
CI/CD：未定義（若使用 GitHub Actions/Vercel 請補上）
監控與日誌：Console + Supabase logs（可選）

## 7. 安全性考量
驗證：Supabase Auth（email/password）
授權：Supabase RLS（Client 直連必需）
資料加密：傳輸採 TLS；靜態由 Supabase 託管
備註：
- Client 使用 NEXT_PUBLIC_SUPABASE_ANON_KEY，所有資料表必須啟用 RLS。
- 後台存取依賴 Supabase auth session。

## 8. 開發與測試環境
本機設定：
1) npm install
2) 設定 .env.local（Supabase URL + anon key）
3) npm run dev

測試框架：未定義
程式品質工具：ESLint（npm run lint）

## 9. 未來考量 / Roadmap
- 將敏感操作移至 server actions 或 API routes
- 加入自動化測試（unit + integration）
- 強化後台角色權限管理
- 補上 CI pipeline（lint/build）

## 10. 專案識別
專案名稱：My Showroom
Repository URL：（未提供）
主要聯絡人/團隊：（未提供）
最後更新日期：2025-12-28

## 11. 詞彙 / 縮寫
RLS：Row-Level Security（Supabase）
DnD：Drag and Drop
NextUI：Admin console 使用的 React UI library
