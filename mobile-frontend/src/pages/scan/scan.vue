<template>
  <view class="scan-container">
    <view class="placeholder-content">
      <view class="scan-icon">
        <text class="icon-text">📷</text>
      </view>
      <text class="placeholder-title">扫码功能</text>
      <text class="placeholder-desc">此功能暂未开放</text>
      <text class="placeholder-hint">功能开发中，敬请期待...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 扫码功能占位页面
// TODO: 实现扫码功能
</script>

<style lang="scss" scoped>
/* 医疗专业配色 */
$medical-blue: #0ea5e9;
$medical-teal: #14b8a6;
$bg-page: #f8fafc;

.scan-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, $bg-page 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .scan-icon {
    width: 320rpx;
    height: 320rpx;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 48rpx;
    border: 4rpx solid rgba(14, 165, 233, 0.2);

    .icon-text {
      font-size: 140rpx;
      opacity: 0.6;
    }
  }

  .placeholder-title {
    font-size: 40rpx;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 20rpx;
  }

  .placeholder-desc {
    font-size: 32rpx;
    color: #64748b;
    margin-bottom: 16rpx;
  }

  .placeholder-hint {
    font-size: 28rpx;
    color: #94a3b8;
  }
}
</style>
