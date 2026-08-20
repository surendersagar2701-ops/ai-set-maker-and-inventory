// ============================================
// BANGLE STORE AI - CONFIGURATION
// ============================================

const CONFIG = {
    // Google Cloud Vision API Key
    // Get from: https://console.cloud.google.com/apis/credentials
    GOOGLE_VISION_API_KEY: 'YOUR_GOOGLE_VISION_API_KEY',
    
    // Google Vision API Endpoint
    VISION_API_URL: 'https://vision.googleapis.com/v1/images:annotate',
    
    // AI Settings
    AI: {
        colourConfidenceThreshold: 0.7,
        maxColourMatches: 5,
        enableRealAI: true
    },
    
    // QR Scanner Settings
    QR: {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    },
    
    // App Settings
    APP: {
        name: 'Bangle Store AI',
        version: '2.0',
        debug: true
    }
};

// ============================================
// API HELPER FUNCTIONS
// ============================================

async function callGoogleVision(imageData) {
    try {
        const response = await fetch(`${CONFIG.VISION_API_URL}?key=${CONFIG.GOOGLE_VISION_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [{
                    image: {
                        content: imageData.split(',')[1] // Remove data:image/...;base64,
                    },
                    features: [
                        { type: 'LABEL_DETECTION', maxResults: 10 },
                        { type: 'IMAGE_PROPERTIES', maxResults: 5 }
                    ]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Google Vision API Error:', error);
        return null;
    }
}

// Real colour detection from Google Vision
async function detectRealColours(imageData) {
    const result = await callGoogleVision(imageData);
    if (!result || !result.responses || !result.responses[0]) {
        return null;
    }
    
    const response = result.responses[0];
    const colours = [];
    
    // Extract dominant colours from ImageProperties
    if (response.imagePropertiesAnnotation) {
        const dominantColours = response.imagePropertiesAnnotation.dominantColors.colors;
        dominantColours.forEach(c => {
            const rgb = c.color;
            const hex = rgbToHex(rgb.red || 0, rgb.green || 0, rgb.blue || 0);
            const colourName = getColourName(hex);
            colours.push({
                hex: hex,
                name: colourName,
                score: c.score || 0,
                pixelFraction: c.pixelFraction || 0
            });
        });
    }
    
    // Extract labels for additional context
    if (response.labelAnnotations) {
        const labels = response.labelAnnotations.map(l => l.description);
        console.log('Detected labels:', labels);
    }
    
    return colours;
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function getColourName(hex) {
    // Map hex to colour names
    const colourMap = {
        '#ff69b4': 'Rani Pink',
        '#ff1493': 'Deep Pink',
        '#ff6b6b': 'Red',
        '#ff4757': 'Crimson',
        '#2ed573': 'Green',
        '#1e90ff': 'Blue',
        '#ffa502': 'Orange',
        '#ff6348': 'Tomato',
        '#a29bfe': 'Lavender',
        '#fd79a8': 'Light Pink',
        '#e84393': 'Magenta',
        '#6c5ce7': 'Purple',
        '#00cec9': 'Teal',
        '#fdcb6e': 'Yellow',
        '#e17055': 'Terracotta',
        '#00b894': 'Mint',
        '#0984e3': 'Royal Blue',
        '#d63031': 'Maroon',
        '#f8a5c2': 'Soft Pink',
        '#778beb': 'Periwinkle'
    };
    
    // Find closest match
    let closest = 'Unknown';
    let closestDist = Infinity;
    
    for (const [key, value] of Object.entries(colourMap)) {
        const dist = colourDistance(hex, key);
        if (dist < closestDist) {
            closestDist = dist;
            closest = value;
        }
    }
    
    return closest;
}

function colourDistance(hex1, hex2) {
    const c1 = hexToRGB(hex1);
    const c2 = hexToRGB(hex2);
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
}

function hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}
