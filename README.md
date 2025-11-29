# My Showroom - Personal Portfolio

一個現代化、響應式且功能強大的個人作品集網站，內建完整的後台管理系統。

## ✨ 特色功能

### 前台展示 (Frontend)
- **動態 Hero 區塊**：支援打字機效果的職稱輪播，並可自定義每個職稱的專屬顏色。
- **作品集展示**：
  - 支援圖片輪播 (Image Slider)。
  - 拖曳排序 (Drag & Drop) 決定的自定義順序。
  - 平滑滾動 (Smooth Scroll) 導航。
- **職涯旅程**：優雅的時間軸設計，展示工作經歷與技能。
- **極致體驗**：
  - 全局 Loading 動畫，確保資源加載完畢後才優雅顯示。
  - 響應式設計，完美適配各種裝置。
  - 強制刷新置頂，確保最佳的第一印象。

### 後台管理 (Admin Dashboard)
- **個人資料管理**：編輯 Hero 標題、簡介、頭像、履歷連結。
- **職稱管理**：新增/刪除職稱，並可為每個職稱指定特定顏色。
- **作品集管理**：
  - 完整的 CRUD 功能。
  - **拖曳排序**：直觀地調整作品顯示順序。
  - 圖片上傳 (整合 Supabase Storage)。
- **經歷與技能管理**：管理工作經歷與技能標籤。
- **訊息中心**：查看訪客留言。

## 🛠️ 技術棧

- **框架**：[Next.js 14](https://nextjs.org/) (App Router)
- **語言**：TypeScript
- **樣式**：[Tailwind CSS](https://tailwindcss.com/), CSS Modules
- **UI 組件**：[NextUI](https://nextui.org/)
- **動畫**：[Framer Motion](https://www.framer.com/motion/)
- **後端服務**：[Supabase](https://supabase.com/)
  - Database (PostgreSQL)
  - Authentication
  - Storage
- **圖標**：Lucide React

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變量配置

請在根目錄建立 `.env.local` 文件，並填入您的 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

打開瀏覽器訪問 [http://localhost:3000](http://localhost:3000)。

## 🗄️ 資料庫設置 (Supabase)

本項目依賴以下 Supabase 表結構：

- `profile`: 存儲個人基本資料與 Hero 配置。
- `projects`: 存儲作品集數據 (含 `display_order` 用於排序)。
- `experience`: 存儲工作經歷。
- `skills`: 存儲技能分類與項目。
- `social_links`: 存儲社交媒體連結。
- `messages`: 存儲訪客留言。

### Storage
- Bucket: `project-images` (需設為 Public，並配置 RLS 允許管理員上傳)。

## 📝 部署

本項目可輕鬆部署至 [Vercel](https://vercel.com/) 或其他支援 Next.js 的平台。

---
Created with ❤️ by olen
