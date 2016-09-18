var canvas = document.querySelector('canvas'),
    context = canvas.getContext('2d');
canvas.height = canvas.width
/*
var centerX = canvas.width / 2;
var centerY = canvas.height / 2;
var radius = canvas.width / 2;



var centerX = canvas.width / 2;
var centerY = canvas.height / 2;
var radius = canvas.width / 2;

context.beginPath();
context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
context.lineWidth = 2;
context.strokeStyle = '#000000';
context.stroke();
*/
    var FFT_SIZE = 512;


function Visualizer(cfg) {
    this.isPlaying = false;
    this.autoplay = cfg.autoplay || false;
    this.loop = cfg.loop || false;
    this.audio = document.getElementById("audio") || {};
    this.canvas = document.getElementById("musicVisualizer") || {};
    this.canvasCtx = this.canvas.getContext('2d') || null;
    this.author = this.audio.getAttribute('data-author') || '';
    this.title = this.audio.getAttribute('data-title') || '';
    this.ctx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.frequencyData = [];
    this.audioSrc = null;
    this.duration = 0;
    this.minutes = '00';
    this.seconds = '00';
    this.style = cfg.style || 'lounge';
    this.barWidth = cfg.barWidth || 2;
    this.barHeight = cfg.barHeight || 2;
    this.barSpacing = cfg.barSpacing || 5;
    this.barColor = cfg.barColor || '#FF00FF';
    this.shadowBlur = cfg.shadowBlur || 10;
    this.shadowColor = cfg.shadowColor || '#FF00FF';
    this.font = cfg.font || ['12px', 'Helvetica'];
    this.gradient = null;
}

/**
   * @description
   * Set current audio context.
   *
   * @return {Object}
   */
Visualizer.prototype.setContext = function () {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new window.AudioContext();
        return this;
    } catch (e) {
        console.info('Web Audio API is not supported.', e);
    }
};

/**
 * @description
 * Set buffer analyser.
 *
 * @return {Object}
 */
Visualizer.prototype.setAnalyser = function () {
    this.analyser = this.ctx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.6;
    this.analyser.fftSize = FFT_SIZE;
    return this;
};

/**
 * @description
 * Set frequency data.
 *
 * @return {Object}
 */
Visualizer.prototype.setFrequencyData = function () {
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    return this;
};

/**
 * @description
 * Set source buffer and connect processor and analyser.
 *
 * @return {Object}
 */
Visualizer.prototype.setBufferSourceNode = function () {
    this.sourceNode = this.ctx.createMediaElementSource(this.audio);
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    /*
    this.sourceNode.onended = function () {
        clearInterval(INTERVAL);
        this.sourceNode.disconnect();
        this.resetTimer();
        this.isPlaying = false;
        this.sourceNode = this.ctx.createBufferSource();
    }.bind(this);
    */

    return this;
};

/**
 * @description
 * Set current media source url.
 *
 * @return {Object}
 */
Visualizer.prototype.setMediaSource = function () {
    this.audioSrc = this.audio.getAttribute('src');
    return this;
};

/**
 * @description
 * Set canvas gradient color.
 *
 * @return {Object}
 */
Visualizer.prototype.setCanvasStyles = function () {
    this.gradient = this.canvasCtx.createLinearGradient(0, 0, 0, 300);
    this.gradient.addColorStop(1, this.barColor);
    this.canvasCtx.fillStyle = this.gradient;
    this.canvasCtx.shadowBlur = this.shadowBlur;
    this.canvasCtx.shadowColor = this.shadowColor;
    this.canvasCtx.font = this.font.join(' ');
    this.canvasCtx.textAlign = 'center';
    return this;
};

/**
* @description
* Render frame on canvas.
*/
Visualizer.prototype.renderFrame = function () {
    requestAnimationFrame(this.renderFrame.bind(this));
    this.analyser.getByteFrequencyData(this.frequencyData);

    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderLounge();
};

/**
    * @description
    * Render lounge style type.
    */
Visualizer.prototype.renderLounge = function () {
    var cx = (this.canvas.width / 2);
    var cy = (this.canvas.height / 2);
    var radius = 100;
    var maxBarNum = Math.floor((radius * 2 * Math.PI) / (this.barWidth + this.barSpacing));
    var slicedPercent = Math.floor((maxBarNum * 25) / 100);
    var barNum = maxBarNum - slicedPercent;
    var freqJump = Math.floor(this.frequencyData.length / maxBarNum);

    for (var i = 0; i < barNum; i++) {
        var amplitude = this.frequencyData[i * freqJump];
        var alfa = (i * 2 * Math.PI) / maxBarNum;
        var beta = (3 * 45 - this.barWidth) * Math.PI / 180;
        var x = 0;
        var y = radius - (amplitude / 12 - this.barHeight);
        var w = this.barWidth;
        var h = amplitude / 6 + this.barHeight;

        this.canvasCtx.save();
        this.canvasCtx.translate(cx + this.barSpacing, cy + this.barSpacing);
        this.canvasCtx.rotate(alfa - beta);
        this.canvasCtx.fillRect(x, y, w, h);
        this.canvasCtx.restore();
    }
};
function _createVisualizer(cfg) {
    var visualizer = new Visualizer(cfg);
            visualizer
            .setContext()
            .setAnalyser()
            .setFrequencyData()
            .setBufferSourceNode()
            .setMediaSource()
            .setCanvasStyles();
        return visualizer;

}







