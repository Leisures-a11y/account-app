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
    '醫療、保險': ['保險', '謝德貴', '馬偕', '台大生醫', '回診', '小森林'],
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
    '龜': ['帥哥', '老公'],
    'Home': ['家人', '家庭', '全家']
};

function getLocalDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

let currentData = {
    date: getLocalDateString(),
    amount: '',
    item: '',
    category: '',
    person: '兔',
    tutuAmount: ''
};

// 記錄是否已手動選擇，避免 input 事件覆寫
let isCategoryManual = false;
let isPersonManual = false;
let isDateManual = false;

function chineseToNumber(s) {
    if (!s) return 0;
    if (/^\d+$/.test(s)) return parseInt(s);
    const map = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '零': 0, '○': 0, '0': 0 };
    if (s.length === 1) return map[s] || 0;
    if (s.length === 2) {
        if (s[0] === '十') return 10 + map[s[1]];
        if (s[1] === '十') return map[s[0]] * 10;
        return map[s[0]] * 10 + map[s[1]];
    }
    if (s.length === 3) {
        if (s[1] === '十') return map[s[0]] * 10 + map[s[2]];
    }
    // 處理如 '二零二六' 等年份
    let res = '';
    for (let char of s) {
        res += (map[char] !== undefined) ? map[char] : char;
    }
    return parseInt(res) || 0;
}


