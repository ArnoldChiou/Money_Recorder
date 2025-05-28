# 錢錢追蹤器 (Money Tracker)

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
一個使用 React、Vite、TypeScript 和 Tailwind CSS 建置的現代化個人收支記錄應用程式。幫助您輕鬆追蹤、管理和分析您的財務狀況。

**[🔗 線上預覽連結 (如果有的話，請替換此處)](https://your-live-demo-link.com)**

## ✨ 主要功能

* **新增收支記錄**: 快速記錄您的日常支出與收入。
* **自訂分類與項目**: 靈活管理您的消費類別與具體項目。
* **收支列表**: 清晰展示所有交易記錄，並支援直接編輯與刪除。
* **財務總覽**:
    * 顯示總收入、總支出及淨額。
    * **分類佔比圓餅圖**: 視覺化展示不同支出/收入分類的佔比。
    * **每月收支趨勢折線圖**: 分析每月收入與支出的變化趨勢。
* **響應式側邊導覽列**:
    * 方便在不同功能區塊間切換。
    * 支援寬度拖曳調整 (桌面版)。
    * 行動裝置上自動收合，並提供漢堡選單。
* **動態新增分類/項目**: 在輸入表單或編輯列表時，可即時新增新的分類或項目。
* **本地儲存**: 所有資料使用瀏覽器的 LocalStorage 進行儲存。

## 🛠️ 使用技術

* **前端框架**: [React](https://react.dev/) (使用 Hooks)
* **建置工具**: [Vite](https://vitejs.dev/)
* **程式語言**: [TypeScript](https://www.typescriptlang.org/)
* **樣式**: [Tailwind CSS](https://tailwindcss.com/)
* **圖表**: [Chart.js](https://www.chartjs.org/) (透過 [react-chartjs-2](https://react-chartjs-2.js.org/))
* **狀態管理**: React Context API + `useReducer`
* **ESLint**: 用於程式碼品質與風格檢查

## 🚀 開始使用

### 環境需求

* [Node.js](https://nodejs.org/) (建議使用 LTS 版本，例如 v18.x 或 v20.x)
* [npm](https://www.npmjs.com/) (通常隨 Node.js 安裝) 或 [yarn](https://yarnpkg.com/)

### 安裝依賴

1.  **複製儲存庫 (Clone the repository):**
    ```bash
    git clone https://github.com/ArnoldChiou/Money_Recorder.git
    cd Money_Recorder
    ```
2.  **安裝依賴:**
    在專案根目錄下執行：
    ```bash
    npm install
    # 或
    yarn install
    ```
3.  **設定FireBase:**
    複製firebaseConfig_example.ts並重新命名為firebaseConfig.ts
    將firebase設定貼上取代


### 開發模式

啟動本地開發伺服器：

```bash
npm run dev
# 或
yarn dev
```

應用程式將會在 `http://localhost:5173` (預設，或 Vite 指定的其他埠號) 啟動。

### 生產環境建置

建置用於生產環境的檔案：

```bash
npm run build
# 或
yarn build
```

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

建置後的檔案會存放在 `dist` 目錄下。您可以將此目錄的內容部署到任何靜態網站託管服務。

### 程式碼檢查 (Lint)

執行 ESLint 檢查：

```bash
npm run lint
# 或
yarn lint
```

## 📂 專案結構 (src)

```
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
```

## 📄 授權條款 (License)

此專案採用 [MIT 授權條款](LICENSE.md)。 (建議您在專案中加入一個 `LICENSE.md` 檔案，並選擇適合的授權條款，例如 MIT)

## 🔮 未來展望 (建議的優化方向)

* **預算管理系統**: 設定每月分類預算並追蹤達成率。
* **進階篩選與搜尋**: 在收支列表加入更強大的篩選與搜尋功能。
* **定期交易設定**: 自動記錄固定收支。
* **多帳戶管理**: 支援現金、銀行、信用卡等多個帳戶。
* **資料匯出/匯入**: 提供 CSV/JSON 格式的資料操作。
* **後端整合與雲端同步**:
    * 考慮使用 Firebase, Supabase 或自建 API 實現使用者帳號與跨裝置同步。
* **單元/整合測試**: 使用 Vitest 或 React Testing Library 提升程式碼穩定性。
* **PWA (Progressive Web App)**: 提升離線體驗與可安裝性。
* **國際化 (i18n)**: 支援多國語言。
* **無障礙 (Accessibility, a11y)**: 持續優化鍵盤導覽與螢幕閱讀器支援。

## 🤝 貢獻

歡迎各種形式的貢獻！如果您有任何建議或發現問題，請隨時提出 [Issue](https://github.com/ArnoldChiou/Money_Recorder.git/issues)。

如果您想貢獻程式碼，請遵循以下步驟：

1.  Fork 此儲存庫。
2.  建立您的功能分支 (`git checkout -b feature/AmazingFeature`)。
3.  提交您的變更 (`git commit -m 'Add some AmazingFeature'`)。
4.  將分支推送到遠端 (`git push origin feature/AmazingFeature`)。
5.  開啟一個 Pull Request。

---

希望這個 README 對您有所幫助！請記得替換 `your-username/your-repo-name` 以及線上預覽連結。
