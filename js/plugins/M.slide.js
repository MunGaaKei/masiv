;(function(M, doc, plugin){

    function Slide( el, settings ){
        this.$sets = M.extend({
            prev: 'PREV',
            next: 'NEXT',
            navsTrigger: 'click',
            loop: true,
            display: 1,
            scroll: 1,
            start: 0,
            duration: 3000,
            rtl: false,
            speed: 300,
            easing: 'ease',
            vertical: false,        // BOOLEAN, an at least height needed
            fade: false,            // BOOLEAN, fade toggle
            swipe: true,
        }, settings);

        generate( this, el );

        mount( this, el );

        initialize( this, el );

        el.$slide = this;
    }


    /* 生成 HTML 结构 */
    function generate( self, parent ){
        self.html = parent.innerHTML;
        var children = parent.children;
        var l = children.length;
        var s = self.$sets;
        var html = '<div class="msv-slide"><div class="msv-slide-area"><ul class="msv-slide-track" style="transform:translate3d(0,0,0);width:';
        var tpl = formatSlider( children, l, self );

        self.length = l;
        self.template = tpl.slice();
        s.start = Math.abs(s.start % l);
        s.responsive && responsive( self );
        s.scroll = s.display >= s.scroll? s.scroll: s.display;

        if( s.loop && s.display < l ){
            var tail = s.display + s.scroll - 1;
            var total = l + tail;
            var k = 0;
            for(; k < tail; k++){ tpl.push(tpl[k % l]); }
            self.total = total;

            html += (total / s.display * 100) +'%;">'+ tpl.join('');
        } else {
            html += (l / s.display * 100) +'%;">'+ tpl.join('');
        }
        html += '</ul></div>';

        /* PREV & NEXT */
        html += '<a class="msv-slide-arrow msv-slide-prev">'+ (s.prev || '&lt;') +'</a>\
                <a class="msv-slide-arrow msv-slide-next">'+ (s.next || '&gt;') +'</a></div>';

        /* Navs */
        html += '<ul class="msv-slide-navs">';
        if( s.navs && l > s.display ){
            html += formatNavs(Math.ceil((l - s.display) / s.scroll));
        }
        html += '</ul>';

        parent.innerHTML = html;
    }


    /* 返回 Slider 模板数组 */
    function formatSlider( nodes, l ){
        var tpl = [];
        var i = 0;
        var el, outer;

        for(; i < l; i++){
            el = nodes[i];
            if( el.tagName === 'LI' ){
                el.classList.add('msv-slider');
                el.dataset.slide = i;
                outer = el.outerHTML;
            } else {
                outer = '<li class="msv-slider" data-slide="'+ i +'">'+ el.outerHTML +'</li>';
            }
            tpl[i] = outer;
        }

        return tpl;
    }

    /* 生成 Navs */
    function formatNavs( l ){
        var navs = '';
        while( l >= 0 ){
            navs = '<li data-slide="'+ l +'">'+ l +'</li>' + navs;
            --l;
        }
        return navs;
    }




    /* 挂载方法与属性 */
    function mount( self, el ){
        var s = self.$sets;

        self.target = el;
        self.track = el.querySelector('.msv-slide-track');
        self.navs = s.navs? el.querySelector('.msv-slide-navs'): undefined;

        self.arrowPrev = el.querySelector('.msv-slide-prev');
        self.prev = function(){ return self.goto( self.current - s.scroll, false ); };
        self.arrowNext = el.querySelector('.msv-slide-next');
        self.next = function(){ return self.goto( self.current + s.scroll, true ); };

        self.goto = goto;
        self.destroy = destroy;

        self.slide = function(){ return self; }
    }

    /* 根据索引与方向切换 */
    function goto( i, direct ){
        var self = this;
        if( self.sliding ) return self;

        i -= 0;
        var c = self.current;
        var s = self.$sets;
        var l = self.length;
        var total = l;
        var t = self.track;


        if( s.loop && l > s.display ){
            i += i < 0? l: 0;
            if(c === i%l && direct !== 0) return self;
            self.sliding = true;
            total = self.total;

            if( direct === false ){
                if( c === 0 ){
                    i = l - s.display;
                    t.style.transform = 'translate3d('+ (-(c + l) / total * 100) +'%,0,0)';
                    t.offsetWidth;
                }
                if( c > 0 && c < s.scroll ){
                    i = 0;
                }
            } else if ( direct === true ){
                if( c === l - s.display ) i = l;
            }
            if( i < l - 1 && i > l - s.display ) i = l - s.scroll - 1;
        } else {
            if( i + s.display >= l ){
                i = l - s.display;
                i = i < 0? 0: i;
            } else if( i < 0 ){
                i = 0;
            }
            if(c === i && direct !== 0) return self;
            self.sliding = true;
        }
        typeof s.beforeSlide === 'function' && s.beforeSlide.call(self, c, i%l);

        t.style.transition = 'all '+ s.speed + 'ms '+ s.easing;
        t.style.transform = 'translate3d('+ (-i / total * 100) +'%,0,0)';

        i %= l;

        if( self.navs ){
            var nav = self.navs.querySelector('.msv-slide-active');
            nav && nav.classList.remove('msv-slide-active');
            var navs = self.navs.children;
            nav = navs[Math.ceil(i / s.scroll)];
            nav && nav.classList.add('msv-slide-active');
        }

        M('.msv-slider', self.track).each(function( slider, j ){
            j += l * 2;
            slider.classList[(j - i)%l < s.display ? 'add': 'remove']('msv-slide-active');
        });

        setTimeout(function(){
            t.style.transition = 'none';

            if( s.loop ) t.style.transform = 'translate3d('+ (-i / self.total * 100) +'%,0,0)';
            self.sliding = false;
            self.current = i;
            typeof s.afterSlide === 'function' && s.afterSlide.call(self, i);
        }, s.speed);
        
        return self;
    }

    /* 注销实例 */
    function destroy(){
        var self = this;
        var el = self.target;
        self.arrowPrev = null;
        self.arrowNext = null;
        self.track = null;
        if( self.navs ) self.navs = null;
        el.classList.remove('msv-slide-initialized');
        el.innerHTML = self.html;
        el.$slide = self = self.target = null;
    }



    /* 初始化 */
    function initialize( self, el ){
        var s = self.$sets;
        self.goto(s.start, !s.rtl);

        self.navs && self.navs.addEventListener(s.navsTrigger, function( e ){
            var nav = e.target;
            if( nav.matches('li') && !nav.classList.contains('msv-slide-active') ){
                self.goto(nav.dataset.slide * s.scroll);
            }
        }, true);

        self.arrowPrev.addEventListener('click', self.prev);
        self.arrowNext.addEventListener('click', self.next);

        var f = self.length <= s.display;
        (!s.prev || f) && self.arrowPrev.classList.add('msv-slide-hidden');
        (!s.next || f) && self.arrowNext.classList.add('msv-slide-hidden');

        if( s.auto ){
            s.interval = setInterval(self[s.rtl? 'prev': 'next'], s.duration);
            if( s.pauseOnHover ){
                self.target.addEventListener('mouseenter', function(){ clearInterval(s.interval); });
                self.target.addEventListener('mouseleave', function(){ s.interval = setInterval(self[s.rtl? 'prev': 'next'], s.duration); });
            }
        }

        if( s.swipe ){
            self.target.addEventListener('swipeLeft', function(e){
                e.stopPropagation();
                self.next();
            });
            self.target.addEventListener('swipeRight', function(e){
                e.stopPropagation();
                self.prev();
            });
        }

        el.classList.add('msv-slide-initialized');
    }

    function responsive( self ){
        var s = self.$sets;
        self.rawSets = M.extend({}, s);
        self.breakpoint = 0;
        var brpts = Object.keys(s.responsive).sort();
        var bp = rtnBreakpoint(brpts, window.innerWidth);
        if(bp < brpts.length){
            self.breakpoint = brpts[bp];
            bp = brpts[bp];
            M.extend(s, s.responsive[bp]);
        }

        window.addEventListener('resize', M.throttle(function(){
            var bp = rtnBreakpoint(brpts, window.innerWidth);
            bp = brpts[bp] || 0;
            if(self.breakpoint === bp) return;
            
            self.breakpoint = bp;
            M.extend(self.$sets, bp === 0? self.rawSets: s.responsive[bp]);
            reSlide( self );
        }));
    }

    function rtnBreakpoint( brpts, w ){
        var l = brpts.length;
        while( l-- ){ if(w > brpts[l]) break; }
        return l + 1;
    }

    function reSlide( self ){
        var s = self.$sets;
        var t = self.track;
        var tpl = self.template.slice();
        var l = tpl.length;
        var total = l;

        self.length = l;
        s.scroll = s.display >= s.scroll? s.scroll: s.display;

        if( s.loop && l > s.display ){
            var tail = s.display + s.scroll - 1;
            total = l + tail;
            var k = 0;
            for(; k < tail; k++){ tpl.push(tpl[k % l]); }
            self.total = total;
        }

        t.style.width = total / s.display * 100 + '%';
        t.innerHTML = tpl.join('');

        var f = self.length <= s.display;

        if( s.navs ){
            if( f ){
                self.navs && (self.navs.innerHTML = '');
                self.navs = null;
            } else {
                self.navs = self.target.querySelector('.msv-slide-navs');
                self.navs.innerHTML = formatNavs(Math.ceil((l - s.display) / s.scroll));
            }
        }

        self.rawSets.prev && self.arrowPrev.classList[f? 'add': 'remove']('msv-slide-hidden');
        self.rawSets.next && self.arrowNext.classList[f? 'add': 'remove']('msv-slide-hidden');

        self.goto(self.current, 0);
    }




    /* 添加到 MASIV 上 */
	M.MASIV[plugin] = function( a, b ){
        return this.each(function( el ){
            var $slide = el.$slide;
            $slide?
            (typeof $slide[a] === 'function' && $slide[a](b) ) :
            new Slide( el, a );
        });
	}

})(M, document, 'slide');
