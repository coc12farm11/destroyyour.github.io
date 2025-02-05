async function generateFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset(),
        screen.width + 'x' + screen.height,
        navigator.hardwareConcurrency,
        navigator.deviceMemory,
        navigator.platform,
        navigator.vendor
    ];
    
    // Добавляем список установленных шрифтов
    const fonts = await getFonts();
    components.push(fonts.join(','));
    
    // Создаем canvas fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Hello, world.', 2, 2);
    const canvasFingerprint = canvas.toDataURL();
    components.push(canvasFingerprint);
    
    // Хешируем все компоненты
    const fingerprintString = components.join('###');
    const fingerprint = await sha256(fingerprintString);
    
    return fingerprint;
}

async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getFonts() {
    const fontList = [
        'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
        'Helvetica', 'Comic Sans MS', 'Impact', 'Tahoma', 'Terminal'
    ];
    
    const availableFonts = [];
    
    for (const font of fontList) {
        if (document.fonts.check(`12px "${font}"`)) {
            availableFonts.push(font);
        }
    }
    
    return availableFonts;
} 