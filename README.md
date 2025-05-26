錢錢追蹤器 (Money Tracker)
一個使用 React、Vite、TypeScript 和 Tailwind CSS 建置的現代化個人收支記錄應用程式。幫助您輕鬆追蹤、管理和分析您的財務狀況。

✨ 主要功能
新增收支記錄: 快速記錄您的日常支出與收入。

自訂分類與項目: 靈活管理您的消費類別與具體項目。

收支列表: 清晰展示所有交易記錄，並支援直接編輯與刪除。

財務總覽:

顯示總收入、總支出及淨額。

分類佔比圓餅圖: 視覺化展示不同支出/收入分類的佔比。

每月收支趨勢折線圖: 分析每月收入與支出的變化趨勢。

響應式側邊導覽列:

方便在不同功能區塊間切換。

支援寬度拖曳調整 (桌面版)。

行動裝置上自動收合，並提供漢堡選單。

動態新增分類/項目: 在輸入表單或編輯列表時，可即時新增新的分類或項目。

本地儲存: 所有資料使用瀏覽器的 LocalStorage 進行儲存。

🛠️ 使用技術
前端框架: React (使用 Hooks)

建置工具: Vite

程式語言: TypeScript

樣式: Tailwind CSS

圖表: Chart.js (透過 react-chartjs-2)

狀態管理: React Context API + useReducer

ESLint: 用於程式碼品質與風格檢查

🚀 開始使用
環境需求
Node.js (建議使用 LTS 版本)

npm 或 yarn

安裝依賴
在專案根目錄下執行：

npm install
# 或
yarn install

開發模式
啟動本地開發伺服器：

npm run dev
# 或
yarn dev

應用程式將會在 http://localhost:5173 (預設) 啟動。

生產環境建置
建置用於生產環境的檔案：

npm run build
# 或
yarn build

建置後的檔案會存放在 dist 目錄下。

程式碼檢查 (Lint)
執行 ESLint 檢查：

npm run lint
# 或
yarn lint

📂 專案結構 (src)
src/
├── components/         # React 組件
│   ├── AddNewModal.tsx
│   ├── CategoryPieChart.tsx
│   ├── MonthlyTrendChart.tsx
│   ├── Sidebar.tsx
│   ├── SummaryReport.tsx
│   ├── TransactionForm.tsx
│   ├── TransactionItem.tsx
│   └── TransactionList.tsx
├── contexts/           # React Context
│   └── AppContext.tsx
├── assets/             # 靜態資源 (如圖片，目前範例中 icon.png 放在 public)
├── styles/             # 全域 CSS (如 index.css, App.css)
├── types.ts            # TypeScript 型別定義
├── App.tsx             # 主要應用程式組件
└── main.tsx            # 應用程式入口點

🔮 未來展望 (建議的優化方向)
預算管理系統: 設定每月分類預算並追蹤達成率。

進階篩選與搜尋: 在收支列表加入更強大的篩選與搜尋功能。

定期交易設定: 自動記錄固定收支。

多帳戶管理: 支援現金、銀行、信用卡等多個帳戶。

資料匯出/匯入: 提供 CSV/JSON 格式的資料操作。

後端整合與雲端同步:

考慮使用 Firebase, Supabase 或自建 API 實現使用者帳號與跨裝置同步。

單元/整合測試: 使用 Vitest 或 React Testing Library 提升程式碼穩定性。

PWA (Progressive Web App): 提升離線體驗與可安裝性。

🤝 貢獻
歡迎各種形式的貢獻！如果您有任何建議或發現問題，請隨時提出 Issue。

希望這個 README 對您有所幫助！