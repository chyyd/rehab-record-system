#!/usr/bin/env node

/**
 * 自动化 IP 地址更换脚本
 *
 * 功能：
 * 1. 自动检测当前电脑的局域网 IP
 * 2. 批量替换所有配置文件中的旧 IP
 * 3. 自动重新生成 SSL 证书
 * 4. 重新构建前端
 *
 * 使用方法：
 * node scripts/update-ip.js [新IP地址]
 *
 * 示例：
 * node scripts/update-ip.js 192.168.1.100
 * node scripts/update-ip.js  # 自动检测 IP
 */

import fs from 'fs/promises';
import { spawn } from 'child_process';
import { networkInterfaces } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

// 当前旧 IP（会被替换）
const OLD_IP = '192.168.10.5';

// 需要更新的文件列表
const FILES_TO_UPDATE = [
  {
    path: 'mobile-frontend/.env.development',
    description: '开发环境变量'
  },
  {
    path: 'mobile-frontend/.env.production',
    description: '生产环境变量'
  },
  {
    path: 'mobile-frontend/vite.config.ts',
    description: 'Vite 配置'
  },
  {
    path: 'mobile-frontend/certs/generate-cert.bat',
    description: 'Windows 证书生成脚本'
  },
  {
    path: 'mobile-frontend/certs/generate-cert.sh',
    description: 'Linux/Mac 证书生成脚本'
  },
  {
    path: 'backend/src/main.ts',
    description: '后端服务器配置（可选）'
  }
];

/**
 * 获取本机局域网 IP 地址
 */
function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // 跳过内部 IP 和 IPv6
      if (net.family === 'IPv4' && !net.internal) {
        const ip = net.address;
        // 只返回局域网 IP（192.168.x.x 或 10.x.x.x 或 172.16-31.x.x）
        if (
          ip.startsWith('192.168.') ||
          ip.startsWith('10.') ||
          (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)
        ) {
          return ip;
        }
      }
    }
  }
  return null;
}

/**
 * 执行命令并返回结果
 */
function execCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 执行命令: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`命令执行失败 (code ${code}): ${stderr}`));
      }
    });
  });
}

/**
 * 替换文件中的 IP 地址
 */
async function replaceIPInFile(filePath, oldIP, newIP) {
  try {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    // 替换所有出现的旧 IP
    const newContent = content.replace(new RegExp(escapeRegExp(oldIP), 'g'), newIP);

    if (content !== newContent) {
      await fs.writeFile(fullPath, newContent, 'utf-8');
      return true; // 文件已修改
    }
    return false; // 文件未修改
  } catch (error) {
    console.error(`❌ 更新文件失败 ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 生成 SSL 证书
 */
async function generateCertificate(newIP) {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      // Windows
      await execCommand('cmd', ['/c', `cd mobile-frontend\\certs && generate-cert.bat`]);
    } else {
      // Linux/Mac
      await execCommand('bash', ['-c', 'cd mobile-frontend/certs && bash generate-cert.sh']);
    }
    console.log('✅ SSL 证书生成成功');
  } catch (error) {
    console.error('❌ SSL 证书生成失败:', error.message);
    throw error;
  }
}

/**
 * 重新构建前端
 */
async function rebuildFrontend() {
  try {
    console.log('🔨 重新构建前端...');
    await execCommand('npm', ['run', 'build:h5'], {
      cwd: path.join(PROJECT_ROOT, 'mobile-frontend')
    });
    console.log('✅ 前端构建成功');
  } catch (error) {
    console.error('❌ 前端构建失败:', error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 IP 地址自动更换脚本\n');

  // 获取新 IP 地址
  let newIP = process.argv[2];

  if (!newIP) {
    console.log('🔍 正在检测本机 IP 地址...');
    newIP = getLocalIP();

    if (!newIP) {
      console.error('❌ 无法自动检测 IP 地址，请手动指定：');
      console.error('   node scripts/update-ip.js 192.168.1.100');
      process.exit(1);
    }
  }

  // 验证 IP 地址格式
  const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (!ipPattern.test(newIP)) {
    console.error(`❌ 无效的 IP 地址格式: ${newIP}`);
    process.exit(1);
  }

  console.log(`📋 旧 IP: ${OLD_IP}`);
  console.log(`📋 新 IP: ${newIP}\n`);

  // 确认
  if (process.argv[2]) {
    console.log('⚠️  即将替换以下文件中的 IP 地址：\n');
    FILES_TO_UPDATE.forEach(file => {
      console.log(`   - ${file.path} (${file.description})`);
    });
    console.log('\n按 Ctrl+C 取消，按回车继续...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  }

  try {
    // 步骤 1: 更新所有配置文件
    console.log('\n📝 步骤 1: 更新配置文件...');
    let updatedCount = 0;

    for (const file of FILES_TO_UPDATE) {
      try {
        const modified = await replaceIPInFile(file.path, OLD_IP, newIP);
        if (modified) {
          console.log(`   ✅ ${file.description}`);
          updatedCount++;
        } else {
          console.log(`   ⏭️  ${file.description} (无需修改)`);
        }
      } catch (error) {
        console.log(`   ❌ ${file.description} - ${error.message}`);
      }
    }

    // 步骤 2: 生成 SSL 证书
    console.log('\n🔐 步骤 2: 生成 SSL 证书...');
    await generateCertificate(newIP);

    // 步骤 3: 重新构建前端
    console.log('\n🔨 步骤 3: 重新构建前端...');
    await rebuildFrontend();

    // 完成
    console.log('\n✨ IP 地址更换完成！\n');
    console.log('📋 后续步骤：');
    console.log('   1. 重启后端服务器（如果需要）');
    console.log('   2. 在手机浏览器测试访问:');
    console.log(`      https://${newIP}:5173/\n`);

  } catch (error) {
    console.error('\n❌ IP 更换失败:', error.message);
    console.error('\n请检查错误信息并手动修复！');
    process.exit(1);
  }
}

// 运行主函数
main();
