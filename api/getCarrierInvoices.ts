// /api/getCarrierInvoices.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from "axios";
import * as cheerio from "cheerio";
import https from 'https';

// 建立一個可重複使用的 axios instance，並設定 User-Agent 模擬瀏覽器
const instance = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    },
    // 忽略 SSL 憑證錯誤
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
});

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { barcode, password } = req.body;
    if (!barcode || !password) {
        return res.status(400).json({ error: '手機條碼和驗證碼為必填' });
    }

    try {
        // --- 步驟 1: 訪問新的登入頁面，取得 Cookie 和 Token ---
        // 已更新為新的 Portal 路徑
        const loginPageUrl = "https://www.einvoice.nat.gov.tw/portal/btc/btc504w";
        const loginPageRes = await instance.get(loginPageUrl);
        const cookies = loginPageRes.headers['set-cookie'];

        const $login = cheerio.load(loginPageRes.data);
        const csrfToken = $login('input[name="csrfToken"]').val();

        if (!csrfToken) {
            throw new Error("無法取得 CSRF token，網站可能已改版。");
        }

        // --- 步驟 2: 發送登入請求到新的 action URL ---
        // 已更新為新的登入 action 路徑
        const loginActionUrl = "https://www.einvoice.nat.gov.tw/portal/btc/v1/btc504w";
        const loginData = new URLSearchParams({
            'ID': barcode, // 欄位名稱已改變
            'PASSWORD': password, // 欄位名稱已改變
            'csrfToken': csrfToken as string,
            'g-recaptcha-response': '', // reCAPTCHA token，目前先留空
        });

        const loginRes = await instance.post(loginActionUrl, loginData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'Referer': loginPageUrl
            }
        });
        
        // 檢查登入是否成功
        if (loginRes.data.msg.includes("手機條碼或驗證碼錯誤")) {
            return res.status(401).json({ success: false, error: "手機條碼或驗證碼錯誤，請檢查後再試。" });
        }
        if (loginRes.data.code !== 200) {
            return res.status(401).json({ success: false, error: loginRes.data.msg || "登入失敗，未知錯誤。" });
        }

        // --- 步驟 3: 請求發票查詢頁面 ---
        // 已更新為新的查詢頁面路徑
        const queryPageUrl = "https://www.einvoice.nat.gov.tw/portal/btc/btc501w";
        const queryPageRes = await instance.get(queryPageUrl, {
             headers: { 'Cookie': cookies, 'Referer': loginActionUrl }
        });

        // --- 步驟 4: 解析查詢頁面並發送查詢請求 ---
        const $queryPage = cheerio.load(queryPageRes.data);
        const queryCsrfToken = $queryPage('input[name="csrfToken"]').val();
        
        // 已更新為新的查詢 action URL
        const queryActionUrl = "https://www.einvoice.nat.gov.tw/portal/btc/v1/btc501w";

        const now = new Date();
        const endDate = now.toISOString().slice(0, 10).replace(/-/g, '/');
        now.setMonth(now.getMonth() - 2); // 預設查詢最近三個月
        const startDate = now.toISOString().slice(0, 10).replace(/-/g, '/');

        const queryData = new URLSearchParams({
            'qryInvType': 'all',
            'qryWinning': 'N',
            'qryStartDate': startDate,
            'qryEndDate': endDate,
            'csrfToken': queryCsrfToken as string,
        });

        const queryRes = await instance.post(queryActionUrl, queryData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'Referer': queryPageUrl
            }
        });

        // --- 步驟 5: 解析最終的發票資料 ---
        const $queryResult = cheerio.load(queryRes.data);
        const invoices: any[] = [];
        
        $queryResult('tbody tr').each((index, element) => {
            const columns = $queryResult(element).find('td');
            const invNum = $queryResult(columns[2]).text().trim();
            if (invNum) { // 確保有發票號碼才是一筆有效的資料
                invoices.push({
                    id: invNum,
                    date: $queryResult(columns[1]).text().trim(),
                    store: $queryResult(columns[3]).text().trim(),
                    amount: parseFloat($queryResult(columns[4]).text().trim().replace(/,/g, '')) || 0,
                    details: $queryResult(columns[5]).find('a').first().text().trim() || "無品項資訊",
                });
            }
        });

        if (invoices.length === 0 && queryRes.data.includes("查無資料")) {
             return res.status(200).json({ success: true, data: [], message: "在指定的日期範圍內查無發票資料。" });
        }

        return res.status(200).json({
            success: true,
            data: invoices,
        });

    } catch (error: any) {
        console.error("抓取雲端載具失敗:", error.message);
        return res.status(500).json({
            success: false,
            error: "後端伺服器在抓取資料時發生錯誤，可能是財政部網站暫時不穩或結構已變更。",
        });
    }
}