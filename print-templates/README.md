# 康复治疗记录系统 - 打印模板

提供标准的A4打印模板，用于打印治疗记录和统计报表。

## 模板列表

### 1. 康复治疗全程记录单 (`treatment-record.html`)

**用途**: 打印单个患者的完整治疗记录

**包含内容**:
- 患者基本信息 (姓名、性别、年龄、病历号等)
- 治疗记录明细表格
  - 日期、时间、项目、治疗师
  - 治疗时长、患者反应、照片数量
- 治疗照片展示 (3列网格布局)
- 统计汇总信息
  - 治疗总次数
  - 总时长
  - 涉及项目数
  - 照片总数
- 签名区域
  - 治疗师签名
  - 主管医师签名
  - 患者(家属)签名
- 打印日期

**纸张规格**: A4 纵向 (210mm × 297mm)

**使用方法**:
```javascript
// 使用模板引擎渲染
const data = {
  patientName: "王建国",
  gender: "男",
  age: "68",
  // ... 其他数据
};

// 使用Handlebars等模板引擎渲染
const template = require('./treatment-record.html');
const html = renderTemplate(template, data);

// 打印或生成PDF
window.print();
```

---

### 2. 治疗师工作量报表 (`therapist-workload.html`)

**用途**: 打印指定时间段内的治疗师工作量统计

**包含内容**:
- 统计时间范围
- 统计卡片 (5个)
  - 治疗总人次
  - 总时长
  - 治疗患者数
  - 活跃治疗师数
  - 涉及项目数
- 治疗师工作量排名表
  - 排名
  - 治疗师姓名
  - 治疗人次
  - 工作时长
  - 服务患者数
  - 参与项目
  - 平均时长
- 项目使用统计表
  - 项目排名
  - 使用次数
  - 占比
  - 总时长
  - 平均时长
- 签名区域
  - 制表人签名
  - 康复科主任签名
  - 院长签名
- 打印日期

**纸张规格**: A4 横向 (297mm × 210mm)

**使用方法**:
```javascript
const data = {
  startDate: "2026-01-01",
  endDate: "2026-01-10",
  therapistStats: [...],
  projectStats: [...]
};
```

---

## 模板变量说明

### 治疗记录单变量

| 变量名 | 类型 | 说明 |
|--------|------|------|
| patientName | string | 患者姓名 |
| gender | string | 性别 |
| age | string | 年龄 |
| medicalRecordNo | string | 病历号 |
| insuranceType | string | 医保类型 |
| doctor | string | 主管医师 |
| admissionDate | string | 入院日期 (YYYY-MM-DD) |
| diagnosis | string | 主要诊断 |
| records | array | 治疗记录数组 |
| records[].treatmentDate | string | 治疗日期 |
| records[].startTime | string | 开始时间 |
| records[].endTime | string | 结束时间 |
| records[].projectName | string | 项目名称 |
| records[].therapistName | string | 治疗师 |
| records[].durationMinutes | number | 时长(分钟) |
| records[].outcome | string | 患者反应 |
| records[].photoCount | number | 照片数量 |
| photos | array | 照片数组 (可选) |
| photos[].filePath | string | 照片路径 |
| photos[].fileName | string | 文件名 |
| photos[].photoTime | string | 拍照时间 |
| totalCount | number | 治疗总次数 |
| totalDuration | number | 总时长(分钟) |
| projectCount | number | 项目数 |
| totalPhotos | number | 照片总数 |
| printDate | string | 打印日期 |

### 工作量报表变量

| 变量名 | 类型 | 说明 |
|--------|------|------|
| startDate | string | 开始日期 (YYYY-MM-DD) |
| endDate | string | 结束日期 (YYYY-MM-DD) |
| printTime | string | 打印时间 |
| printDate | string | 打印日期 |
| totalRecords | number | 治疗总人次 |
| totalDuration | string | 总时长(小时) |
| totalPatients | number | 治疗患者数 |
| activeTherapists | number | 活跃治疗师数 |
| totalProjects | number | 涉及项目数 |
| therapistStats | array | 治疗师统计 |
| therapistStats[].therapistName | string | 治疗师姓名 |
| therapistStats[].count | number | 治疗人次 |
| therapistStats[].duration | string | 时长(小时) |
| therapistStats[].patientCount | number | 患者数 |
| therapistStats[].projects | string | 项目列表 |
| therapistStats[].avgDuration | string | 平均时长 |
| projectStats | array | 项目统计 |
| projectStats[].projectName | string | 项目名称 |
| projectStats[].count | number | 使用次数 |
| projectStats[].percentage | string | 占比(%) |
| projectStats[].totalDuration | string | 总时长 |
| projectStats[].avgDuration | string | 平均时长 |

---

## 集成方法

### 方法1: 前端直接打印

```javascript
// 1. 获取数据
const data = await api.getTreatmentRecord(patientId);

// 2. 渲染模板
const template = await fetch('/print-templates/treatment-record.html').then(r => r.text());
const html = renderTemplate(template, data);

// 3. 打开新窗口打印
const printWindow = window.open('', '_blank');
printWindow.document.write(html);
printWindow.document.close();
printWindow.print();
```

### 方法2: 后端生成PDF

```javascript
// 使用Puppeteer或Playwright在后端生成PDF
const puppeteer = require('puppeteer');

async function generatePDF(templatePath, data) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 渲染模板
  const html = renderTemplate(templatePath, data);

  // 加载内容
  await page.setContent(html);

  // 生成PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  return pdf;
}
```

### 方法3: 使用在线打印服务

```javascript
// 集成第三方打印服务
// 如: Print.js, html2pdf.js 等
```

---

## 样式定制

### 修改主题色

在模板的 `<style>` 标签中修改CSS变量:

```css
:root {
  --primary-color: #409eff;
  --border-color: #000;
  --background-color: #f5f5f5;
}
```

### 修改字体

```css
body {
  font-family: "SimSun", "宋体", serif; /* 宋体 */
  /* 或 */
  font-family: "SimHei", "黑体", sans-serif; /* 黑体 */
}
```

### 调整页边距

```css
@page {
  size: A4;
  margin: 15mm 15mm 15mm 15mm; /* 上 右 下 左 */
}
```

---

## 打印设置建议

### 浏览器打印设置

1. **布局**: 纵向 (治疗记录单) / 横向 (工作量报表)
2. **纸张尺寸**: A4 (210mm × 297mm)
3. **边距**: 默认或无
4. **背景图形**: 勾选
5. **页眉页脚**: 不勾选

### 浏览器兼容性

- Chrome/Edge: 完美支持
- Firefox: 完美支持
- Safari: 完美支持
- IE11: 部分支持 (建议升级)

---

## 注意事项

1. **照片路径**: 确保照片路径可访问，建议使用绝对路径
2. **数据验证**: 打印前验证数据完整性
3. **分页处理**: 长表格会自动分页
4. **签名区域**: 预留足够的签名空间
5. **打印预览**: 打印前务必使用打印预览检查效果
6. **浏览器缓存**: 模板修改后清除浏览器缓存

---

## 常见问题

### Q: 照片显示不出来?
A: 检查照片路径是否正确，确保使用绝对路径或可访问的URL

### Q: 表格断页问题?
A: 使用CSS的 `page-break-inside: avoid;` 避免表格断页

### Q: 打印字体很小?
A: 调整浏览器打印缩放比例，或修改模板中的字体大小

### Q: 如何批量打印?
A: 使用后端生成PDF，或使用浏览器自动化工具

---

**版本**: 1.0.0
**更新日期**: 2026年1月10日
**维护团队**: Rehab System Team
