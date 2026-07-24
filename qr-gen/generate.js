const { createCanvas } = require('canvas');
const QRCode = require('qrcode');

const gameData = {
    title: "Minimon",
    url: "https://mrghostguy.github.io/minimon/",
    description: "A Mini-Collecting RPG Adventure - Catch, train, and battle with 85 unique creatures across 12 maps!",
    iconUrl: "",
    themeColor: "#FE5000"
};

const qrData = JSON.stringify(gameData);

const size = 400;
const padding = 30;
const borderWidth = 4;
const borderRadius = 15;

const canvasWidth = size + (padding * 2);
const canvasHeight = size + (padding * 2) + 30;
const canvas = createCanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvasWidth, canvasHeight);

ctx.strokeStyle = '#FE5000';
ctx.lineWidth = borderWidth;
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

const x = borderWidth / 2;
const y = borderWidth / 2;
const w = canvasWidth - borderWidth;
const h = canvasHeight - 30 - borderWidth;

ctx.beginPath();
ctx.moveTo(x + borderRadius, y);
ctx.lineTo(x + w - borderRadius, y);
ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
ctx.lineTo(x + w, y + h - borderRadius);
ctx.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
ctx.lineTo(x + borderRadius, y + h);
ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
ctx.lineTo(x, y + borderRadius);
ctx.quadraticCurveTo(x, y, x + borderRadius, y);
ctx.closePath();
ctx.stroke();

const qrCanvas = createCanvas(size, size);

QRCode.toCanvas(qrCanvas, qrData, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'L',
    color: {
        dark: '#000000',
        light: '#ffffff'
    }
}, (err) => {
    if (err) {
        console.error('Error generating QR:', err);
        return;
    }
    ctx.drawImage(qrCanvas, padding, padding, size, size);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('r1 creations', canvasWidth / 2, canvasHeight - 10);

    const fs = require('fs');
    const buffer = canvas.toBuffer('image/png');
    const outPath = require('path').join(__dirname, '..', 'Minimon-creation-code-enhanced.png');
    fs.writeFileSync(outPath, buffer);
    console.log('SUCCESS: ' + outPath);
    console.log('Display this image on screen and scan with your R1.');
});
