"""
扫码图标生成脚本
运行方法：python generate-icons.py
需要安装：pip install Pillow
"""

from PIL import Image, ImageDraw
import os

def draw_qr_code_icon(draw, color, size, line_width):
    """绘制扫码图标"""
    padding = int(size * 0.2)
    corner_size = int(size * 0.25)

    # 左上角
    draw.line([(padding, padding + corner_size), (padding, padding), (padding + corner_size, padding)],
              fill=color, width=line_width)

    # 右上角
    draw.line([(size - padding - corner_size, padding), (size - padding, padding), (size - padding, padding + corner_size)],
              fill=color, width=line_width)

    # 左下角
    draw.line([(padding, size - padding - corner_size), (padding, size - padding), (padding + corner_size, size - padding)],
              fill=color, width=line_width)

    # 右下角
    draw.line([(size - padding - corner_size, size - padding), (size - padding, size - padding),
               (size - padding, size - padding - corner_size)],
              fill=color, width=line_width)

    # 中间扫描线（水平）
    draw.line([(padding + corner_size, size // 2), (size - padding - corner_size, size // 2)],
              fill=color, width=line_width)

    # 中间扫描线（垂直）
    draw.line([(size // 2, padding + corner_size), (size // 2, size - padding - corner_size)],
              fill=color, width=line_width)

def generate_icons():
    size = 81
    line_width = 2

    # 生成灰色图标
    img_gray = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw_gray = ImageDraw.Draw(img_gray)
    draw_qr_code_icon(draw_gray, (122, 174, 131), size, line_width)  # #7A7E83
    img_gray.save('scan.png')
    print('[OK] Generated scan.png')

    # 生成蓝色图标
    img_blue = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw_blue = ImageDraw.Draw(img_blue)
    draw_qr_code_icon(draw_blue, (14, 165, 233), size, line_width)  # #0ea5e9
    img_blue.save('scan-active.png')
    print('[OK] Generated scan-active.png')

    print('\n[SUCCESS] Icons generated successfully!')
    print(f'[PATH] {os.path.dirname(os.path.abspath(__file__))}')

if __name__ == '__main__':
    try:
        generate_icons()
    except ImportError:
        print('[ERROR] Pillow library not found')
        print('Please run: pip install Pillow')
