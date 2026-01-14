import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs';

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/photos';

@Controller('photos')
export class PhotosController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, UPLOAD_PATH);
        },
        filename: (req, file, cb) => {
          // 生成文件名: 时间戳 + 随机数
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // 只允许图片
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('只允许上传图片文件'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadPhoto(@UploadedFile() file: any, @Body() body: any) {
    if (!file) {
      throw new BadRequestException('请选择文件');
    }

    try {
      // 检查是否是签名图片（有病历号、时间、项目信息）
      const isSignature = body.isSignature === 'true' || body.isSignature === true;
      const medicalRecordNo = body.medicalRecordNo || '';
      const treatmentTime = body.treatmentTime ? new Date(body.treatmentTime) : new Date();
      const projectName = body.projectName || '';

      if (isSignature) {
        // 为签名图片添加专用水印
        await this.addSignatureWatermark(file.path, medicalRecordNo, treatmentTime, projectName);
      } else {
        // 获取自定义时间戳（如果有）
        const customTime = body.timestamp ? new Date(body.timestamp) : null;

        // 添加时间水印（用于普通照片）
        await this.addTimestampWatermark(file.path, customTime);
      }

      return {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: `/uploads/photos/${file.filename}`,
      };
    } catch (error) {
      console.error('处理图片失败:', error);
      // 如果处理失败，仍然返回文件信息
      return {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: `/uploads/photos/${file.filename}`,
      };
    }
  }

  /**
   * 添加时间戳水印到图片
   * @param filePath 图片文件路径
   * @param customTime 自定义时间（可选）
   */
  private async addTimestampWatermark(filePath: string, customTime?: Date | null) {
    try {
      // 先压缩图片到720p（高度720，宽度按比例）
      const image = sharp(filePath);
      const metadata = await image.metadata();
      const originalWidth = metadata.width || 800;
      const originalHeight = metadata.height || 600;

      // 计算目标尺寸：高度720，宽度按比例
      const targetHeight = 720;
      const targetWidth = Math.round(originalWidth * (targetHeight / originalHeight));

      console.log(`压缩图片: ${originalWidth}x${originalHeight} -> ${targetWidth}x${targetHeight}`);

      // 先resize并压缩图片，确保小于100KB
      let quality = 80;
      let tempPath = filePath + '.tmp';
      let stats;

      // 迭代压缩直到小于100KB
      do {
        // 删除之前的临时文件（如果有）
        if (stats && fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }

        await image
          .clone()
          .resize(targetWidth, targetHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality })
          .toFile(tempPath);

        stats = fs.statSync(tempPath);
        console.log(`压缩质量 ${quality}%: 文件大小 ${(stats.size / 1024).toFixed(2)}KB`);

        // 降低质量继续压缩
        if (stats.size > 100 * 1024 && quality > 50) {
          quality -= 10;
        }
      } while (stats.size > 100 * 1024 && quality > 50);

      // 用压缩后的文件替换原文件
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);

      // 现在读取压缩后的图片添加水印
      const processedImage = sharp(filePath);
      const processedMetadata = await processedImage.metadata();
      const width = processedMetadata.width || targetWidth;
      const height = processedMetadata.height || targetHeight;

      // 水印区域高度：图片高度的1/4
      const watermarkHeight = Math.floor(height / 4);

      // 生成日期和时间（分两行）- 使用自定义时间或当前时间
      const now = customTime || new Date();
      const dateText = this.formatDateOnly(now);
      const timeText = this.formatTimeOnly(now);

      // 字体大小 - 适合720p，增大字体以便更清晰
      const fontSize = 48;
      const lineHeight = fontSize * 1.3;

      // 计算文字位置（垂直居中，分两行）
      const textY1 = height - watermarkHeight / 2 - lineHeight / 2;
      const textY2 = height - watermarkHeight / 2 + lineHeight / 2;

      // 创建SVG水印 - 两行显示，使用白色字体
      const svgText = `
        <svg width="${width}" height="${height}">
          <rect x="0" y="${height - watermarkHeight}" width="${width}" height="${watermarkHeight}" fill="rgba(0,0,0,0.8)"/>
          <text x="${width / 2}" y="${textY1}" font-size="${fontSize}" font-family="Arial" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
            ${dateText}
          </text>
          <text x="${width / 2}" y="${textY2}" font-size="${fontSize}" font-family="Arial" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
            ${timeText}
          </text>
        </svg>
      `;

      console.log(`添加水印: ${width}x${height}, 字体${fontSize}px, 文本: ${dateText} ${timeText}`);

      // 使用临时文件输出
      const finalTempPath = filePath + '.final';
      await processedImage
        .composite([
          {
            input: Buffer.from(svgText),
            top: 0,
            left: 0,
          },
        ])
        .toFile(finalTempPath);

      // 用最终文件替换原文件
      fs.unlinkSync(filePath);
      fs.renameSync(finalTempPath, filePath);

      console.log(`✓ 已为图片添加时间水印: ${dateText} ${timeText}`);
    } catch (error) {
      console.error('添加水印失败:', error);
      throw error;
    }
  }

  /**
   * 格式化时间戳
   * @param date 日期对象
   * @returns 格式化后的时间戳字符串
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 格式化日期（只有年月日）
   * @param date 日期对象
   * @returns 格式化后的日期字符串
   */
  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}年${month}月${day}日`;
  }

  /**
   * 格式化时间（只有时分秒）
   * @param date 日期对象
   * @returns 格式化后的时间字符串
   */
  private formatTimeOnly(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * 为签名图片添加专用水印
   * 格式：病历号 时间 项目
   * 步骤：
   * 1. 检测并裁剪有效区域（去除空白）
   * 2. 背景透明处理
   * 3. 添加黑色文字水印
   * @param filePath 图片文件路径
   * @param medicalRecordNo 病历号
   * @param treatmentTime 治疗时间
   * @param projectName 项目名称
   */
  private async addSignatureWatermark(
    filePath: string,
    medicalRecordNo: string,
    treatmentTime: Date,
    projectName: string
  ) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      const originalWidth = metadata.width || 800;
      const originalHeight = metadata.height || 600;

      console.log(`原始签名图片尺寸: ${originalWidth}x${originalHeight}`);

      // 1. 检测有效区域（去除白色空白区域）
      const { data } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

      // 找到有效内容的边界（非白色像素）
      const channels = metadata.channels || 4;
      let minX = originalWidth, minY = originalHeight, maxX = 0, maxY = 0;
      let foundPixel = false;
      let pixelSample = '';

      for (let y = 0; y < originalHeight; y++) {
        for (let x = 0; x < originalWidth; x++) {
          const idx = (y * originalWidth + x) * channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // 检查是否是黑色或深灰色（签名）而不是白色背景
          // 白色背景的 RGB 值接近 (255, 255, 255)
          const brightness = (r + g + b) / 3;

          // 采样前几个像素用于调试
          if (x === 0 && y === 0) {
            pixelSample = `像素(0,0): R=${r}, G=${g}, B=${b}, 亮度=${brightness.toFixed(2)}`;
          }
          if (x === Math.floor(originalWidth / 2) && y === Math.floor(originalHeight / 2)) {
            pixelSample += ` | 像素(中心): R=${r}, G=${g}, B=${b}, 亮度=${brightness.toFixed(2)}`;
          }

          // 如果亮度小于 250（不是纯白），认为是有效签名区域
          if (brightness < 250) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            foundPixel = true;
          }
        }
      }

      console.log(`像素采样: ${pixelSample}, 找到有效像素: ${foundPixel}`);

      if (!foundPixel) {
        console.warn('未检测到有效签名区域，使用原始图片');
        minX = 0; minY = 0; maxX = originalWidth - 1; maxY = originalHeight - 1;
      }

      // 添加一些边距
      const cropPadding = 15;
      minX = Math.max(0, minX - cropPadding);
      minY = Math.max(0, minY - cropPadding);
      maxX = Math.min(originalWidth - 1, maxX + cropPadding);
      maxY = Math.min(originalHeight - 1, maxY + cropPadding);

      const cropWidth = maxX - minX + 1;
      const cropHeight = maxY - minY + 1;

      console.log(`裁剪区域: x=${minX}, y=${minY}, width=${cropWidth}, height=${cropHeight}`);

      // 2. 裁剪图片
      const croppedPath = filePath + '.cropped.png';
      await image
        .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
        .png()
        .toFile(croppedPath);

      // 3. 将白色背景透明化（白色变透明，保留黑色签名）
      const transparentPath = filePath + '.transparent.png';
      const croppedImage = sharp(croppedPath);
      const croppedData = await croppedImage.raw().toBuffer();
      const croppedMeta = await croppedImage.metadata();

      // 创建透明像素数组
      const transparentBuffer = Buffer.alloc(croppedData.length);
      const croppedChannels = croppedMeta.channels || 4;

      let darkPixels = 0;

      for (let i = 0; i < croppedData.length; i += croppedChannels) {
        const r = croppedData[i];
        const g = croppedData[i + 1];
        const b = croppedData[i + 2];
        const brightness = (r + g + b) / 3;

        // 统计深色像素（用于调试）
        if (brightness < 200) darkPixels++;

        if (brightness >= 250) {
          // 白色背景：设为透明
          transparentBuffer[i] = 255;     // R
          transparentBuffer[i + 1] = 255; // G
          transparentBuffer[i + 2] = 255; // B
          transparentBuffer[i + 3] = 0;   // A = 0 (透明)
        } else {
          // 非白色：保留原色
          transparentBuffer[i] = r;
          transparentBuffer[i + 1] = g;
          transparentBuffer[i + 2] = b;
          transparentBuffer[i + 3] = croppedChannels === 4 ? croppedData[i + 3] : 255;
        }
      }

      console.log(`深色像素数量: ${darkPixels}, 总像素: ${croppedData.length / croppedChannels}`);

      await sharp(transparentBuffer, {
        raw: {
          width: cropWidth,
          height: cropHeight,
          channels: 4
        }
      })
      .png()
      .toFile(transparentPath);

      // 4. 格式化时间
      const dateStr = this.formatDateOnly(treatmentTime);
      const timeStr = this.formatTimeOnly(treatmentTime);

      // 构建水印文本：病历号 时间 项目
      const watermarkText = `${medicalRecordNo} ${dateStr} ${timeStr} ${projectName}`;

      console.log(`为签名图片添加水印: ${watermarkText}`);

      // 5. 动态计算水印文字尺寸，确保文字不超出图片宽度
      // 估算文字宽度：中文字符约等于字体大小，英文/数字约等于字体大小*0.6
      let charCount = 0;
      let narrowCharCount = 0;

      for (const char of watermarkText) {
        // 判断是否为汉字（Unicode范围）
        if (/[\u4e00-\u9fa5]/.test(char)) {
          charCount++;
        } else {
          narrowCharCount++;
        }
      }

      // 估算文字总宽度（留20px左右边距）
      const padding = 40;
      const maxWidth = cropWidth - padding;

      // 初始字体大小（基于图片宽度的1/18）
      let fontSize = Math.max(20, Math.floor(cropWidth / 18));

      // 估算当前字体大小下的文字宽度
      // 汉字宽度 ≈ fontSize，英文/数字宽度 ≈ fontSize * 0.6
      const estimatedWidth = charCount * fontSize + narrowCharCount * fontSize * 0.6;

      // 如果文字超出宽度，缩小字体
      if (estimatedWidth > maxWidth) {
        fontSize = Math.floor(maxWidth / (charCount + narrowCharCount * 0.6));
        // 最小字体大小限制
        fontSize = Math.max(14, fontSize);
      }

      console.log(`文字宽度估算: ${estimatedWidth.toFixed(0)}px, 最大宽度: ${maxWidth}px, 字体大小: ${fontSize}px`);

      const watermarkHeight = fontSize + 12;

      // 6. 创建新的画布：签名 + 水印
      const canvasWidth = cropWidth;
      const canvasHeight = cropHeight + watermarkHeight;

      // 7. 创建 SVG：透明背景 + 签名 + 黑色水印文字
      const svgText = `
        <svg width="${canvasWidth}" height="${canvasHeight}">
          <text x="${canvasWidth / 2}" y="${cropHeight + watermarkHeight - 5}"
                font-size="${fontSize}" font-family="Arial" font-weight="bold"
                fill="#000000" text-anchor="middle">
            ${watermarkText}
          </text>
        </svg>
      `;

      // 8. 将裁剪后的签名与水印合成
      const finalTempPath = filePath + '.final.png';

      // 创建 SVG 水印（透明背景，只有文字）
      const watermarkSvg = `
        <svg width="${cropWidth}" height="${watermarkHeight}">
          <text x="${cropWidth / 2}" y="${watermarkHeight - 5}"
                font-size="${fontSize}" font-family="Arial" font-weight="bold"
                fill="#000000" text-anchor="middle">
            ${watermarkText}
          </text>
        </svg>
      `;

      // 合成：签名在上，水印在下
      await sharp(transparentPath)
        .extend({
          top: 0,
          left: 0,
          bottom: watermarkHeight,
          right: 0,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .composite([
          {
            input: Buffer.from(watermarkSvg),
            top: cropHeight,
            left: 0,
          },
        ])
        .png()
        .toFile(finalTempPath);

      // 9. 清理临时文件
      if (fs.existsSync(croppedPath)) fs.unlinkSync(croppedPath);
      if (fs.existsSync(transparentPath)) fs.unlinkSync(transparentPath);

      // 10. 用最终文件替换原文件
      fs.unlinkSync(filePath);
      fs.renameSync(finalTempPath, filePath);

      console.log(`✓ 签名图片处理完成: ${watermarkText}, 最终尺寸: ${canvasWidth}x${canvasHeight}`);
    } catch (error) {
      console.error('处理签名图片失败:', error);
      throw error;
    }
  }
}
