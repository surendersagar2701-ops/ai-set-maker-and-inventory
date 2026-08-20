/* ============================================
   BANGLE STORE AI - COMPLETE APP v2.0
   WITH REAL AI + QR + OCR
   ============================================ */

// ============================================
   REAL QR SCANNER
   ============================================ */
let html5QrCode = null;
let isScanning = false;

function openRealScanner() {
    showModal('📷 QR/SKU Scanner', `
        <div id="qr-reader" style="width:100%;max-width:400px;margin:0 auto;"></div>
        <div id="qr-result" style="margin-top:12px;text-align:center;"></div>
        <div style="margin-top:12px;display:flex;gap:8px;">
            <button class="save-btn" onclick="startRealScanner()" style="flex:1;">▶️ Start</button>
            <button class="save-btn" onclick="stopRealScanner()" style="flex:1;background:var(--danger);">⏹️ Stop</button>
        </div>
        <div id="scannedQRProducts" style="margin-top:12px;"></div>
        <button class="save-btn" id="addQRScannedBtn" onclick="addQRScannedProducts()" style="display:none;background:var(--success);">✅ Add All Scanned</button>
    `);
    
    // Initialize scanner after modal opens
    setTimeout(() => {
        initRealScanner();
    }, 500);
}

function initRealScanner() {
    const element = document.getElementById('qr-reader');
    if (!element) return;
    
    if (html5QrCode) {
        html5QrCode.clear();
        html5QrCode = null;
    }
    
    html5QrCode = new Html5Qrcode("qr-reader");
    window.qrScannerInstance = html5QrCode;
}

function startRealScanner() {
    if (!window.qrScannerInstance) {
        showToast('❌ Scanner not initialized');
        return;
    }
    
    if (isScanning) return;
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    window.qrScannerInstance.start(
        { facingMode: "environment" },
        config,
        onQRScanSuccess,
        onQRScanError
    ).then(() => {
        isScanning = true;
        showToast('📷 Scanner started');
    }).catch(err => {
        console.error('Scanner start error:', err);
        showToast('❌ Camera access denied');
    });
}

function onQRScanSuccess(decodedText, decodedResult) {
    // Successfully scanned
    console.log('QR Scanned:', decodedText);
    document.getElementById('qr-result').innerHTML = `
        <div style="background:var(--success);color:white;padding:8px;border-radius:8px;">
            ✅ Scanned: ${decodedText}
        </div>
    `;
    
    // Add to scanned products
    const product = state.inventory.find(p => p.sku === decodedText);
    if (product) {
        if (!window.qrScannedItems) window.qrScannedItems = [];
        const existing = window.qrScannedItems.find(p => p.sku === product.sku);
        if (existing) {
            existing.quantity += 1;
        } else {
            window.qrScannedItems.push({ ...product, quantity: 1 });
        }
        renderQRScannedList();
    } else {
        showToast('❌ Product not found: ' + decodedText);
    }
}

function onQRScanError(err) {
    // Ignore errors (continues scanning)
}

function stopRealScanner() {
    if (window.qrScannerInstance && isScanning) {
        window.qrScannerInstance.stop().then(() => {
            isScanning = false;
            showToast('⏹️ Scanner stopped');
        });
    }
}

function renderQRScannedList() {
    const container = document.getElementById('scannedQRProducts');
    const addBtn = document.getElementById('addQRScannedBtn');
    
    if (!window.qrScannedItems || window.qrScannedItems.length === 0) {
        container.innerHTML = '<div style="color:var(--muted);font-size:12px;">No products scanned yet</div>';
        addBtn.style.display = 'none';
        return;
    }
    
    container.innerHTML = window.qrScannedItems.map(p => `
        <div class="product-card" style="margin:4px 0;">
            <div class="info">
                <div class="name">${p.name}</div>
                <div class="details">${p.colour} • ${p.size} • ${p.quantity} pcs</div>
            </div>
            <button onclick="removeQRScanned('${p.sku}')" class="delete-btn">✕</button>
        </div>
    `).join('');
    addBtn.style.display = 'block';
}

