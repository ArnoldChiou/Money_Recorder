// /api/getCarrierInvoices.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from "axios";
// Cheerio 的引入方式可能需要根據您的 TypeScript 設定做調整
import * as cheerio from "cheerio";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // 安全性檢查：只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { barcode, password } = req.body;

  if (!barcode || !password) {
    return res.status(400).json({ error: '手機條碼和驗證碼為必填' });
  }

  try {
    // ===================================================================
    //  核心爬蟲邏輯將會放在這裡
    //  目前我們先使用模擬資料來確保前後端流程通暢
    // ===================================================================
    console.log(`收到請求，手機條碼: ${barcode}`); // 您可以在 Vercel後台看到這個 log

    const mockInvoices = [
        { id: "VERCEL01", date: "2025-07-10", store: "7-11 (來自 Vercel)", amount: 150, details: "午餐便當" },
        { id: "VERCEL02", date: "2025-07-09", store: "全家 (來自 Vercel)", amount: 45, details: "拿鐵咖啡" },
        { id: "VERCEL03", date: "2025-07-08", store: "網路家庭 PChome", amount: 1280, details: "行動電源" },
    ];

    // 成功時回傳 200 OK
    return res.status(200).json({
      success: true,
      data: mockInvoices,
    });

  } catch (error: any) {
    console.error("抓取雲端載具失敗:", error);
    // 失敗時回傳 500
    return res.status(500).json({
      success: false,
      error: "抓取雲端載具時發生未預期的錯誤。",
    });
  }
}