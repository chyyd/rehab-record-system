/**
 * 扫码图标生成脚本
 * 运行方法：node generate-icons.js
 * 需要安装：npm install canvas
 */

const { createCanvas } = require('canvas');

function drawQRCodeIcon(ctx, color, size, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    const padding = size * 0.2;
    const cornerSize = size * 0.25;

    // 左上角
    ctx.beginPath();
    ctx.moveTo(padding, padding + cornerSize);
    ctx.lineTo(padding, padding);
    ctx.lineTo(padding + cornerSize, padding);
    ctx.stroke();

    // 右上角
    ctx.beginPath();
    ctx.moveTo(size - padding - cornerSize, padding);
    ctx.lineTo(size - padding, padding);
    ctx.lineTo(size - padding, padding + cornerSize);
    ctx.stroke();

    // 左下角
    ctx.beginPath();
    ctx.moveTo(padding, size - padding - cornerSize);
    ctx.lineTo(padding, size - padding);
    ctx.lineTo(padding + cornerSize, size - padding);
    ctx.stroke();

    // 右下角
    ctx.beginPath();
    ctx.moveTo(size - padding - cornerSize, size - padding);
    ctx.lineTo(size - padding, size - padding);
    ctx.lineTo(size - padding, size - padding - cornerSize);
    ctx.stroke();

    // 中间扫描线（水平）
    ctx.beginPath();
    ctx.moveTo(padding + cornerSize, size / 2);
    ctx.lineTo(size - padding - cornerSize, size / 2);
    ctx.stroke();

    // 中间扫描线（垂直）
    ctx.beginPath();
    ctx.moveTo(size / 2, padding + cornerSize);
    ctx.lineTo(size / 2, size - padding - cornerSize);
    ctx.stroke();
}

function generateIcons() {
    const size = 81;

    // 生成灰色图标
    const canvasGray = createCanvas(size, size);
    const ctxGray = canvasGray.getContext('2d');
    drawQRCodeIcon(ctxGray, '#7A7E83', size, 2);

    const fs = require('fs');
    const bufferGray = canvasGray.toBuffer('image/png');
    fs.writeFileSync('scan.png', bufferGray);
    console.log('✅ 已生成 scan.png');

    // 生成蓝色图标
    const canvasBlue = createCanvas(size, size);
    const ctxBlue = canvasBlue.getContext('2d');
    drawQRCodeIcon(ctxBlue, '#0ea5e9', size, 2);

    const bufferBlue = canvasBlue.toBuffer('image/png');
    fs.writeFileSync('scan-active.png', bufferBlue);
    console.log('✅ 已生成 scan-active.png');

    console.log('\n🎉 图标生成完成！');
    console.log('📁 文件位置：' + __dirname);
}

generateIcons();
