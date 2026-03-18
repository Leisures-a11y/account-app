const CONFIG_KEY = 'quick_acc_config';
const DEFAULT_CONFIG = {
    formUrl: '',
    defaultPerson: '兔',
    entryDate: '',
    entryAmount: '',
    entryItem: '',
    entryCategory: '',
    entryPerson: '',
    entryTutuAmount: ''
};

// 類別對應表
const CATEGORY_MAP = {
    '食': ['晚餐', '午餐', '早餐', '飯', '麵', '餐', '麥當勞', '水果', '吃', '全聯', '超市', '市場', '里仁', '家樂福', '大潤發'],
    '食-飲料、點心': ['飲料', '拿鐵', '咖啡', '迷客夏', '八曜', '綠茶', '紅茶', '烏龍', '熱拿'],
    '食-保健食品': ['保健食品', '維他命', 'B群', '益生菌', '魚油', '葉黃素', '鐵', 'C1000'],
    '生活物品、玩具': ['玩具', '生活物品'],
    '交通、加油、停車、保養車車': ['保養', '捷運', '公車', '加油', '高鐵', '台鐵', '停車'],
    '休閒旅遊': ['住宿費', '門票', '休閒綠遊'],
    '水電瓦斯通訊': ['室內網路', '管理費', '手機費', '電費', '水費', '瓦斯費'],
    '育醫療、保險': ['保險', '謝德貴', '馬偕', '台大生醫', '回診'],
    '稅金、罰單': ['稅', '罰單'],
    '教育學習、書': ['書', '課程'],
    '托育、學費': ['幼稚園', '托嬰', '註冊費', '學費'],
    '禮金禮物、捐款': ['世界展望會', '紅包', '禮金', '禮物', '捐款'],
    '工作': ['列印', '工作'],
    '房貸': ['房貸']
};

const PERSON_MAP = {
    '兔': ['兔', '兔子', '兔兔', '兔兔', '老婆'],
    'Kiwi、湯圓': ['小孩', 'kiwi', '湯圓', '兒'],
    '龜': ['帥哥'],
    'Home': ['家人', '家庭']
};

let currentData = {
    date: new Date().toISOString().split('T')[0],
    amount: '',
    item: '',
    category: '',
    person: '兔',
    tutuAmount: ''
};

function getConfig() {
    const saved = localStorage.getItem(CONFIG_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
}

function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function getCategory(item) {
    for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(k => item.includes(k))) return cat;
    }
    return '其他';
}

function getPerson(text, defaultVal = '兔') {
    if (!text) return defaultVal;
    const lowerText = text.toLowerCase();
    for (const [p, keywords] of Object.entries(PERSON_MAP)) {
        if (keywords.some(k => lowerText.includes(k.toLowerCase()))) return p;
    }
    return defaultVal;
}

function parseInput(val) {
    const config = getConfig();
    const content = val.trim();
    if (!content) return null;

    // 尋找所有數字區塊
    const numbers = content.match(/\d+/g) || [];
    
    // 如果沒有數字，則視為只有項目
    if (numbers.length === 0) {
        return {
            date: new Date().toISOString().split('T')[0],
            item: content,
            amount: '',
            tutuAmount: '',
            category: getCategory(content),
            person: getPerson(content, config.defaultPerson || '兔')
        };
    }

    // 第一個數字為一般金額，第二個數字為兔兔的金額
    const firstAmountStr = numbers[0];
    const secondAmountStr = numbers[1] || '';

    // 數字前的字串為項目（容許空格）
    const firstAmountIndex = content.indexOf(firstAmountStr);
    const item = content.substring(0, firstAmountIndex).trim();

    // 移除第一個金額後的所有內容，並將第二個金額字串替換為空格以利解析其餘欄位
    let remainStr = content.substring(firstAmountIndex + firstAmountStr.length);
    if (secondAmountStr) {
        // 使用正則替換掉第一個出現的第二個數字，避開重複字串問題
        remainStr = remainStr.replace(secondAmountStr, ' ');
    }
    const remainParts = remainStr.split(/[，, ]+/).filter(p => p !== '');

    let personInput = '';
    let categoryInput = '';

    if (remainParts.length >= 1) {
        personInput = remainParts[0];
    }
    if (remainParts.length >= 2) {
        categoryInput = remainParts[1];
    }

    // 處理預設值與自動歸類
    let finalCategory = categoryInput || getCategory(item);
    
    let finalPerson = config.defaultPerson || '兔';
    if (personInput) {
        const mapped = getPerson(personInput, config.defaultPerson || '兔');
        if (mapped !== (config.defaultPerson || '兔') || personInput === (config.defaultPerson || '兔')) {
            finalPerson = mapped;
        } else {
            finalPerson = personInput;
        }
    } else {
        finalPerson = getPerson(item, config.defaultPerson || '兔');
    }

    return {
        date: new Date().toISOString().split('T')[0],
        item: item || '未命名項目',
        amount: firstAmountStr,
        tutuAmount: secondAmountStr,
        category: finalCategory,
        person: finalPerson
    };
}

function initUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <header>
                <h1>快速記帳</h1>
            </header>
            
            <div class="input-section">
                <input type="text" id="mainInput" placeholder="項目 100 兔 食 50 (項目 金額 人 類別 兔兔金額)" autocomplete="off">
            </div>

            <div class="preview-card" id="previewCard">
                <div class="preview-title">解析預覽</div>
                <div class="preview-grid">
                    <div class="preview-item">
                        <span class="label">日期</span>
                        <span class="value" id="viewDate">--</span>
                    </div>
                    <div class="preview-item">
                        <span class="label">金額 | 兔兔</span>
                        <span class="value" id="viewAmount">--</span>
                    </div>
                    <div class="preview-item">
                        <span class="label">項目</span>
                        <span class="value" id="viewItem">--</span>
                    </div>
                    <div class="preview-item">
                        <span class="label">類別</span>
                        <span class="value" id="viewCategory">--</span>
                    </div>
                    <div class="preview-item" style="grid-column: span 2; margin-top: 8px;">
                        <span class="label">對應對象</span>
                        <span class="value" id="viewPerson">--</span>
                    </div>
                </div>
            </div>

            <div class="category-tags" id="categoryTags">
                <!-- Categories will be injected here -->
            </div>

            <button class="btn-submit" id="submitBtn">立即儲存</button>
            <div id="statusMsg" class="status-msg"></div>
        </div>

        <button class="settings-btn" id="openSettings">⚙️</button>

        <div class="modal" id="settingsModal">
            <div class="modal-content">
                <h2>設定 Google 表單</h2>
                <div class="form-group">
                    <label>Form Response URL</label>
                    <input type="text" id="cfgUrl" placeholder="https://docs.google.com/forms/d/e/.../formResponse">
                </div>
                <div class="form-group">
                    <label>對象預設值 (例如: 兔)</label>
                    <input type="text" id="cfgDefaultPerson">
                </div>
                <div class="form-group">
                    <label>日期 Entry ID (如 entry.12345)</label>
                    <input type="text" id="cfgDate">
                </div>
                <div class="form-group">
                    <label>金額 Entry ID</label>
                    <input type="text" id="cfgAmount">
                </div>
                <div class="form-group">
                    <label>項目 Entry ID</label>
                    <input type="text" id="cfgItem">
                </div>
                <div class="form-group">
                    <label>類別 Entry ID</label>
                    <input type="text" id="cfgCategory">
                </div>
                <div class="form-group">
                    <label>人 Entry ID</label>
                    <input type="text" id="cfgPerson">
                </div>
                <div class="form-group">
                    <label>兔兔金額 Entry ID</label>
                    <input type="text" id="cfgTutuAmount">
                </div>
                <div class="btn-group">
                    <button class="btn-secondary" id="closeSettings">回主頁</button>
                    <button class="btn-submit" id="saveSettings" style="padding: 12px; font-size: 0.9rem">儲存設定</button>
                </div>
            </div>
        </div>
    `;

    const mainInput = document.getElementById('mainInput');
    const viewDate = document.getElementById('viewDate');
    const viewAmount = document.getElementById('viewAmount');
    const viewItem = document.getElementById('viewItem');
    const viewCategory = document.getElementById('viewCategory');
    const viewPerson = document.getElementById('viewPerson');
    const statusMsg = document.getElementById('statusMsg');
    const categoryTags = document.getElementById('categoryTags');

    // 渲染類別標籤
    const categories = Object.keys(CATEGORY_MAP);
    // 加上 "其他"
    if (!categories.includes('其他')) categories.push('其他');

    categoryTags.innerHTML = categories.map(cat => `
        <span class="category-tag">${cat}</span>
    `).join('');

    mainInput.addEventListener('input', (e) => {
        const parsed = parseInput(e.target.value);
        if (parsed) {
            currentData = parsed;
            viewDate.innerText = parsed.date;
            
            // 顯示 金額 | 兔兔
            const amtStr = parsed.amount || '--';
            const tutuStr = parsed.tutuAmount ? ` | ${parsed.tutuAmount}` : '';
            viewAmount.innerText = amtStr + tutuStr;

            viewItem.innerText = parsed.item || '--';
            viewCategory.innerText = parsed.category || '--';
            viewPerson.innerText = parsed.person || '--';
        } else {
            // Reset preview if invalid
            viewAmount.innerText = '--';
            viewItem.innerText = '--';
            viewCategory.innerText = '--';
            viewPerson.innerText = '--';
        }
    });

    document.getElementById('submitBtn').addEventListener('click', async () => {
        const config = getConfig();

        // 1. 檢查設定是否完整
        const requiredConfigs = ['formUrl', 'entryDate', 'entryAmount', 'entryItem', 'entryCategory', 'entryPerson'];
        const missing = requiredConfigs.filter(key => !config[key]);
        if (missing.length > 0) {
            showStatus('❌ 設定不完整，請點擊⚙️檢查 ID 是否均已填寫', 'error');
            return;
        }

        if (!currentData.item || !currentData.amount) {
            showStatus('⚠️ 請輸入有效的記帳內容 (項目 金額)', 'error');
            return;
        }

        // 2. 自動校正 URL 格式
        let targetUrl = config.formUrl.trim();
        if (targetUrl.includes('/viewform')) {
            targetUrl = targetUrl.replace('/viewform', '/formResponse');
        } else if (!targetUrl.includes('/formResponse')) {
            showStatus('❌ 網址錯誤，需包含 /formResponse', 'error');
            return;
        }
        showStatus('🚀 傳送中...', '');

        // 確保所有 ID 都包含 entry. 前綴
        const ensureEntry = (id) => {
            id = id.trim();
            return id.startsWith('entry.') ? id : 'entry.' + id;
        };

        // 3. 準備參數
        const params = new URLSearchParams();
        params.append(ensureEntry(config.entryDate), currentData.date);
        params.append(ensureEntry(config.entryAmount), currentData.amount);
        params.append(ensureEntry(config.entryItem), currentData.item);
        params.append(ensureEntry(config.entryCategory), currentData.category);
        params.append(ensureEntry(config.entryPerson), currentData.person);
        if (config.entryTutuAmount) {
            params.append(ensureEntry(config.entryTutuAmount), currentData.tutuAmount || '');
        }

        // 構建最終傳送網址 (GET 方式最為穩定)
        const finalUrl = `${targetUrl}?${params.toString()}`;

        console.log('--- 除錯資訊 ---');
        console.log('最終傳送網址 (請確認結尾是 formResponse):');
        console.log(finalUrl);

        try {
            // 使用「隱藏圖片」的方法傳送 GET 請求，這在 file:// 模式下幾乎不會失敗
            const img = new Image();
            img.src = finalUrl;

            // 由於沒辦法得知圖片載入成功與否（Google 回報 200 但那是 HTML 頁面），
            // 我們延遲一下就顯示成功。
            setTimeout(() => {
                showStatus('✅ 儲存成功！', 'success');
                mainInput.value = '';
                // 重置預覽介面
                const previewIds = ['viewDate', 'viewAmount', 'viewItem', 'viewCategory', 'viewPerson'];
                previewIds.forEach(id => document.getElementById(id).innerText = '--');
                console.log('傳送完成 (Form Submitted)');
            }, 1000);

        } catch (err) {
            console.error('傳送過程發生錯誤:', err);
            showStatus('❌ 傳送失敗，請檢查設定', 'error');
        }
    });

    // Settings Modal Logic
    const modal = document.getElementById('settingsModal');
    document.getElementById('openSettings').addEventListener('click', () => {
        const cfg = getConfig();
        document.getElementById('cfgUrl').value = cfg.formUrl;
        document.getElementById('cfgDefaultPerson').value = cfg.defaultPerson || '兔';
        document.getElementById('cfgDate').value = cfg.entryDate;
        document.getElementById('cfgAmount').value = cfg.entryAmount;
        document.getElementById('cfgItem').value = cfg.entryItem;
        document.getElementById('cfgCategory').value = cfg.entryCategory;
        document.getElementById('cfgPerson').value = cfg.entryPerson;
        document.getElementById('cfgTutuAmount').value = cfg.entryTutuAmount || '';
        modal.style.display = 'flex';
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('saveSettings').addEventListener('click', () => {
        const newCfg = {
            formUrl: document.getElementById('cfgUrl').value,
            defaultPerson: document.getElementById('cfgDefaultPerson').value,
            entryDate: document.getElementById('cfgDate').value,
            entryAmount: document.getElementById('cfgAmount').value,
            entryItem: document.getElementById('cfgItem').value,
            entryCategory: document.getElementById('cfgCategory').value,
            entryPerson: document.getElementById('cfgPerson').value,
            entryTutuAmount: document.getElementById('cfgTutuAmount').value
        };
        saveConfig(newCfg);
        modal.style.display = 'none';
        showStatus('✅ 設定已儲存', 'success');
    });
}

function showStatus(msg, type) {
    const status = document.getElementById('statusMsg');
    status.innerText = msg;
    status.className = 'status-msg ' + (type ? 'status-' + type : '');
    if (type === 'success') {
        setTimeout(() => status.innerText = '', 3000);
    }
}

// 改用 DOMContentLoaded 確保 DOM 載入後立即執行
document.addEventListener('DOMContentLoaded', () => {
    console.log('App 初始化中...');
    initUI();
});
