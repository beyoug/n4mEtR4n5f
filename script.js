document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('usernameInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCountText = document.getElementById('resultCountText');
    const toast = document.getElementById('toast');

    const EQUIV_CLASSES_LIGHT = [
        ['a', '4'],
        ['e', '3'],
        ['i', '1'],
        ['o', '0']
    ];

    const EQUIV_CLASSES_BALANCED = [
        ['a', '4'],
        ['b', '8', '6'],
        ['e', '3'],
        ['g', '9', 'q'],
        ['i', 'l', '1'],
        ['m', '3'],
        ['o', '0'],
        ['s', '5'],
        ['t', '7'],
        ['z', '2']
    ];

    const leetnessRadios = document.querySelectorAll('input[name="leetness"]');
    const indicator = document.querySelector('.segment-indicator');
    const casingToggle = document.getElementById('casingToggle');
    const antiStutterToggle = document.getElementById('antiStutterToggle');
    const casingLabelText = document.getElementById('casingLabelText');
    const luckyBtn = document.getElementById('luckyBtn');
    const dictBtn = document.getElementById('dictBtn');
    const clearBtn = document.getElementById('clearBtn');

    // 动态更新分段选择器的背景滑块
    function updateIndicator() {
        const checked = document.querySelector('input[name="leetness"]:checked');
        if (!checked) return;
        const label = checked.nextElementSibling;
        indicator.style.width = label.offsetWidth + 'px';
        indicator.style.transform = `translateX(${label.offsetLeft}px)`;
    }

    // 初始化滑块位置 (稍作延迟以确保 DOM 渲染计算准确)
    setTimeout(updateIndicator, 50);

    leetnessRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateIndicator();
            if (inputEl.value.trim() !== '') handleGenerate();
        });
    });

    casingToggle.addEventListener('change', () => {
        if (inputEl.value.trim() !== '') handleGenerate();
    });

    antiStutterToggle.addEventListener('change', () => {
        if (inputEl.value.trim() !== '') handleGenerate();
    });


    let lastInputVal = '';

    // 监听输入：清洗数据、实时更新波浪示例并触发生成
    inputEl.addEventListener('input', () => {
        let val = inputEl.value;

        // 控制清空按钮显隐
        if (val.length > 0) {
            clearBtn.style.opacity = '1';
            clearBtn.style.pointerEvents = 'auto';
        } else {
            clearBtn.style.opacity = '0';
            clearBtn.style.pointerEvents = 'none';
        }

        let showFormatWarning = false;
        let showLengthWarning = false;

        // 1. 约束输入：仅允许字母、数字、下划线和中划线
        const sanitized = val.replace(/[^a-zA-Z0-9_\-]/g, '');
        if (val !== sanitized) {
            val = sanitized;
            showFormatWarning = true;
        }
        
        // 2. 约束长度：最大 16 个字符
        if (val.length > 16) {
            val = val.slice(0, 16);
            showLengthWarning = true;
        }

        // 3. 如果有任何违规，写回输入框并提示
        if (showFormatWarning || showLengthWarning) {
            inputEl.value = val;
            if (showFormatWarning) {
                showToast('仅允许输入字母、数字、下划线和中划线');
            } else if (showLengthWarning) {
                showToast('已限制最大输入为 16 个字符');
            }
        }

        // 4. 如果清洗或截断后，值与上次完全一样，则直接拦截，防止无意义的重新打乱生成
        if (val === lastInputVal) {
            return;
        }
        lastInputVal = val;

        const text = val.trim() || '8ey0ug';
        let waveStr = '';
        let nextShouldBeUpper = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (/[a-zA-Z]/.test(char)) {
                if (nextShouldBeUpper) {
                    waveStr += char.toUpperCase();
                    nextShouldBeUpper = false;
                } else {
                    waveStr += char.toLowerCase();
                    nextShouldBeUpper = true;
                }
            } else if (/[0-9]/.test(char)) {
                waveStr += char;
                nextShouldBeUpper = false; // 数字视为大写字母，强迫下一个字母变为小写
            } else {
                waveStr += char;
            }
        }
        if (waveStr.length > 6) {
            waveStr = waveStr.substring(0, 6) + '..';
        }
        casingLabelText.textContent = `大小写波浪 (${waveStr})`;

        // 动态叠字混排示例
        let dynamicStutter = null;
        for (let i = 0; i < text.length - 1; i++) {
            if (text[i].toLowerCase() === text[i+1].toLowerCase()) {
                const char = text[i].toLowerCase();
                let hasVariants = false;
                let variants = [];
                // 默认使用 BALANCED 字典来做 UI 预览
                for (const eqClass of EQUIV_CLASSES_BALANCED) {
                    if (eqClass.includes(char)) {
                        if (eqClass.length > 1) {
                            hasVariants = true;
                            variants = eqClass.filter(c => c !== char);
                        }
                        break;
                    }
                }
                if (hasVariants) {
                    let stutterLen = 2;
                    while (i + stutterLen < text.length && text[i + stutterLen].toLowerCase() === char) {
                        stutterLen++;
                    }
                    const originalStutter = text.substring(i, i + stutterLen);
                    let altStr = char;
                    for (let j = 1; j < stutterLen; j++) {
                        altStr += (j % 2 === 1) ? variants[0] : char;
                    }
                    dynamicStutter = `(${originalStutter}→${altStr})`;
                    break;
                }
            }
        }

        const stutterLabel = document.getElementById('antiStutterLabelText');
        if (stutterLabel) {
            if (dynamicStutter) {
                stutterLabel.textContent = `叠字混排 ${dynamicStutter}`;
            } else {
                stutterLabel.textContent = `叠字混排 (555→5s5)`;
            }
        }

        handleGenerate();
    });

    luckyBtn.addEventListener('click', () => {
        const text = inputEl.value.trim();
        if (!text) return;

        handleGenerate();
        const allResults = Array.from(document.querySelectorAll('.result-item')).map(c => c.textContent.trim());
        if (allResults.length === 0) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="slot-machine" id="slotText">...</div>
                <button id="closeModal" class="btn-primary" style="width: 100%;">关闭</button>
                <div style="margin-top:1.5rem;font-size:0.95rem;color:var(--text-muted)">已自动复制到剪贴板</div>
            </div>
        `;
        document.body.appendChild(modal);
        void modal.offsetWidth; // trigger reflow
        modal.classList.add('show');

        const slotText = modal.querySelector('#slotText');

        modal.querySelector('#closeModal').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });

        let spins = 0;
        const interval = setInterval(() => {
            slotText.textContent = allResults[Math.floor(Math.random() * allResults.length)];
            spins++;
            if (spins >= 15) {
                clearInterval(interval);
                const finalPick = allResults[Math.floor(Math.random() * allResults.length)];
                slotText.textContent = finalPick;
                slotText.style.transform = 'scale(1.15)';
                setTimeout(() => slotText.style.transform = 'scale(1)', 200);
                copyToClipboard(finalPick);
            }
        }, 50);
    });

    dictBtn.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 280px; padding: 1.5rem;">
                <div style="font-weight: 600; margin-bottom: 1rem; color: var(--text-main); font-size: 0.95rem;">字符映射规则</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; text-align: center; font-size: 0.9rem; font-family: monospace; font-weight: 500;">
                    <div><span style="color:var(--text-muted)">a</span>→<span style="color:var(--primary)">4</span></div>
                    <div><span style="color:var(--text-muted)">b</span>→<span style="color:var(--primary)">8/6</span></div>
                    <div><span style="color:var(--text-muted)">e</span>→<span style="color:var(--primary)">3</span></div>
                    <div><span style="color:var(--text-muted)">g</span>→<span style="color:var(--primary)">9/q</span></div>
                    <div><span style="color:var(--text-muted)">i</span>→<span style="color:var(--primary)">l/1</span></div>
                    <div><span style="color:var(--text-muted)">m</span>→<span style="color:var(--primary)">3</span></div>
                    <div><span style="color:var(--text-muted)">o</span>→<span style="color:var(--primary)">0</span></div>
                    <div><span style="color:var(--text-muted)">s</span>→<span style="color:var(--primary)">5</span></div>
                    <div><span style="color:var(--text-muted)">t</span>→<span style="color:var(--primary)">7</span></div>
                    <div><span style="color:var(--text-muted)">z</span>→<span style="color:var(--primary)">2</span></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        void modal.offsetWidth; // trigger reflow
        modal.classList.add('show');

        // 点击背景或弹窗直接关闭
        modal.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 200);
        });
    });

    // 清空按钮点击逻辑
    clearBtn.addEventListener('click', () => {
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input'));
        inputEl.focus();
    });



    function handleGenerate() {
        const text = inputEl.value.trim();
        if (!text) {
            resultsContainer.innerHTML = '';
            resultCountText.textContent = '已准备就绪';
            return;
        }

        // 为了防止极长字符串导致浏览器卡死，限制输入长度
        if (text.length > 16) {
            return; // 静默拦截，保持原生手感
        }

        const results = new Set();
        const level = parseInt(document.querySelector('input[name="leetness"]:checked').value);
        let currentClasses = EQUIV_CLASSES_BALANCED;
        if (level === 1) currentClasses = EQUIV_CLASSES_LIGHT;

        // --- 核心优化：强制还原绝对原文 ---
        // L1 不需要特别处理，仅在 L2 和 L3 强度下，将输入字符逆向解析为基础字母作为兜底
        if (level > 1) {
            let pureBaseStr = '';
            for (let i = 0; i < text.length; i++) {
                const lowerChar = text[i].toLowerCase();
                let baseChar = lowerChar;
                for (const eqClass of currentClasses) {
                    if (eqClass.includes(lowerChar)) {
                        baseChar = eqClass[0];
                        break;
                    }
                }
                pureBaseStr += baseChar;
            }
            results.add(pureBaseStr);
        }

        function isVariantChar(char) {
            const lower = char.toLowerCase();
            for (const eqClass of currentClasses) {
                if (eqClass.includes(lower)) {
                    // 如果该字符不是等价类中的第一个（即基础英文字母），则被视为变体
                    return eqClass[0] !== lower;
                }
            }
            return false;
        }

        /**
         * 回溯算法生成所有可能的组合
         * @param {number} index 当前处理的字符索引
         * @param {string} currentStr 当前累积的字符串
         * @param {boolean} prevIsVariant 前一个字符是否是变体
         */
        function backtrack(index, currentStr, prevIsVariant) {
            if (index === text.length) {
                if (casingToggle.checked) {
                    let waveStr = '';
                    let nextShouldBeUpper = false;
                    for (let i = 0; i < currentStr.length; i++) {
                        const char = currentStr[i];
                        if (/[a-zA-Z]/.test(char)) {
                            if (nextShouldBeUpper) {
                                waveStr += char.toUpperCase();
                                nextShouldBeUpper = false;
                            } else {
                                waveStr += char.toLowerCase();
                                nextShouldBeUpper = true;
                            }
                        } else if (/[0-9]/.test(char)) {
                            waveStr += char;
                            nextShouldBeUpper = false; // 数字视为大写，断开大写连绵
                        } else {
                            waveStr += char;
                        }
                    }
                    results.add(waveStr);
                } else {
                    results.add(currentStr);
                }
                return;
            }

            const char = text[index];
            const lower = char.toLowerCase();

            // 获取当前字符所属等价类的所有成员（默认只有自己）
            let classMembers = [lower];
            for (const eqClass of currentClasses) {
                if (eqClass.includes(lower)) {
                    classMembers = eqClass;
                    break;
                }
            }

            // 遍历所有等同意义的字符
            for (const member of classMembers) {
                // 如果是输入的原字符，保留其原始大小写，否则使用字典中的小写字符
                const charToAdd = (member === lower) ? char : member;
                const memberIsVariant = isVariantChar(member);

                if (level === 2) {
                    // Level 2 (均衡模式): 避免出现连续的两个变体
                    if (prevIsVariant && memberIsVariant) {
                        continue; // 此组合不合法，直接剪枝跳过
                    }
                }

                // 新增高级规则：强制叠字混排 (Anti-Stutter)
                if (antiStutterToggle.checked && index > 0) {
                    const prevCharAdded = currentStr[currentStr.length - 1].toLowerCase();
                    // 当该字符所在的等价池有多于1个选项时，我们才强制它不能和上一个输出的字符一样
                    if (classMembers.length > 1 && prevCharAdded === member.toLowerCase()) {
                        continue;
                    }
                }

                backtrack(index + 1, currentStr + charToAdd, memberIsVariant);
            }
        }

        // 开始生成
        backtrack(0, "", false);

        // 渲染结果
        renderResults(Array.from(results), text);
    }

    function renderResults(resultsArray, originalText) {
        resultsContainer.innerHTML = '';

        let displayArray = resultsArray;
        if (resultsArray.length > 200) {
            displayArray = displayArray.sort(() => Math.random() - 0.5).slice(0, 200);
            resultCountText.innerHTML = `已生成 <strong style="color:var(--text-main)">${resultsArray.length}</strong> 种，展示前 200 种`;
        } else {
            resultCountText.innerHTML = `已生成 <strong style="color:var(--text-main)">${resultsArray.length}</strong> 种结果`;
        }

        // 核心排序逻辑
        function getMask(str) {
            let mask = '';
            for (let i = 0; i < str.length; i++) {
                if (str[i].toLowerCase() !== originalText[i].toLowerCase()) mask += '*';
                else mask += str[i].toLowerCase();
            }
            return mask;
        }

        displayArray.sort((a, b) => {
            const maskA = getMask(a);
            const maskB = getMask(b);
            if (maskA !== maskB) return maskA.localeCompare(maskB);
            return a.localeCompare(b);
        });

        displayArray.forEach((res, index) => {
            const card = document.createElement('div');
            card.className = 'result-item';
            card.textContent = res;
            card.style.animationDelay = `${(index % 20) * 0.03}s`;

            card.addEventListener('click', () => {
                copyToClipboard(res);
            });

            resultsContainer.appendChild(card);
        });
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('已复制到剪贴板！');
            }).catch(err => {
                console.error('复制失败:', err);
                fallbackCopyTextToClipboard(text);
            });
        } else {
            fallbackCopyTextToClipboard(text);
        }
    }

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // 避免滚动
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast();
        } catch (err) {
            console.error('降级复制也失败了', err);
        }
        document.body.removeChild(textArea);
    }

    let toastTimeout;
    function showToast(msg = '已复制到剪贴板！') {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
});
