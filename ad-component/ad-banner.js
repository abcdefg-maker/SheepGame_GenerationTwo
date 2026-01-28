/**
 * 广告横幅组件
 * 可复用的广告展示组件，从 JSON 配置文件加载广告内容
 */
class AdBanner {
    /**
     * 创建广告横幅实例
     * @param {Object} options - 配置选项
     * @param {string} options.configUrl - JSON 配置文件的 URL
     * @param {string} options.container - 容器元素选择器
     * @param {number} [options.width=720] - 广告宽度
     * @param {number} [options.height=200] - 广告高度
     */
    constructor(options) {
        this.configUrl = options.configUrl;
        this.container = document.querySelector(options.container);
        this.width = options.width || 720;
        this.height = options.height || 200;
        this.baseCanvasWidth = 720;  // 游戏画布原始宽度
        this.config = null;
        this.element = null;

        if (!this.container) {
            console.error('AdBanner: Container not found:', options.container);
            return;
        }

        this.init();

        // 监听窗口大小变化，调整广告缩放
        var self = this;
        window.addEventListener('resize', function() {
            self.updateScale();
        });
    }

    /**
     * 初始化广告组件
     */
    async init() {
        try {
            await this.loadConfig();
            this.render();
        } catch (error) {
            console.error('AdBanner: Failed to initialize:', error);
        }
    }

    /**
     * 从 JSON 文件加载配置
     */
    async loadConfig() {
        const response = await fetch(this.configUrl);
        if (!response.ok) {
            throw new Error('Failed to load config: ' + response.status);
        }
        this.config = await response.json();
    }

    /**
     * 渲染广告横幅
     */
    render() {
        if (!this.config) {
            console.error('AdBanner: No config loaded');
            return;
        }

        var gameName = this.config.gameName;
        var iconUrl = this.config.iconUrl;
        var gameAdUrl = this.config.gameAdUrl;
        var score = this.config.score;

        // 创建广告 HTML 结构
        var wrapper = document.createElement('div');
        wrapper.className = 'ad-banner-wrapper';
        wrapper.style.width = this.width + 'px';
        wrapper.style.height = this.height + 'px';

        wrapper.innerHTML = 
            '<div class="ad-banner" data-url="' + this.escapeHtml(gameAdUrl) + '">' +
                '<span class="ad-banner-arrow">›</span>' +
                '<img class="ad-banner-icon" src="' + this.escapeHtml(iconUrl) + '" alt="' + this.escapeHtml(gameName) + '" />' +
                '<div class="ad-banner-content">' +
                    '<div class="ad-banner-title">' + this.escapeHtml(gameName) + '</div>' +
                    '<div class="ad-banner-subtitle">' +
                        'Download to earn<br/>' +
                        '<span class="ad-banner-score">' + score + '</span> points' +
                    '</div>' +
                '</div>' +
                '<div class="ad-banner-button">GO</div>' +
            '</div>';

        // 添加点击事件
        var banner = wrapper.querySelector('.ad-banner');
        var self = this;
        banner.addEventListener('click', function() {
            self.handleClick(gameAdUrl);
        });

        // 图片加载错误处理
        var icon = wrapper.querySelector('.ad-banner-icon');
        icon.addEventListener('error', function() {
            icon.src = 'data:image/svg+xml,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">' +
                    '<circle cx="40" cy="40" r="38" fill="#ddd" stroke="#ccc" stroke-width="2"/>' +
                    '<text x="40" y="45" text-anchor="middle" fill="#999" font-size="12">No Image</text>' +
                '</svg>'
            );
        });

        this.element = wrapper;
        this.container.appendChild(wrapper);

        // 初始化时调整缩放
        this.updateScale();
    }

    /**
     * 根据画布大小更新广告缩放比例
     */
    updateScale() {
        if (!this.element) return;

        var canvas = document.getElementById('c2canvas');
        if (!canvas) return;

        // 获取画布的实际显示宽度
        var canvasRect = canvas.getBoundingClientRect();
        var canvasDisplayWidth = canvasRect.width;

        // 计算缩放比例
        var scale = canvasDisplayWidth / this.baseCanvasWidth;

        // 应用缩放变换
        this.element.style.transform = 'translateX(-50%) scale(' + scale + ')';
        this.element.style.transformOrigin = 'top center';
    }

    /**
     * 处理广告点击
     * @param {string} url - 跳转链接
     */
    handleClick(url) {
        if (url) {
            window.open(url, '_blank');
        }
    }

    /**
     * 转义 HTML 特殊字符，防止 XSS
     * @param {string} str - 需要转义的字符串
     * @returns {string} 转义后的字符串
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return str;
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 更新广告配置
     * @param {Object} newConfig - 新的配置对象
     */
    updateConfig(newConfig) {
        var key;
        for (key in newConfig) {
            if (newConfig.hasOwnProperty(key)) {
                this.config[key] = newConfig[key];
            }
        }
        if (this.element) {
            this.element.remove();
        }
        this.render();
    }

    /**
     * 显示广告
     */
    show() {
        if (this.element) {
            this.element.style.display = 'flex';
        }
    }

    /**
     * 隐藏广告
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    /**
     * 销毁广告组件
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// 导出到全局作用域
window.AdBanner = AdBanner;