function removeQRScanned(sku) {
    if (window.qrScannedItems) {
        window.qrScannedItems = window.qrScannedItems.filter(p => p.sku !== sku);
        renderQRScannedList();
    }
}

function addQRScannedProducts() {
    if (!window.qrScannedItems || window.qrScannedItems.length === 0) return;
    
    window.qrScannedItems.forEach(p => {
        const existing = state.inventory.find(item => item.sku === p.sku);
        if (existing) {
            existing.quantity += p.quantity;
        } else {
            state.inventory.push({
                ...p,
                quantity: p.quantity,
                createdAt: new Date().toISOString()
            });
        }
    });
    
    saveInventory();
    window.qrScannedItems = [];
    closeModal();
    updateUI();
    showToast(`✅ ${window.qrScannedItems.length} products added!`);
}

// ============================================
   REAL AI COLOUR DETECTION - UPGRADED
   ============================================ */
async function detectRealAIColour(input) {
    const preview = document.getElementById('imagePreview');
    const result = document.getElementById('colourResult');
    const suggested = document.getElementById('suggestedSet');
    
    if (!input.files || !input.files[0]) {
        showToast('❌ Please select an image');
        return;
    }
    
    try {
        // Show loading
        result.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:32px;margin-bottom:8px;">⏳</div>
                <p>AI is analysing image...</p>
            </div>
        `;
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            const imageData = e.target.result;
            preview.innerHTML = `<img src="${imageData}" alt="Saree" style="max-width:100%;max-height:200px;border-radius:12px;">`;
            
            // Check if real AI is enabled
            if (CONFIG.AI.enableRealAI && CONFIG.GOOGLE_VISION_API_KEY !== 'YOUR_GOOGLE_VISION_API_KEY') {
                // Real Google Vision API
                const colours = await detectRealColours(imageData);
                if (colours && colours.length > 0) {
                    displayAIColourResults(colours);
                    return;
                }
            }
            
            // Fallback: Smart colour detection (better than random)
            const fallbackColours = smartColourDetection(imageData);
            displayAIColourResults(fallbackColours);
        };
        reader.readAsDataURL(input.files[0]);
        
    } catch (error) {
        console.error('AI Detection Error:', error);
        result.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--danger);">
                ❌ AI detection failed
            </div>
        `;
    }
}

// Smart colour detection using canvas (no API required)
function smartColourDetection(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Get pixel data
            const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageDataObj.data;
            
            // Sample pixels
            const samples = [];
            const step = 10;
            for (let i = 0; i < data.length; i += step * 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r + g + b > 100) { // Skip very dark pixels
                    samples.push({ r, g, b });
                }
            }
            
            // Cluster colours (simple k-means approximation)
            const clusters = clusterColours(samples, 5);
            const colours = clusters.map(c => ({
                hex: rgbToHex(c.r, c.g, c.b),
                name: getColourName(rgbToHex(c.r, c.g, c.b)),
                score: c.count / samples.length
            }));
            
            resolve(colours);
        };
        img.src = imageData;
    });
}

