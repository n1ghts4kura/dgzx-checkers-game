<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')

			// 加载字体 — H5 从本地文件 (common/fonts.css @font-face)
			// 小程序从 Google Fonts CDN (wx.loadFontFace 需要网络 URL)
			// #ifdef MP-WEIXIN
			wx.loadFontFace({
				family: 'Manrope',
				source: 'url("https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&display=swap")',
				success: function() { console.log('Manrope loaded') }
			})
			wx.loadFontFace({
				family: 'Hanken Grotesk',
				source: 'url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;700&display=swap")',
				success: function() { console.log('Hanken Grotesk loaded') }
			})
			wx.loadFontFace({
				family: 'Material Symbols Outlined',
				source: 'url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap")',
				success: function() { console.log('Material Symbols loaded') }
			})
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
		/* 本地字体 — 仅 H5（MP 由 wx.loadFontFace 加载） */
		/* #ifdef H5 */
		@import './common/fonts.css';
		/* #endif */

		/* Material Symbols — H5 CDN / MP wx.loadFontFace (2.3MB 不打包) */
		/* #ifdef H5 */
		@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap');
		/* #endif */

	/* 全局页面样式 */
	page {
		background-color: #f7f9fb;
		font-family: 'Hanken Grotesk', -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: 14px;
		color: #191c1e;
		-webkit-font-smoothing: antialiased;
		animation: pageTransition 400ms ease-out;
		transition: opacity 200ms ease-in;
	}

	@keyframes pageTransition {
		0%   { opacity: 0; }
		50%  { opacity: 0; }
		100% { opacity: 1; }
	}
</style>
