// /api/getCarrierInvoices.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from "axios";
import * as cheerio from "cheerio";

// 建立一個可重複使用的 axios instance
const instance = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    },
    // 財政部網站有時會需要帶 cookie，axios 會自動處理
    withCredentials: true,
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
        console.log("步驟 1: 開始訪問登入頁面...");
        const loginPageUrl = "https://www.einvoice.nat.gov.tw/APMEMBERVAN/GeneralCarrier/generalCarrier"; // 這個網址目前還是對的
        const loginPageRes = await instance.get(loginPageUrl);
        
        const cookies = loginPageRes.headers['set-cookie'];
        if (!cookies) {
            throw new Error("無法取得 Cookie，網站可能已阻擋請求。");
        }
        console.log("步驟 1: 成功取得 Cookie。");

        const $login = cheerio.load(loginPageRes.data);
        const csrfToken = $login('input[name="csrfToken"]').val();

        if (!csrfToken) {
            console.error("HTML內容:", $login.html()); // 印出整個HTML來除錯
            throw new Error("無法取得 CSRF token，網站結構已變更。");
        }
        console.log(`步驟 1: 成功取得 CSRF Token: ${csrfToken}`);

        console.log("步驟 2: 開始發送登入請求...");
        const loginActionUrl = "https://www.einvoice.nat.gov.tw/APMEMBERVAN/GeneralCarrier/GeneralCarrier";
        const loginData = new URLSearchParams({
            'version': 'v1.0',
            'loginType': '0',
            'serial': '',
            'cardType': '3J0002',
            'cardNo': barcode,
            'cardEncrypt': password,
            'imageCode': '', // 圖形驗證碼，目前先留空
            'isQRCode': 'false',
            'uuid': '',
            'focus': 'cardNo',
            'csrfToken': csrfToken as string,
        });

        const loginRes = await instance.post(loginActionUrl, loginData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'Referer': loginPageUrl
            }
        });
        console.log("步驟 2: 登入請求完成。");

        if (loginRes.data && loginRes.data.msg) {
             if (loginRes.data.msg.includes("手機條碼或驗證碼有誤")) {
                return res.status(401).json({ success: false, error: "手機條碼或驗證碼錯誤，請檢查後再試。" });
             }
             if (loginRes.data.code !== 200) {
                 return res.status(401).json({ success: false, error: `登入失敗: ${loginRes.data.msg}` });
             }
        }
        console.log("步驟 2: 登入成功！");


        console.log("步驟 3: 開始查詢發票...");
        const queryUrl = "https://www.einvoice.nat.gov.tw/APMEMBERVAN/GeneralCarrier/query";
        const now = new Date();
        const endDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
        now.setMonth(now.getMonth() - 2); // 預設查詢最近三個月
        const startDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
        
        const queryData = new URLSearchParams({
            'cardType': '3J0002',
            'cardNo': barcode,
            'startDate': startDate,
            'endDate': endDate,
            'onlyWinning': 'N',
            '__checkbox_onlyWinning': 'true',
        });
        
        const queryRes = await instance.post(queryUrl, queryData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'Referer': loginActionUrl
            }
        });
        console.log("步驟 3: 查詢請求完成。");

        const $query = cheerio.load(queryRes.data);
        const invoices: any[] = [];
        const errorMsg = $query('.p_r_1em.red.strong').text();
        if (errorMsg) {
             return res.status(400).json({ success: false, error: `查詢失敗: ${errorMsg}` });
        }
        
        $query('table.table-striped tbody tr').each((index, element) => {
            const columns = $query(element).find('td');
            const invNum = $query(columns[1]).text().trim();
            if (invNum) {
                invoices.push({
                    id: invNum,
                    date: $query(columns[2]).text().trim().replace(/(\d{3})\/(\d{2})\/(\d{2})/, (match, year, month, day) => `${parseInt(year) + 1911}-${month}-${day}`),
                    store: $query(columns[4]).text().trim(),
                    amount: parseFloat($query(columns[5]).text().trim().replace(/,/g, '')) || 0,
                    details: "需點擊查看",
                });
            }
        });
        console.log(`步驟 4: 解析完成，共找到 ${invoices.length} 筆發票。`);

        if (invoices.length === 0 && queryRes.data.includes("查無資料")) {
             return res.status(200).json({ success: true, data: [], message: "在指定的日期範圍內查無發票資料。" });
        }

        return res.status(200).json({
            success: true,
            data: invoices,
        });

    } catch (error: any) {
        console.error("抓取雲端載具時發生嚴重錯誤:", error.message);
        return res.status(500).json({
            success: false,
            error: "後端伺服器在抓取資料時發生錯誤，可能是財政部網站暫時不穩或結構已變更。",
        });
    }
}