function clusterColours(points, k) {
    // Simple colour clustering
    const clusters = [];
    if (points.length === 0) return [];
    
    // Initialize centroids
    const step = Math.floor(points.length / k);
    for (let i = 0; i < k && i < points.length; i++) {
        clusters.push({
            r: points[i * step].r,
            g: points[i * step].g,
            b: points[i * step].b,
            count: 0
        });
    }
    
    // Assign points to closest centroid
    for (const p of points) {
        let minDist = Infinity;
        let minIdx = 0;
        for (let i = 0; i < clusters.length; i++) {
            const c = clusters[i];
            const dist = Math.sqrt(
                Math.pow(p.r - c.r, 2) +
                Math.pow(p.g - c.g, 2) +
                Math.pow(p.b - c.b, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                minIdx = i;
            }
        }
        // Update centroid
        const c = clusters[minIdx];
        c.r = (c.r * c.count + p.r) / (c.count + 1);
        c.g = (c.g * c.count + p.g) / (c.count + 1);
        c.b = (c.b * c.count + p.b) / (c.count + 1);
        c.count += 1;
    }
    
    return clusters.filter(c => c.count > 0);
}

function displayAIColourResults(colours) {
    const result = document.getElementById('colourResult');
    const suggested = document.getElementById('suggestedSet');
    
    // Sort by score
    colours.sort((a, b) => b.score - a.score);
    const topColours = colours.slice(0, 5);
    
    result.innerHTML = `
        <div class="colour-match">
            <div class="detected">🎨 AI Detected Colours:</div>
            ${topColours.map(c => `
                <div style="display:flex;align-items:center;gap:12px;padding:4px 0;border-bottom:1px solid var(--border);">
                    <div style="width:24px;height:24px;border-radius:50%;background:${c.hex};border:1px solid var(--border);"></div>
                    <span style="flex:1;">${c.name}</span>
                    <span style="font-size:12px;color:var(--muted);">${Math.round(c.score * 100)}%</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Find matching products from inventory
    const matchingProducts = [];
    topColours.forEach(c => {
        const products = state.inventory.filter(p => 
            p.colour.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(p.colour.toLowerCase())
        );
        matchingProducts.push(...products);
    });
    
    if (matchingProducts.length > 0) {
        suggested.innerHTML = `
            <div class="colour-match">
                <div class="detected">✨ AI Suggested Set</div>
                ${matchingProducts.slice(0, 6).map(p => `
                    <div class="match-item">
                        <span>${p.name} • ${p.size}</span>
                        <span>${p.quantity} pcs • ${state.settings.currency || '₹'}${p.sellingPrice}</span>
                    </div>
                `).join('')}
                <button class="save-btn" onclick="saveRealDesign()" style="margin-top:12px;">💾 Save This Set</button>
                <button class="save-btn" onclick="applySetToSale()" style="margin-top:8px;background:var(--success);">🛒 Add to Sale</button>
            </div>
        `;
        window.lastAISet = matchingProducts;
    }
}

function saveRealDesign() {
    if (!window.lastAISet) {
        showToast('❌ No set to save');
        return;
    }
    
    const design = {
        id: Date.now(),
        name: 'AI Set ' + new Date().toLocaleDateString(),
        products: window.lastAISet.map(p => p.sku),
        createdAt: new Date().toISOString()
    };
    
    state.designs.push(design);
    saveDesigns();
    showToast('💾 Design saved!');
}

function applySetToSale() {
    if (!window.lastAISet) {
        showToast('❌ No set to apply');
        return;
    }
    
    showNewSale();
    window.lastAISet.forEach(p => {
        addToSale(p.sku, 1);
    });
    closeModal();
    showToast('✨ Set added to sale!');
}

// ============================================
   REAL BULK AI IMPORT - UPGRADED
   ============================================ */
async function showRealAIImport() {
    showModal('🖼️ AI Image/File Import', `
        <div class="upload-area" onclick="document.getElementById('realBulkFile').click()" style="border:2px dashed var(--accent);">
            <span>📁</span>
            <p>Upload images or Excel/CSV files</p>
            <p class="sub-text">AI will read product details</p>
            <input type="file" id="realBulkFile" accept="image/*,.csv,.xlsx" multiple style="display:none;" onchange="processRealBulkFiles(this)">
        </div>
        <div id="realBulkPreview" style="margin-top:12px;"></div>
        <div id="realBulkProgress" style="display:none;text-align:center;padding:12px;">
            <div style="font-size:24px;">⏳</div>
            <p>Processing ${document.querySelector('#realBulkFile')?.files?.length || 0} files...</p>
            <progress id="bulkProgressBar" value="0" max="100" style="width:100%;height:8px;border-radius:4px;"></progress>
        </div>
        <button class="save-btn" id="realAddBulkBtn" onclick="addRealBulkProducts()" style="display:none;background:var(--success);">✅ Add All to Inventory</button>
    `);
}

async function processRealBulkFiles(input) {
    const preview = document.getElementById('realBulkPreview');
    const progressDiv = document.getElementById('realBulkProgress');
    const addBtn = document.getElementById('realAddBulkBtn');
    const files = input.files;
    
    if (!files || files.length === 0) {
        showToast('❌ No files selected');
        return;
    }
    
    progressDiv.style.display = 'block';
    const progressBar = document.getElementById('bulkProgressBar');
    const products = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        progressBar.value = ((i + 1) / files.length) * 100;
        
        try {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                const imageData = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
                
                // Try OCR with Tesseract
                let productName = file.name.split('.')[0] || 'Product';
                let colour = 'Unknown';
                let size = 'Unknown';
                
                if (typeof Tesseract !== 'undefined') {
                    try {
                        const ocrResult = await Tesseract.recognize(
                            imageData,
                            'eng+hin',
                            {
                                logger: m => console.log(m)
                            }
                        );
                        const text = ocrResult.data.text;
                        // Extract information from OCR text
                        const nameMatch = text.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/);
                        if (nameMatch) productName = nameMatch[0];
                        const colourMatch = text.match(/(Rani|Deep|Dark|Light|Pink|Red|Blue|Green|Orange|Purple|Yellow|White|Black|Brown|Maroon|Magenta|Lavender|Teal|Mint|Coral|Peach|Gold|Silver)/i);
                        if (colourMatch) colour = colourMatch[0];
                        const sizeMatch = text.match(/(\d+\.?\d*)\s*(mm|cm|inch|pc|pcs)/i);
                        if (sizeMatch) size = sizeMatch[1];
                    } catch (ocrError) {
                        console.log('OCR failed, using filename');
                    }
                }
                
                // Try AI colour detection
                let detectedColours = [];
                if (CONFIG.AI.enableRealAI && CONFIG.GOOGLE_VISION_API_KEY !== 'YOUR_GOOGLE_VISION_API_KEY') {
                    const colours = await detectRealColours(imageData);
                    if (colours && colours.length > 0) {
                        detectedColours = colours;
                        colour = colours[0].name;
                    }
                }
                
                products.push({
                    name: productName,
                    colour: colour,
                    size: size,
                    quantity: 1,
                    sellingPrice: 0,
                    image: imageData,
                    detectedColours: detectedColours
                });
            }
        } catch (error) {
            console.error('Error processing file:', error);
        }
    }
    
    progressDiv.style.display = 'none';
    window.realBulkProducts = products;
    
    if (products.length === 0) {
        preview.innerHTML = '<div class="empty-card">No products could be read</div>';
        return;
    }
    
    preview.innerHTML = products.map((p, i) => `
        <div class="product-card">
            <img src="${p.image || ''}" alt="${p.name}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">
            <div class="info">
                <div class="name">${p.name}</div>
                <div class="details">${p.colour} • ${p.size}</div>
                <input type="number" class="bulk-qty" data-index="${i}" value="${p.quantity}" min="0" style="width:60px;padding:4px;border:1px solid var(--border);border-radius:4px;">
                <input type="number" class="bulk-price" data-index="${i}" value="${p.sellingPrice}" min="0" step="0.01" style="width:80px;padding:4px;border:1px solid var(--border);border-radius:4px;">
            </div>
            <button onclick="removeRealBulkItem(${i})" class="delete-btn">✕</button>
        </div>
    `).join('');
    
    addBtn.style.display = 'block';
}

