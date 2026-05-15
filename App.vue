<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')

			// 加载 Liquid Glass 设计字体
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
