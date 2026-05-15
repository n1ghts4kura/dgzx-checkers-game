// ==========================================
// 音效 — 条件编译: H5 用 Web Audio API, MP 用 InnerAudioContext
// ==========================================

export function playCaptureSound() {
  // #ifdef H5
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 400;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) { /* ignore */ }
  // #endif

  // #ifdef MP-WEIXIN
  const audio = uni.createInnerAudioContext();
  audio.src = '/static/audio/capture.mp3';
  audio.play();
  // #endif
}

export function playVictorySound() {
  // #ifdef H5
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = audioCtx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (e) { /* ignore */ }
  // #endif

  // #ifdef MP-WEIXIN
  const audio = uni.createInnerAudioContext();
  audio.src = '/static/audio/victory.mp3';
  audio.play();
  // #endif
}
