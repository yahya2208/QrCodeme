// QR NEXUS - QR Scanner Module

class QRScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.stream = null;
        this.isScanning = false;
        this.onScanCallback = null;
    }

    async init() {
        this.video = document.getElementById('scanner-video');
        this.canvas = document.getElementById('scanner-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        }
    }

    async start(onScan) {
        if (this.isScanning) return;
        this.onScanCallback = onScan;

        try {
            // Request camera permission
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });

            if (this.video) {
                this.video.srcObject = this.stream;
                await this.video.play();
                this.isScanning = true;
                this.updateStatus('جاري البحث...', 'scanning');
                this.scanLoop();
            }
        } catch (error) {
            console.error('Camera error:', error);
            this.updateStatus('لا يمكن الوصول للكاميرا', 'error');
            throw error;
        }
    }

    stop() {
        this.isScanning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.srcObject = null;
        }
    }

    scanLoop() {
        if (!this.isScanning || !this.video || !this.canvas || !this.ctx) return;

        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.ctx.drawImage(this.video, 0, 0);

            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const code = this.decodeQR(imageData);

            if (code) {
                this.isScanning = false;
                this.updateStatus('تم العثور على كود!', 'success');

                // Flash effect
                if (typeof animations !== 'undefined') {
                    animations.qrSuccessFlash();
                }

                if (this.onScanCallback) {
                    this.onScanCallback(code);
                }
                return;
            }
        }

        requestAnimationFrame(() => this.scanLoop());
    }

    // Simple QR decoder using jsQR (fallback to link detection)
    decodeQR(imageData) {
        // Try jsQR if available
        if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });
            return code ? code.data : null;
        }

        // Fallback: Try using BarcodeDetector API (Chrome)
        if ('BarcodeDetector' in window) {
            return null; // Will use async detection
        }

        return null;
    }

    // Async detection using BarcodeDetector
    async detectAsync() {
        if (!('BarcodeDetector' in window)) return null;

        try {
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(this.video);
            return barcodes.length > 0 ? barcodes[0].rawValue : null;
        } catch {
            return null;
        }
    }

    updateStatus(text, state) {
        const statusEl = document.getElementById('scanner-status');
        if (statusEl) {
            const dot = statusEl.querySelector('.status-dot');
            const span = statusEl.querySelector('span');
            if (span) span.textContent = text;
            if (dot) {
                dot.style.background = state === 'success' ? '#00ff88' :
                    state === 'error' ? '#ff4444' :
                        'var(--yellow-neon)';
            }
        }
    }
}

// Export instance
const scanner = new QRScanner();