function getConfig() {
    const saved = localStorage.getItem(CONFIG_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
}

function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function getCategory(text) {
    if (!text) return '';
    // 1. 優先檢查是否直接等於某個類別名稱
    if (Object.keys(CATEGORY_MAP).includes(text)) return text;
    // 2. 檢查是否包含在某個類別的關鍵字清單中
    for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(k => text.includes(k))) return cat;
    }
    return ''; // 取消 "其他"，若無匹配則回空值
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
    let content = val.trim();
    if (!content) return null;

    let finalDate = getLocalDateString();
    let dateStrLength = 0;

    // 1. 嘗試解析開頭的日期
    // 數字型日期: 2026/3/4, 3/4, 03/04 等 (支持 / . -)
    const dateMatch = content.match(/^(\d{2,4}[/.\-])?(\d{1,2})[/.\-](\d{1,2})(\s|$)/);
    // 中文型日期: 2026年3月4日, 三月四號, 十二月三十一日等
    const chinDateMatch = content.match(/^(([\d一二三四五六七八九十百]+)年)?([\d一二三四五六七八九十]+)月([\d一二三四五六七八九十]+)[日號](\s|$)/);

    if (dateMatch) {
        dateStrLength = dateMatch[0].length;
        let y = dateMatch[1] ? dateMatch[1].replace(/[/.\-]/, '') : new Date().getFullYear();
        if (y.toString().length === 2) y = '20' + y;
        let m = dateMatch[2].padStart(2, '0');
        let d = dateMatch[3].padStart(2, '0');
        finalDate = `${y}-${m}-${d}`;
    } else if (chinDateMatch) {
        dateStrLength = chinDateMatch[0].length;
        let y = chinDateMatch[2] ? chineseToNumber(chinDateMatch[2]) : new Date().getFullYear();
        if (y < 100) y += 2000;
        let m = String(chineseToNumber(chinDateMatch[3])).padStart(2, '0');
        let d = String(chineseToNumber(chinDateMatch[4])).padStart(2, '0');
        finalDate = `${y}-${m}-${d}`;
    }

    // 剩餘內容
    let remainContent = content.substring(dateStrLength).trim();

    // 將常見全形與半形標點符號替換為空格，並合併連續空格
    let normalized = remainContent.replace(/[，。！？；：、！!？?；;：:（）()[\]{}/\\|_~`'"]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalized) {
        return {
            date: finalDate,
            item: remainContent || '未命名項目',
            amount: '',
            tutuAmount: '',
            category: getCategory(remainContent),
            person: getPerson(remainContent, config.defaultPerson || '兔')
        };
    }

    // 尋找所有數字區塊
    const numbers = normalized.match(/\d+/g) || [];

    // 如果沒有數字，則視為只有項目
    if (numbers.length === 0) {
        return {
            date: finalDate,
            item: normalized,
            amount: '',
            tutuAmount: '',
            category: getCategory(normalized),
            person: getPerson(normalized, config.defaultPerson || '兔')
        };
    }

    // 第一個數字為一般金額，第二個數字為兔兔的金額
    const firstAmountStr = numbers[0];
    const secondAmountStr = numbers[1] || '';

    // 數字前的字串為項目（容許空格）
    const firstAmountIndex = normalized.indexOf(firstAmountStr);
    const item = normalized.substring(0, firstAmountIndex).trim();

    // 移除第一個金額後的所有內容，並將第二個金額字串替換為空格以利解析其餘欄位
    let remainStr = normalized.substring(firstAmountIndex + firstAmountStr.length);
    if (secondAmountStr) {
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
    let finalCategory = '';
    if (categoryInput) {
        const mappedCat = getCategory(categoryInput);
        if (mappedCat) {
            finalCategory = mappedCat;
        } else {
            finalCategory = categoryInput;
        }
    } else {
        finalCategory = getCategory(item);
    }

    let finalPerson = config.defaultPerson || '兔';
    if (personInput) {
        const mappedByInput = getPerson(personInput, '');
        if (mappedByInput) {
            finalPerson = mappedByInput;
        } else {
            finalPerson = '請選擇對象';
        }
    } else {
        finalPerson = getPerson(item, config.defaultPerson || '兔');
    }

    return {
        date: finalDate,
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
                <input type="text" id="mainInput" placeholder="3/4 早餐 100 兔 食 50 (日期 項目 金額 人 類別 兔兔金額)" autocomplete="off">
                <button class="mic-btn" id="micBtn" type="button" title="語音輸入">🎤</button>
            </div>

            <div class="preview-card" id="previewCard">
                <div class="preview-title">解析預覽</div>
                <div class="preview-grid">
                    <div class="preview-item clickable" id="boxDate">
                        <span class="label">日期 (點擊修改)</span>
                        <span class="value" id="viewDate">--</span>
                        <input type="date" id="datePicker" style="position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;">
                    </div>
                    <div class="preview-item">
                        <span class="label">金額 | 兔兔</span>
                        <span class="value" id="viewAmount">--</span>
                    </div>
                    <div class="preview-item">
                        <span class="label">項目</span>
                        <span class="value" id="viewItem">--</span>
                    </div>
                    <div class="preview-item clickable" id="boxCategory">
                        <span class="label">類別 (點擊修改)</span>
                        <span class="value" id="viewCategory">--</span>
                    </div>
                    <div class="preview-item clickable" id="boxPerson" style="grid-column: span 2; margin-top: 8px;">
                        <span class="label">對應對象 (點擊修改)</span>
                        <span class="value" id="viewPerson">--</span>
                    </div>
                </div>
            </div>

            <button class="btn-submit" id="submitBtn">立即儲存</button>
            <div id="statusMsg" class="status-msg"></div>
        </div>

        <button class="settings-btn" id="openSettings">⚙️</button>

        <!-- Selector Modal -->
        <div class="modal" id="selectorModal">
            <div class="modal-content">
                <h2 id="selectorTitle">選擇</h2>
                <div class="selector-options" id="selectorOptions"></div>
                <div class="btn-group">
                    <button class="btn-secondary" id="closeSelector">取消</button>
                </div>
            </div>
        </div>

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
    const micBtn = document.getElementById('micBtn');

    // 語音輸入邏輯
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            micBtn.classList.add('listening');
            showStatus('🎤 正在聆聽，請說話...', '');
        };

        recognition.onend = () => {
            micBtn.classList.remove('listening');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            mainInput.value = transcript;
            // 手動觸發 input 事件以觸發解析邏輯
            mainInput.dispatchEvent(new Event('input', { bubbles: true }));
            showStatus('✅ 語音輸入完成', 'success');
        };

        recognition.onerror = (event) => {
            console.error('語音辨識錯誤:', event.error);
            micBtn.classList.remove('listening');
            if (event.error === 'not-allowed') {
                showStatus('❌ 請允許麥克風權限', 'error');
            } else if (event.error === 'no-speech') {
                // 忽略沒說話的情況，不顯示錯誤訊息以免干擾
            } else {
                showStatus('❌ 語音辨識失敗 (' + event.error + ')', 'error');
            }
        };

        // 點擊輸入框時自動開啟語音 (符合 Android/iOS 手勢觸發要求)
        mainInput.addEventListener('click', () => {
            try {
                recognition.start();
            } catch (e) {
                // 忽略已在運行的錯誤
            }
        });

        // 麥克風按鈕點擊切換
        micBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                recognition.start();
            } catch (e) {
                recognition.stop();
            }
        });
    } else {
        micBtn.style.display = 'none';
        console.warn('此瀏覽器不支援 Web Speech API');
    }

    const selectorModal = document.getElementById('selectorModal');
    const selectorTitle = document.getElementById('selectorTitle');
    const selectorOptions = document.getElementById('selectorOptions');

    mainInput.addEventListener('input', (e) => {
        const parsed = parseInput(e.target.value);
        if (parsed) {
            const savedDate = currentData.date;
            const savedCategory = currentData.category;
            const savedPerson = currentData.person;

            currentData = parsed;
            // 如果手動選擇過，則維持手動選擇的值
            if (isDateManual) {
                currentData.date = savedDate;
            }
            if (isCategoryManual) currentData.category = savedCategory;
            if (isPersonManual) currentData.person = savedPerson;

            viewDate.innerText = currentData.date;
            document.getElementById('datePicker').value = currentData.date;

            // 顯示 金額 | 兔兔
            const amtStr = currentData.amount || '--';
            const tutuStr = currentData.tutuAmount ? ` | ${currentData.tutuAmount}` : '';
            viewAmount.innerText = amtStr + tutuStr;

            viewItem.innerText = currentData.item || '--';

            // 處理類別文字顏色與內容
            if (currentData.category) {
                viewCategory.innerText = currentData.category;
                viewCategory.classList.remove('error-text');
            } else {
                viewCategory.innerText = '請選擇類別';
                viewCategory.classList.add('error-text');
            }

            // 處理對象文字顏色
            if (currentData.person === '請選擇對象') {
                viewPerson.innerText = currentData.person;
                viewPerson.classList.add('error-text');
            } else {
                viewPerson.innerText = currentData.person || '--';
                viewPerson.classList.remove('error-text');
            }
        } else {
            // Reset preview if invalid
            isCategoryManual = false;
            isPersonManual = false;
            isDateManual = false;
            viewAmount.innerText = '--';
            viewItem.innerText = '--';
            viewCategory.innerText = '--';
            viewCategory.classList.remove('error-text');
            viewPerson.innerText = '--';
            viewPerson.classList.remove('error-text');
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
                const previewIds = ['viewAmount', 'viewItem', 'viewCategory', 'viewPerson'];
                previewIds.forEach(id => document.getElementById(id).innerText = '--');

                // 重置手動標記
                isCategoryManual = false;
                isPersonManual = false;
                isDateManual = false;

                // 日期恢復為今日
                currentData.date = getLocalDateString();

                document.getElementById('viewDate').innerText = currentData.date;
                document.getElementById('datePicker').value = currentData.date;

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

    // Selector Modal logic
    const openSelector = (title, options, onSelect) => {
        selectorTitle.innerText = title;
        selectorOptions.innerHTML = options.map(opt => `
            <div class="selector-item">${opt}</div>
        `).join('');

        selectorModal.style.display = 'flex';

        const items = selectorOptions.querySelectorAll('.selector-item');
        items.forEach(item => {
            item.onclick = () => {
                onSelect(item.innerText);
                selectorModal.style.display = 'none';
            };
        });
    };

    document.getElementById('closeSelector').onclick = () => {
        selectorModal.style.display = 'none';
    };

    document.getElementById('boxCategory').onclick = () => {
        const categories = Object.keys(CATEGORY_MAP);
        // 不再加入 "其他"
        openSelector('選擇類別', categories, (val) => {
            currentData.category = val;
            isCategoryManual = true;
            viewCategory.innerText = val;
            viewCategory.classList.remove('error-text');
        });
    };

    document.getElementById('boxPerson').onclick = () => {
        const persons = Object.keys(PERSON_MAP);
        const cfg = getConfig();
        if (cfg.defaultPerson && !persons.includes(cfg.defaultPerson)) {
            persons.push(cfg.defaultPerson);
        }
        openSelector('選擇對象', persons, (val) => {
            currentData.person = val;
            isPersonManual = true;
            viewPerson.innerText = val;
            viewPerson.classList.remove('error-text');
        });
    };

    // 原生日期選擇
    const dateBox = document.getElementById('boxDate');
    const datePicker = document.getElementById('datePicker');
    dateBox.onclick = () => {
        // 設定目前的日期給 picker，以防用戶手動輸入
        datePicker.value = currentData.date;
        datePicker.showPicker(); // 呼叫流覽器原生選擇器
    };

    datePicker.onchange = (e) => {
        const newVal = e.target.value;
        if (newVal) {
            currentData.date = newVal;
            isDateManual = true;
            viewDate.innerText = newVal;
        }
    };
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
