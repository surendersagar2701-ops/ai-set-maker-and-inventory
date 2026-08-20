// ============================================
// BANGLE STORE AI - CONFIGURATION
// ============================================

const CONFIG = {
    // 🔑 Google Cloud Vision API Key
    GOOGLE_VISION_API_KEY: 'AIzaSyBxXAE5nJtA6843uJ5_mvdQ-hsxk16fAl0',
    
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