function removeRealBulkItem(index) {
    if (window.realBulkProducts) {
        window.realBulkProducts.splice(index, 1);
        // Re-render
        const preview = document.getElementById('realBulkPreview');
        if (window.realBulkProducts.length === 0) {
            preview.innerHTML = '';
            document.getElementById('realAddBulkBtn').style.display = 'none';
            return;
        }
        // Simple re-render
        preview.innerHTML = window.realBulkProducts.map((p, i) => `
            <div class="product-card">
                <img src="${p.image || ''}" alt="${p.name}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">
                <div class="info">
                    <div class="name">${p.name}</div>
                    <div class="details">${p.colour} • ${p.size}</div>
                    <input type="number" class="bulk-qty" data-index="${i}" value="${p.quantity}" min="0" style="width:60px;padding:4px;border:1px solid var(--border);border-radius:4px;">
                    <input type="number" class="bulk-price" data-index="${i}" value="${p.sellingPrice}" min="0" step="0.01" style="width:80px;padding:4px;border:1px solid var(--border);border-radius:4px;">
                </div>
                <button onclick="removeRealBulkItem(${i})" class="delete-btn">✕</button>
            </div>
        `).join('');
    }
}

function addRealBulkProducts() {
    if (!window.realBulkProducts || window.realBulkProducts.length === 0) return;
    
    // Get updated quantities and prices
    const qtys = document.querySelectorAll('.bulk-qty');
    const prices = document.querySelectorAll('.bulk-price');
    
    qtys.forEach((input, i) => {
        if (window.realBulkProducts[i]) {
            window.realBulkProducts[i].quantity = parseInt(input.value) || 0;
        }
    });
    
    prices.forEach((input, i) => {
        if (window.realBulkProducts[i]) {
            window.realBulkProducts[i].sellingPrice = parseFloat(input.value) || 0;
        }
    });
    
    // Add to inventory
    let addedCount = 0;
    window.realBulkProducts.forEach(p => {
        if (p.quantity > 0) {
            const sku = generateSKU(p.name, p.colour, p.size);
            if (!state.inventory.some(item => item.sku === sku)) {
                state.inventory.push({
                    ...p,
                    sku: sku,
                    section: 'Other Inventory',
                    createdAt: new Date().toISOString()
                });
                addedCount++;
            }
        }
    });
    
    saveInventory();
    closeModal();
    updateUI();
    showToast(`✅ ${addedCount} products added!`);
    window.realBulkProducts = [];
}

