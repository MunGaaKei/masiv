;(function(M, doc, plugin){

    function Player( el, settings ){
        var ds = el.dataset;
        this.$sets = M.extend({
            title: ds.title || '',
            src: ds.src,
            control: true && ds.control !== 'false',
            time: true,
            vol: .5,
            play: '<i class="iconfont icon-play"></i>',
            pause: '<i class="iconfont icon-pause"></i>',
            stop: '<i class="iconfont icon-stop"></i>',
            volume: '<i class="iconfont icon-volume"></i>',
            mute: '<i class="iconfont icon-mute"></i>',
            fullscreen: '<i class="iconfont icon-fullscreen"></i>',
            exitfull: '<i class="iconfont icon-fullscreen-exit"></i>',
            forward: '<i class="iconfont icon-forward"></i>',
            backward: '<i class="iconfont icon-backward"></i>',
            color: 'blue',
            forwardUnit: 3,
            tip: true
        }, settings);

        generate( this, el );

        initialize( this, el );
    }

    /* 生成 Video 结构 */
    function generate( self, el ){
        var s = self.$sets;

        var html = '<video';
        if( s.src.length ){
            s.src = getPlayList(s.src);
            el.removeAttribute('data-src');
            html += ' src="'+ s.src[0] +'"';
        }
        if(s.loop !== false && s.loop !== undefined){
            el.removeAttribute('data-loop');
            html += ' loop="loop"';
        }
        if(s.preload || s.preload === true){
            el.removeAttribute('data-preload');
            html += ' preload="'+ s.preload +'"';
        }
        if( s.poster ){
            el.removeAttribute('data-poster');
            html += ' poster="'+ s.poster +'"';
        }
        html += '><i>MASIV VIDEO</i></video>';

        if( s.title ){
            html += '<div class="player-title" title="'+ s.title +'">'+ s.title +'</div>';
        }

        if( s.control ){
            el.removeAttribute('data-control');
            html += '<div class="player-controls">\
                        <div class="progress player-progress"><div class="bar '+ s.color +'" style="width:0;"></div></div>'
                        + (s.play? '<a class="player-act player-play">'+ s.play +'</a>': '') +'\
                        <span class="player-time"></span>'
                        + (s.stop? '<a class="player-act player-stop">'+ s.stop +'</a>': '')
                        + (s.volume? '<div class="player-widget">\
                                        <a class="player-act player-mute">'+ s.volume +'</a>\
                                        <div class="player-popup"><div class="progress player-volume"><div class="bar '+ s.color +'" style="height:0;"></div></div></div>\
                                     </div>': '')
                        + (s.fullscreen? '<a class="player-act player-full">'+ s.fullscreen +'</a>': '') +
                    '</div>';
        }

        if( s.tip ) html += '<div class="player-tip"></div>';

        el.classList.add('player');
        el.innerHTML = html;
    }


    /* 初始化事件与属性 */
    function initialize( self, el ){
        var s = self.$sets;
        var v = self.player = el.firstChild;

        el.$player = self;
        self.playlist = s.src;
        self.isFullScreen = false;
        self.inform = inform;
        v.volume = s.vol;

        if( s.control ){
            var duration;
            v.addEventListener('loadedmetadata', function(){ duration = self.duration = formatTime(this.duration); });

            var c = el.querySelector('.player-controls');
            var time = c.querySelector('.player-time');
            var pp = c.querySelector('.player-play');
            var prgs = c.querySelector('.player-progress');
            var barp = prgs.firstChild;
            var stop = c.querySelector('.player-stop');
            var mute = c.querySelector('.player-mute');
            var vols = c.querySelector('.player-volume');
            var barv = vols.firstChild;
            var full = c.querySelector('.player-full');
            var tip = el.querySelector('.player-tip');

            self.tip = tip;
            c.addEventListener('click', function(e){ e.stopPropagation(); });
            el.addEventListener('click', function(){ play.call(v); });

            if( pp ){
                pp.addEventListener('click', play.bind(v));
                v.addEventListener('play', function(){ pp.innerHTML = s.pause; });
                v.addEventListener('pause', function(){ pp.innerHTML = s.play; });
            }

            prgs.addEventListener('mousedown', function(e){
                var ox = e.offsetX;
                v.currentTime = v.duration * ox / this.offsetWidth;
            });
            v.addEventListener('timeupdate', function(){
                if(s.time) time.innerHTML = formatTime(this.currentTime) +' / '+ duration;
                barp.style.width = this.currentTime * 100 / this.duration +'%';
            });

            stop && stop.addEventListener('click', function(){
                v.currentTime = 0;
                v.pause();
            });

            if( mute ){
                mute.addEventListener('click', function(){ v.muted = !v.muted; });
                vols.addEventListener('mousedown', function(e){
                    var oy = e.offsetY;
                    v.volume = oy / this.offsetHeight;
                });
                v.addEventListener('volumechange', function(){
                    var h = Math.round(v.volume * 100);
                    barv.style.height = h +'%';
                    
                    if( v.muted ){
                        mute.innerHTML = s.mute;
                        self.inform(s.mute);
                    } else {
                        mute.innerHTML = s.volume;
                        self.inform(s.volume +': '+ h +'%');
                    }
                });
            }

            if( full ){
                doc.addEventListener('fullscreenchange', function(){
                    self.isFullScreen = !self.isFullScreen;
                    full.innerHTML = self.isFullScreen? s.exitfull: s.fullscreen;
                });
                full.addEventListener('click', function(){ self.isFullScreen? exitFullScreen(): fullScreen(el); });
            }
        }

        doc.addEventListener('keydown', function( e ){
            if( !self.isFullScreen ) return;
            e.preventDefault();

            var key = e.keyCode || e.which;
            var vol = v.volume; 
            
            switch ( key ){
                case 32:
                    play.call(v);
                    break;
                case 37:
                    v.currentTime -= s.forwardUnit;
                    break;
                case 38:
                    v.muted = false;
                    vol += .1;
                    v.volume = vol > 1? 1: vol;
                    break;
                case 39:
                    v.currentTime += s.forwardUnit;
                    break;
                case 40:
                    v.muted = false;
                    vol -= .1;
                    v.volume = vol < 0? 0: vol;
                default: break;
            }
        });
    }


    /* 返回 src 数组 */
    function getPlayList( srcs ){
        if(typeof srcs === 'string'){
            var list = [];
            srcs = srcs.split(',');
            var i = 0;
            var l = srcs.length;
            for(; i < l; i++){
                list.push(srcs[i].trim());
            }
            return list;
        }
        return srcs;
    }

    /* 播放 暂停 */
    function play(){ this.paused? this.play(): this.pause(); }

    /* 提示 */
    function inform( text ){
        var self = this;
        var s = self.$sets;
        var tip = self.tip;
        if( !tip || !s.tip ) return;
        var t = self.timer;
        t && clearTimeout(t);
        tip.innerHTML = text;
        tip.classList.add('player-tip-on');
        self.timer = setTimeout(function(){
            tip.classList.remove('player-tip-on');
        }, 1500);
    }

    /* 进入全屏 */
    function fullScreen( el ){
        (el.requestFullscreen && el.requestFullscreen()) ||
        (el.mozRequestFullScreen && el.mozRequestFullScreen()) ||
        (el.webkitRequestFullscreen && el.webkitRequestFullscreen()) ||
        (el.msRequestFullscreen && el.msRequestFullscreen());
    }

    /* 退出全屏 */
    function exitFullScreen(){
        (doc.exitFullscreen && doc.exitFullscreen()) ||
        (doc.msExitFullscreen && doc.msExitFullscreen()) ||
        (doc.mozCancelFullScreen && doc.mozCancelFullScreen()) ||
        (doc.webkitExitFullscreen && doc.webkitExitFullscreen());
    }

    /* 播放时间格式 */
    function formatTime( time ){
        var min = Math.floor(time / 60),
			sec = Math.floor(time % 60);
		min = min < 10? ('0' + min): min;
		sec = sec < 10? ('0' + sec): sec;
		return min + ':' + sec;
    }
    
    /* 挂载 */
	M.MASIV[plugin] = function( a, b ){
        return this.each(function( el ){
            var $player = el.$player;
            $player?
            (typeof $player[a] === 'function' && $player[a](b) ) :
            new Player( el, a );
        });
	}

    /* 自动初始 */
    M('[masiv-player]').player();

})(M, document, 'player');
