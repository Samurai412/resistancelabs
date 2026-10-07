/* ===================================
   RESISTOR MARK GENERATOR
   Severed Loop PFP Generator
   ================================= */

document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const controls = document.getElementById('controls');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const intensitySlider = document.getElementById('intensity');
    const ruptureSlider = document.getElementById('static-amount');
    const intensityValue = document.getElementById('intensity-value');
    const backlightValue = document.getElementById('backlight-value');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const overlayImage = new Image();

    let originalImage = null;
    let cropSize = 0;
    let imageSeed = 1;
    let overlayReady = false;

    overlayImage.onload = () => {
        overlayReady = true;
        renderMark();
    };
    overlayImage.src = 'assets/resistance-labs-severed-loop-transparent.png';

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadArea.classList.remove('drag-over');

        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file);
        }
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            loadImage(file);
        }
    });

    function loadImage(file) {
        imageSeed = hashString(`${file.name}:${file.size}:${file.lastModified}`);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                cropSize = Math.min(img.width, img.height);

                const outputSize = Math.min(cropSize, 1024);
                canvas.width = outputSize;
                canvas.height = outputSize;

                uploadArea.style.display = 'none';
                previewArea.style.display = 'flex';
                controls.style.display = 'grid';

                updateControlLabels();
                renderMark();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleControlInput() {
        updateControlLabels();
        renderMark();
    }

    function renderMark() {
        if (!originalImage) return;

        const size = canvas.width;
        const markScale = getSliderProgress(intensitySlider);
        const backlight = getSliderProgress(ruptureSlider);
        const rng = createRandom(imageSeed + Math.round(markScale * 1000) + Math.round(backlight * 2000));

        drawPortrait(size, backlight);
        addSurfacePressure(size, rng, backlight);
        drawTransparentOverlay(size, markScale, backlight);
    }

    function drawPortrait(size, gradeIntensity) {
        const sx = (originalImage.width - cropSize) / 2;
        const sy = (originalImage.height - cropSize) / 2;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(originalImage, sx, sy, cropSize, cropSize, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        const desaturate = 0.35 + gradeIntensity * 0.48;
        const exposure = 0.94 - gradeIntensity * 0.36;

        for (let index = 0; index < data.length; index += 4) {
            const red = data[index];
            const green = data[index + 1];
            const blue = data[index + 2];
            const grey = red * 0.3 + green * 0.59 + blue * 0.11;

            data[index] = (red * (1 - desaturate) + grey * desaturate) * exposure * 0.9;
            data[index + 1] = (green * (1 - desaturate) + grey * desaturate) * exposure * 0.98;
            data[index + 2] = (blue * (1 - desaturate) + grey * desaturate) * exposure * 1.08;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    function addSurfacePressure(size, rng, ruptureDensity) {
        ctx.save();

        const coolWash = ctx.createLinearGradient(0, 0, size, size);
        coolWash.addColorStop(0, `rgba(4, 12, 12, ${0.18 + ruptureDensity * 0.28})`);
        coolWash.addColorStop(0.52, `rgba(26, 39, 35, ${0.08 + ruptureDensity * 0.2})`);
        coolWash.addColorStop(1, `rgba(0, 0, 0, ${0.22 + ruptureDensity * 0.38})`);
        ctx.fillStyle = coolWash;
        ctx.fillRect(0, 0, size, size);

        const vignette = ctx.createRadialGradient(
            size / 2, size / 2, size * 0.2,
            size / 2, size / 2, size * 0.74
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(0.62, `rgba(0, 0, 0, ${0.08 + ruptureDensity * 0.2})`);
        vignette.addColorStop(1, `rgba(0, 0, 0, ${0.28 + ruptureDensity * 0.48})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, size, size);

        ctx.globalAlpha = 0.16 + ruptureDensity * 0.1;
        ctx.strokeStyle = 'rgba(243, 239, 228, 0.22)';
        ctx.lineWidth = Math.max(1, size * 0.0015);
        for (let i = 0; i < 34; i += 1) {
            const y = rng() * size;
            const x = rng() * size;
            const length = size * (0.05 + rng() * 0.18);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + length, y + (rng() - 0.5) * size * 0.018);
            ctx.stroke();
        }

        ctx.globalAlpha = 0.22;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        for (let i = 0; i < 80; i += 1) {
            const dot = size * (0.002 + rng() * 0.006);
            ctx.fillRect(rng() * size, rng() * size, dot, dot);
        }

        ctx.restore();
    }

    function drawTransparentOverlay(size, markScale, backlight) {
        if (!overlayReady) return;

        const scale = 0.22 + markScale * 0.98;
        const drawSize = size * scale;
        const offset = (size - drawSize) / 2;

        ctx.save();
        ctx.globalAlpha = 0.35 + markScale * 0.63;
        ctx.drawImage(overlayImage, offset, offset, drawSize, drawSize);

        const glow = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size * (0.08 + backlight * 0.18)
        );
        glow.addColorStop(0, `rgba(255, 107, 26, ${0.04 + backlight * 0.36})`);
        glow.addColorStop(0.45, `rgba(0, 216, 255, ${0.02 + backlight * 0.16})`);
        glow.addColorStop(1, 'rgba(169, 73, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();
    }

    function updateControlLabels() {
        intensityValue.textContent = `${Math.round(getSliderProgress(intensitySlider) * 100)}%`;
        backlightValue.textContent = `${Math.round(getSliderProgress(ruptureSlider) * 100)}%`;
    }

    function getSliderProgress(slider) {
        return Math.max(0, Math.min(1, Number(slider.value) / 100));
    }

    function hashString(value) {
        let hash = 2166136261;
        for (let i = 0; i < value.length; i += 1) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function createRandom(seed) {
        let state = seed >>> 0;
        return function random() {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ value >>> 15, value | 1);
            value ^= value + Math.imul(value ^ value >>> 7, value | 61);
            return ((value ^ value >>> 14) >>> 0) / 4294967296;
        };
    }

    ['input', 'change', 'pointerup', 'touchend', 'keyup'].forEach((eventName) => {
        intensitySlider.addEventListener(eventName, handleControlInput);
        ruptureSlider.addEventListener(eventName, handleControlInput);
    });

    resetBtn.addEventListener('click', () => {
        originalImage = null;
        cropSize = 0;
        fileInput.value = '';
        uploadArea.style.display = 'flex';
        previewArea.style.display = 'none';
        controls.style.display = 'none';
        intensitySlider.value = 60;
        ruptureSlider.value = 60;
        updateControlLabels();
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'resistance-labs-severed-loop.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    updateControlLabels();
});