// ============================================
   REAL VOICE COMMANDS - UPGRADED
   ============================================ */
function startRealVoiceCommand() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.continuous = false;
        recognition.interimResults = true;
        
        showModal('🎤 Voice Command', `
            <div style="text-align:center;padding:30px;">
                <div style="font-size:64px;margin-bottom:16px;">🎤</div>
                <div id="voiceStatus" style="font-size:14px;color:var(--muted);">Listening...</div>
                <div id="voiceTranscript" style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;font-size:16px;"></div>
                <div id="voiceAction" style="margin-top:12px;"></div>
            </div>
        `);
        
        recognition.onresult = function(event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            document.getElementById('voiceTranscript').textContent = transcript;
            document.getElementById('voiceStatus').textContent = 'Processing...';
            
            // Process command
            processVoiceCommand(transcript.toLowerCase());
        };
        
        recognition.onerror = function() {
            document.getElementById('voiceStatus').textContent = '❌ Could not recognize';
            document.getElementById('voiceStatus').style.color = 'var(--danger)';
            setTimeout(closeModal, 2000);
        };
        
        recognition.onend = function() {
            document.getElementById('voiceStatus').textContent = '✅ Done';
            setTimeout(() => {
                if (document.getElementById('modal').classList.contains('show')) {
                    // Don't close if action was performed
                }
            }, 1500);
        };
        
        recognition.start();
    } else {
        showToast('❌ Voice recognition not supported');
    }
}

