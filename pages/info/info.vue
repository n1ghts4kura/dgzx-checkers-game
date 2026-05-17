<template>
  <view class="page-info">
    <BackgroundBlobs />

    <GameAppBar title="关于我们" left-icon="arrow_back" @left-click="goBack" />

    <view class="info-scroll">
      <view class="article">
        <GlassCard class="article-card">
          <text class="article-heading">项目简介</text>
          <view class="article-divider" />
          <text class="article-body">
            障碍跳棋是一款单人策略解谜游戏。玩家操控棋子，在 17 行六边形棋盘上跳跃前进，
            吃掉路径上的彩色障碍物，最终抵达顶部三角形区域获得胜利。
          </text>
          <text class="article-body">本作灵感来源于 B站-GM的秘密基地 的一期视频。</text>
          <text class="article-body">原视频BV号：<text class="link-text" @tap="copyBVNumber">BV1V1rKB3ETn</text>（点击复制）</text>
        </GlassCard>

        <GlassCard class="article-card">
          <text class="article-heading">开发团队</text>
          <view class="article-divider" />
          <text class="article-body">构思 2027届学生会学习部</text>
          <text class="article-body">开发 2027届208 夜樱 n1ghts4kura</text>
        </GlassCard>

        <GlassCard class="article-card">
          <text class="article-heading">你也想写一个这样的程序？</text>
          <view class="article-divider" />
          <text class="article-body">前往B站关注 夜樱n1ghts4kura，获取后续教程更新！</text>
        </GlassCard>

        <GlassCard class="article-card">
          <text class="article-heading">致谢</text>
          <view class="article-divider" />
          <text class="article-body">感谢所有参与测试与反馈的朋友们！</text>
          <text class="article-body">如果你有任何想法或建议，欢迎联系！</text>
        </GlassCard>

        <view class="article-bottom-spacer" />
      </view>
    </view>
  </view>
</template>

<script>
import GameAppBar from '@/components/GameAppBar.vue'
import BackgroundBlobs from '@/components/BackgroundBlobs.vue'
import GlassCard from '@/components/GlassCard.vue'

export default {
  name: 'InfoPage',
  components: { GameAppBar, BackgroundBlobs, GlassCard },
  methods: {
    goBack() { uni.navigateBack() },
    copyBVNumber() {
      uni.setClipboardData({
        data: 'BV1V1rKB3ETn',
        success() { uni.showToast({ title: 'BV号已复制，去B站搜索即可', icon: 'none', duration: 2000 }) }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../common/design-tokens';
@import '../../common/glass-utilities';

.page-info {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: $color-background;
  font-family: $font-body;
  color: $color-on-surface;
  position: relative;
}

.info-scroll {
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 10;
}

.article {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding: 24rpx 24rpx 0;
}

.article-card {
  padding: 32rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.article-heading {
  font-family: $font-headline;
  font-size: 22px;
  font-weight: 800;
  color: $color-primary;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.article-divider {
  height: 1px;
  background: linear-gradient(90deg, $color-primary 0%, rgba($color-primary, 0.15) 100%);
  border-radius: 1px;
  margin: 8rpx 0;
}

.article-body {
  font-family: $font-body;
  font-size: $fs-body-md;
  line-height: 1.75;
  color: $color-on-surface;
  text-align: justify;
}

.link-text {
  font-family: $font-body;
  font-size: $fs-body-md;
  line-height: 1.75;
  color: $color-primary;
  font-weight: 700;
  text-decoration: underline;
}

.article-bottom-spacer {
  height: calc(48rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
}
</style>