function processVoiceCommand(command) {
    const actionDiv = document.getElementById('voiceAction');
    
    // Product search
    const searchMatch = command.match(/(?:search|find|show|दिखाओ|खोजो)\s+(\w+)/);
    if (searchMatch) {
        const query = searchMatch[1];
        const results = state.inventory.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.colour.toLowerCase().includes(query)
        );
        if (results.length > 0) {
            actionDiv.innerHTML = `
                <div style="background:var(--success);color:white;padding:8px;border-radius:8px;">
                    ✅ Found ${results.length} products
                </div>
                ${results.slice(0, 3).map(p => `
                    <div style="padding:4px 0;font-size:13px;">${p.name} - ${p.quantity} pcs</div>
                `).join('')}
            `;
        } else {
            actionDiv.innerHTML = `<div style="background:var(--danger);color:white;padding:8px;border-radius:8px;">❌ No products found</div>`;
        }
        return;
    }
    
    // Add product command
    const addMatch = command.match(/(?:add|जोड़)\s+(\w+)\s+(?:quantity|की|का|की)\s*(\d+)/);
    if (addMatch) {
        const name = addMatch[1];
        const qty = parseInt(addMatch[2]);
        const product = state.inventory.find(p => p.name.toLowerCase().includes(name));
        if (product) {
            product.quantity += qty;
            saveInventory();
            updateUI();
            actionDiv.innerHTML = `
                <div style="background:var(--success);color:white;padding:8px;border-radius:8px;">
                    ✅ Added ${qty} ${product.name} (Total: ${product.quantity})
                </div>
            `;
        } else {
            actionDiv.innerHTML = `<div style="background:var(--danger);color:white;padding:8px;border-radius:8px;">❌ Product "${name}" not found</div>`;
        }
        return;
    }
    
    // Sale command
    if (command.includes('sale') || command.includes('बिक्री') || command.includes('bill') || command.includes('बिल')) {
        actionDiv.innerHTML = `
            <div style="background:var(--gold);color:white;padding:8px;border-radius:8px;">
                🧾 Opening New Sale...
            </div>
        `;
        setTimeout(() => {
            closeModal();
            showNewSale();
        }, 1000);
        return;
    }
    
    // Report command
    if (command.includes('report') || command.includes('रिपोर्ट') || command.includes('summary') || command.includes('सारांश')) {
        actionDiv.innerHTML = `
            <div style="background:var(--gold);color:white;padding:8px;border-radius:8px;">
                📊 Opening Reports...
            </div>
        `;
        setTimeout(() => {
            closeModal();
            showReports();
        }, 1000);
        return;
    }
    
    // Inventory command
    if (command.includes('inventory') || command.includes('इन्वेंटरी') || command.includes('stock') || command.includes('स्टॉक')) {
        actionDiv.innerHTML = `
            <div style="background:var(--gold);color:white;padding:8px;border-radius:8px;">
                📦 Opening Inventory...
            </div>
        `;
        setTimeout(() => {
            closeModal();
            showInventory();
        }, 1000);
        return;
    }
    
    // Default: Show what was heard
    actionDiv.innerHTML = `
        <div style="background:var(--primary);color:white;padding:8px;border-radius:8px;">
            🎤 Command: "${command}"
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:8px;">
            Try: "Search [product]", "Add [product] [quantity]", "Sale", "Report", "Inventory"
        </div>
    `;
}

// ============================================
   UPDATE UI FUNCTIONS
   ============================================ */

// Update the scanner button in bulk add
function showBulkAdd() {
    navigateTo('bulkAddScreen');
    // Update bulk options to use real features
    document.querySelector('.bulk-options').innerHTML = `
        <div class="bulk-card" onclick="showRealAIImport()">
            <div class="bulk-icon">🖼️</div>
            <h3>AI Image/File Import</h3>
            <p>Upload images or files</p>
        </div>
        <div class="bulk-card" onclick="openRealScanner()">
            <div class="bulk-icon">📷</div>
            <h3>Scan & Add</h3>
            <p>QR/SKU Scanner</p>
        </div>
    `;
}

// Update AI Set Maker to use real AI
function showAISetMaker() {
    navigateTo('aiSetMakerScreen');
    // Update upload area to use real AI
    document.querySelector('.upload-area').onclick = function() {
        document.getElementById('sareeImage').click();
    };
    document.getElementById('sareeImage').onchange = function() {
        detectRealAIColour(this);
    };
}

// ============================================
   EXPORT FUNCTIONS FOR GLOBAL ACCESS
   ============================================ */

// Make all functions globally accessible
window.openRealScanner = openRealScanner;
window.startRealScanner = startRealScanner;
window.stopRealScanner = stopRealScanner;
window.detectRealAIColour = detectRealAIColour;
window.showRealAIImport = showRealAIImport;
window.processRealBulkFiles = processRealBulkFiles;
window.addRealBulkProducts = addRealBulkProducts;
window.removeRealBulkItem = removeRealBulkItem;
window.startRealVoiceCommand = startRealVoiceCommand;
window.saveRealDesign = saveRealDesign;
window.applySetToSale = applySetToSale;
window.addQRScannedProducts = addQRScannedProducts;
window.removeQRScanned = removeQRScanned;

console.log('🏪 Bangle Store AI v2.0 - All Real Features Loaded!');
console.log('🤖 AI Features:', CONFIG.AI.enableRealAI ? 'ENABLED' : 'DISABLED');
console.log('📷 QR Scanner: READY');
console.log('🎤 Voice Commands: READY');
