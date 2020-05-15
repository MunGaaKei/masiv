;(function( global, factory ){
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) : (global.M = factory());
})( this, function(){

	var global = this;
	var doc = global.document;

	/* 常量设置 */
	var PREFIX = doc.body.getAttribute('masiv-namespace') || '';
	var ANIMATE_DURATION = 200;
	var IN_CLASS = 'msv-in';
	var ACTIVE_CLASS = 'msv-active';
	var CAN_TOUCH = 'ontouchend' in doc;
	var EvtMaps = {
		beforeOpen: new CustomEvent('beforeOpen', { bubbles: true, cancelable: true }),
		open: new CustomEvent('open', { bubbles: true, cancelable: true }),
		beforeClose: new CustomEvent('beforeClose', { bubbles: true, cancelable: true }),
		close: new CustomEvent('close', { bubbles: true, cancelable: true })
	};
	var EvtAlias = {
		ready: 'DOMContentLoaded',
		mousewheel: /Firefox/i.test(navigator.userAgent)? 'DOMMouseScroll': 'mousewheel',
		mousedown: CAN_TOUCH? 'touchstart': 'mousedown',
		mouseup: CAN_TOUCH? 'touchend': 'mouseup',
		mousemove: CAN_TOUCH? 'touchmove': 'mousemove',
		click: CAN_TOUCH? 'tap': 'click'
	};

	/* 添加移动端事件 */
	CAN_TOUCH && (function(){
		createEvent( 'tap' );
		createEvent( 'swipeLeft' );
		createEvent( 'swipeRight' );
		createEvent( 'swipeUp' );
		createEvent( 'swipeDown' );
		createEvent( 'press' );

		var touch = {};
		
		doc.addEventListener('touchstart', function( e ){
			var t = e.touches[0];
			touch = {
				x: t.clientX,
				y: t.clientY,
				time: Date.now(),
				dx: 0,
				dy: 0
			}
		});
		
		doc.addEventListener('touchmove', throttle(function( e ){
			var t = e.touches[0];
			touch.dx = t.clientX - touch.x;
			touch.dy = t.clientY - touch.y;
		}, 100));

		doc.addEventListener('touchend', function( e ){
			var duration = Date.now() - touch.time;
			var el = e.target;
			var DISTANCE = 12;

			if( Math.abs(touch.dx) < DISTANCE && Math.abs(touch.dy) < DISTANCE ){
				duration < 240 && el.dispatchEvent(EvtMaps.tap);
				duration > 1000 && el.dispatchEvent(EvtMaps.press);
			} else {
				touch.dx > DISTANCE && el.dispatchEvent(EvtMaps.swipeRight);
				touch.dx < -DISTANCE && el.dispatchEvent(EvtMaps.swipeLeft);
				touch.dy > DISTANCE && el.dispatchEvent(EvtMaps.swipeDown);
				touch.dy < -DISTANCE && el.dispatchEvent(EvtMaps.swipeUp);
			}

			touch = {};
		});
	})();

	var M = function( selector ){ return new MASIV( selector ); }

	M.extend = M.prototype.extend = extend;


	var MASIV = function( selector, context ){
		if( !selector ) return this;
		var self = this;
		context = context || doc;
		if(typeof selector === 'function'){
			context.addEventListener(EvtAlias.ready, selector);
			return context;
		} else if(typeof selector === 'string'){
			if(selector[0] === '<'){
				var el = doc.createElement('DIV');
				el.innerHTML = selector;
				return M(el.children);
			} else {
				var elements = context.querySelectorAll(selector);
				var i = 0;
				var l = elements.length;
				for(; i < l; i++){ self[i] = elements[i]; }
				self.length = l;
			}
		} else if( selector.length ) {
			var i = 0;
			var l = selector.length;
			for(; i < l; i++){ self[i] = selector[i]; }
			self.length = l;
		} else if( selector.nodeType ) {
			self[0] = selector;
			self.length = 1;
		} else {
			extend(self, selector);
		}
		return self;
	}

	MASIV.prototype = {

		each: each,

		on: function( type, selector, fn, options ){
			type = EvtAlias[type] || type;

			if(typeof selector === 'string'){
				this.each(function( el ){
					el.addEventListener(type, function(e){
						var tar = e.target;
						while( tar !== el ){
	 						tar.matches(selector) && fn.call(tar, e);
	                        tar = tar.parentNode;
						}
					}, options);
				});
			} else {
				this.each(function( el ){ el.addEventListener(type, selector, fn); });
			}
			return this;
		},

		off: function( type, handle ){
			type = EvtAlias[type] || type;
			return this.each(function( el ){
				el.removeEventListener(type, handle);
			});
		},

		fire: function( type ){
			type = EvtAlias[type] || type;
			return this.each(function( el ){
				EvtMaps[type] = EvtMaps[type] || new CustomEvent(type, { bubbles: true, cancelable: true });
				el.dispatchEvent(EvtMaps[type]);
			});
		},

		tip: function( options ){
			var def = {
				active: 'mouseenter',
				deactive: 'mouseleave'
			}
			if( options ) def = extend(def, options);
			return this.each(function( el ){
				el.addEventListener(def.active, function(){
					tip.call(el, def);
				});
			});
		},

		dialog: function( show ){
			return this.each(function( el ){
				show === false? closeDialog(el): openDialog(el);
			});
		},

		collapse: function(){
			return this.on(EvtAlias.click, collapse);
		},

		tabs: function(){
			return this.on(EvtAlias.click, tabs);
		},

		page: function(p, pages, options){
			return this.each(function( el ){
				page.call(el, p, pages, options);
			});
		},

		toggle: function( appear ){
			return this.each(function( el ){
				toggle(el, appear);
			});
		}

	};

	M.extend(M, {

		version: '1.0',

		MASIV: MASIV.prototype,

		message: message,

		ajax: ajax,

		debounce: debounce,

		throttle: throttle,

		pos: pos,

		time: time,

		guid: guid,

		eventAlias: EvtAlias

	});


	/* 事件、控件初始化 */
	M(doc).on(EvtAlias.click, function( e ){
		// 冒泡顺序
		var tar = e.target;
		
		while( tar.nodeType !== 9 ){
			switch( true ){
				case tar.matches('.'+ PREFIX +'dropmenu'):
					tar = doc.documentElement;
				break;
				case tar.matches('[masiv-dropmenu]'):
					M('[masiv-dropmenu].'+ ACTIVE_CLASS).each(function( el ){ toggle(el, false); });
					tar.classList.contains(ACTIVE_CLASS)? toggle(tar, false): dropmenu.call( tar );
					tar = doc.documentElement;
				break;
				case tar === doc.body:
					M('[masiv-dropmenu].'+ ACTIVE_CLASS).each(function( el ){ toggle(el, false); });
				break;
				case tar.matches('[masiv-dialog]'):
					M(tar.getAttribute('masiv-dialog')).dialog();
					tar = doc.documentElement;
				break;
				default: break;
			}
			tar = tar.parentNode;
		}
		tar = null;
	}).on(EvtAlias.click, function( e ){
		// 捕获顺序
		var tar = e.target;

		switch( true ){
			case tar.matches('[masiv-dismiss]'):
				closeDialog(doc.querySelector(tar.getAttribute('masiv-dismiss') || 'MASIV'));
			break;
			default: break;
		}

		tar = null;
	}, true);

	/* SIDEBAR */
	M('[masiv-sidebar]').on(EvtAlias.click, function(){
		var sidebar = doc.querySelector(this.getAttribute('masiv-sidebar'));
		toggle(sidebar, !sidebar.classList.contains(ACTIVE_CLASS));
	});
	M('.'+ PREFIX +'sidebar').on(EvtAlias.click, function(e){
		e.target === this && toggle(this, false);
	}, true);

	/* TABS */
	M('[masiv-tabs]').tabs();

	/* COLLAPSE */
	M('[masiv-collapse]').collapse();

	/* TIP */
	M('[masiv-tip]').tip();

	/* DRAG */
	doc.querySelector('[masiv-drag]') && drag();



	/* 下拉菜单 */
	function dropmenu(){
		var self = this;
		var	css = self.classList;

		if(css.contains(ACTIVE_CLASS) || self.hasAttribute('disabled')) return false;
		var menu = self.querySelector('.'+ PREFIX +'dropmenu');
		if( !menu ) return false;
		css.add(ACTIVE_CLASS);
		var	rect = self.getBoundingClientRect();
		var	cssText = '';

		/* SELECT */
		if( css.contains(PREFIX +'select') ){
			var input = self.querySelector('.'+ PREFIX +'input');
			menu['onclick'] = function(e){
				var tar = e.target;
				while(tar !== menu){
					if( tar.matches('[data-value]') ){
						var sel = menu.querySelector('[selected]');
						sel && sel.removeAttribute('selected');
						input.value = tar.dataset.value || '';
						tar.setAttribute('selected', 'selected');
						break;
					}
					tar = tar.parentNode;
				}
				toggle(self, false);
				return false;
			}
		} else {
			var offset = (menu.offsetWidth - rect.width) / 2;
			cssText += (rect.left + menu.offsetWidth < doc.body.clientWidth)? '': (rect.right + offset < doc.body.clientWidth? ('left: -'+ offset + 'px;'): 'right: 0');
		}

		menu.style.cssText = cssText;
		css.add(IN_CLASS);
	}



	/* 拖拽 */
	function drag(){
		var dragger;
		var isDragging = false;
		M(doc).on('mousedown', '[masiv-drag]', function( e ){
			e = e.touches? e.touches[0]: e;
			isDragging = true;
			var deep = this.getAttribute('masiv-drag') - 0;
			var target = this;
			while( deep-- ) target = target.parentNode;
			var style = window.getComputedStyle(target);
			var left = style.getPropertyValue('left').slice(0, -2) - 0;
			var top = style.getPropertyValue('top').slice(0, -2) - 0;
			var position = style.getPropertyValue('position');
			position = position === 'static'? 'relative': position;
			left = isNaN( left )? 0: left;
			top = isNaN( top )? 0: top;
			target.setAttribute('masiv-dragging', true);
			dragger = {
				x: e.clientX,
				y: e.clientY,
				target: target,
				position: position,
				left: left,
				top: top
			}
		}).on('mousemove', function( e ){
			isDragging && dragging.call( dragger, e );
		}, { passive: false }).on('mouseup', function(){
			if( dragger ){
				isDragging = false;
				dragger.target.removeAttribute('masiv-dragging');
			}
			dragger = null;
		});
	}
	function dragging( e ){
		e.preventDefault();
		e = e.touches? e.touches[0]: e;
		var x = e.clientX;
		var y = e.clientY;
		x = x > window.innerWidth? window.innerWidth: x;
		x = x < 0? 0: x;
		var left = this.left + x - this.x;
		var top = this.top + y - this.y;
		
		this.target.style.cssText = 'left:'+ left +'px;top:'+ top +'px;position:'+ this.position;
		return false;
	}



	/* 打开对话框 */
	function openDialog( dialog ){
		var pa = dialog.parentNode;
		var backdrop = pa.classList.contains(PREFIX + 'backdrop');
		if( backdrop ){
			dialog.dispatchEvent(EvtMaps.beforeOpen);
			toggle(pa, true);
		} else {
			var css = dialog.classList;
			if(css.contains(ACTIVE_CLASS)) return;
			dialog.dispatchEvent(EvtMaps.beforeOpen);
			css.add(ACTIVE_CLASS);
			css.add(PREFIX + 'transless');
			dialog.style.cssText = '';
			var rect = dialog.getBoundingClientRect();
			var top = pa.scrollTop + (rect.height >= pa.clientHeight? 0: (pa.clientHeight - rect.height)/2);
			var left = pa.scrollLeft + (rect.width >= pa.clientWidth? 0: (pa.clientWidth - rect.width)/2);
			dialog.style.cssText = 'left:'+ left +'px;top:'+ top +'px;';
			dialog.offsetWidth;
			css.remove(PREFIX + 'transless');
			dialog.classList.add(IN_CLASS);
		}
		dialog.dispatchEvent(EvtMaps.open);
	}

	/* 关闭对话框 */
	function closeDialog( dialog ){
		if( !dialog ) return;
		dialog.dispatchEvent(EvtMaps.beforeClose);
		var pa = dialog.parentNode;
		var backdrop = pa.classList.contains(PREFIX + 'backdrop');
		if( backdrop ){
			toggle(pa, false);
		} else {
			toggle(dialog, false);
		}
		dialog.dispatchEvent(EvtMaps.close);
	}



	/* 弹出提示 */
	function tip( options ){
		var html = options.html || this.getAttribute('masiv-tip');
		var	pos = M.pos(this);
		var	box = doc.createElement('DIV');

		box.innerHTML = html +'<div class="'+ PREFIX +'tip-diamond"></div>';
		box.className = PREFIX + 'tip'+ (options.color? ' '+ options.color: '');
		doc.body.appendChild(box);

		var height = box.offsetHeight;
		var	width = box.offsetWidth;
		var dbc = doc.body.clientWidth;
		var	ow = this.offsetWidth;
		var	dv = (width - ow) / 2;
		var	alignL = pos.left + ow + dv + 10 > dbc;
		var	alignR = pos.left >= dv + 10;
		var	alignT = pos.top >= height + 40;
		var	top = alignT? (pos.top - height - 10): (pos.top + height + 10);
		var	left = alignR? (alignL? (dbc - width - 10): (pos.left - dv)): 10;
		var	diamond = box.lastChild;

		diamond.style.cssText = 'left:'+ (alignR? (pos.left - left + ow/2): (alignL? width/2: (pos.left + ow/2 - 10))) +'px;top:'+ (alignT? '100%;': '0;');
		box.style.cssText = 'left:'+ left +'px;top:'+ top +'px;opacity:1;';

		this.addEventListener(options.deactive, function(){
			box.style.opacity = 0;
			setTimeout(function(){ box && box.remove(); }, ANIMATE_DURATION);
		});
	}



	/* 标签页 */
	function tabs( e ){
		var tar = e.target;
		var	self = this;
		while(tar !== self){
			if(tar.matches('[masiv-tab]')){
				if(tar.classList.contains(ACTIVE_CLASS)) return false;
				var group = self.getAttribute('masiv-tabs');
				var pNav = self.querySelector('[masiv-tab].'+ ACTIVE_CLASS);
				var pTab = doc.querySelector('[masiv-taber="'+ group +'"].'+ ACTIVE_CLASS);
				var tab = doc.querySelector('[masiv-taber="'+ group +'"][masiv-tab="'+ tar.getAttribute('masiv-tab') +'"]');

				pNav && pNav.classList.remove(ACTIVE_CLASS);
				pTab && pTab.classList.remove(ACTIVE_CLASS);
				pTab.dispatchEvent(EvtMaps.close);

				tar.classList.add(ACTIVE_CLASS);
				tab && tab.classList.add(ACTIVE_CLASS);
				tab.dispatchEvent(EvtMaps.open);
				break;
			}
            tar = tar.parentNode;
		}
	}



	/* 手风琴 */
	function collapse( e ){
		var tar = e.target;
		var	self = this;
		while(tar !== self){
			if(tar.matches('.'+ PREFIX + 'question')){
				var one = self.getAttribute('masiv-collapse') === 'one';
				if( one && !tar.classList.contains(ACTIVE_CLASS) ){
					var active = self.querySelector('.'+ PREFIX +'question.'+ ACTIVE_CLASS);
					active && active.classList.remove(ACTIVE_CLASS);
				}
				tar.classList.toggle(ACTIVE_CLASS);
				break;
			}
            tar = tar.parentNode;
		}
	}



	/* 消息提醒 */
	function message( options ){
		if( !options ) return false;
		if( options.nodeType === 1 ){
			removeMessage(options);
			return false;
		}
		options = typeof options === 'string'? { html: options }: options;
		options = extend({
			timeout: 2019,
			max: 3,
			dismiss: EvtAlias.click
		}, options);

		var pa = doc.getElementsByClassName(PREFIX + 'messages')[0];
		if( !pa ){
			pa = doc.createElement('DIV');
			pa.className = PREFIX + 'messages';
			doc.body.append(pa);
		}

		var el = doc.createElement('DIV');
		el.className = PREFIX + (options.color? ('message '+ options.color): 'message');
		el.innerHTML = options.html;

		var messages = pa.children;
		var l = messages.length;
		if(options.max && options.max <= l){
			while(l >= options.max){
				--l;
				removeMessage(messages[l]);
			}
		}
		l > 0? pa.insertBefore(el, messages[0]): pa.append(el);

		el.offsetWidth;
		el.classList.add(IN_CLASS);

		if( options.dismiss ){
			options.timeout && setTimeout(function(){ removeMessage(el); }, options.timeout);
			el.addEventListener(options.dismiss, function(){ removeMessage(el); });
		}

		return el;
	}
	/* 关闭消息 */
	function removeMessage( el ){
		if( el ){
			el.classList.remove(IN_CLASS);
			setTimeout(function(){ el.remove(); }, ANIMATE_DURATION);
		}
	}



	/* 分页 */
	function page(p, pages, options){
		p -= 0;
		pages -= 0;
		var html = '';
		var	def = {
				siblings: 2,
				pageClass: PREFIX + 'page',
				active: ACTIVE_CLASS,
				dots: '┅'
			};

		if( options ){
			def = extend(def, options);
			this.$settings = def;
		} else {
			def = this.$settings || def;
		}

		var siblings = def.siblings;
		var	href = def.href;
		var	prev, next;

		if(siblings === false){
			prev = p > 1? (p - 1): 1;
			next = p === pages? pages: (p + 1);
			html += formatPage(def.pageClass +' '+ PREFIX +'page-prev', prev, (def.prev? def.prev: '上页'), href);
			html += formatPage(def.pageClass +' '+ PREFIX +'page-next', next, (def.next? def.next: '下页'), href);
			this.innerHTML = html;
			return;
		}

		html = '<a'+ (href? ' href="'+ href + p +'"': '') +' class="'+ def.pageClass +' '+ def.active +'">'+ p +'</a>';

		++siblings;
		var i = 1;
		for(; i < siblings; i++){
			prev = p - i;
			next = p + i;
			if(prev > 1){ html = formatPage(def.pageClass, prev, prev, href) + html; }
			if(next < pages){ html += formatPage(def.pageClass, next, next, href); }
		}

		if(p - siblings > 1){
			html = formatPage(def.pageClass, 1, 1, href) +'<span class="'+ PREFIX +'page-dots">'+ def.dots +'</span>'+ html;
		} else if(p != 1){
			html = formatPage(def.pageClass, 1, 1, href) + html;
		}

		if(p + siblings < pages){
			html += '<span class="'+ PREFIX +'page-dots">'+ def.dots +'</span>'+ formatPage(def.pageClass, pages, pages, href);
		} else if(p != pages){
			html += formatPage(def.pageClass, pages, pages, href);
		}

		if( def.prev ){
			prev = p > 1? (p - 1): 1;
			html = formatPage(def.pageClass +' '+ PREFIX +'page-prev', prev, (def.prev? def.prev: '上页'), href) + html;
		}
		if( def.next ){
			next = p === pages? pages: (p + 1);
			html += formatPage(def.pageClass +' '+ PREFIX +'page-next', next, (def.next? def.next: '下页'), href);
		}

		this.innerHTML = html;

		if( typeof def.click === 'function' ){
			var fn = this.$clickfn;
			if( fn ) return;
            this.$clickfn = fn = function( e ){
                var tar = e.target;
                while(tar !== this){
                    if(tar.matches('[data-page]')){
                        def.click.call(tar, tar.dataset.page - 0, tar);
                        break;
                    }
                    tar = tar.parentNode;
                }
            }
            this.addEventListener(EvtAlias.click, fn);
        }
	}

	function formatPage(pageClass, p, text, href){
		return '<a'+ (href? ' href="'+ href + p +'"': '') +' class="'+ pageClass +'" data-page="'+ p +'">'+ text + '</a>';
	}




	/* M对象扩展 */

	function each( fn ){
		var i = 0;
		var l = this.length;
		if( l ){
			for(; i < l; i++){ fn.call(this[i], this[i], i); }
		} else if( l !== 0 ) {
			var keys = Object.keys(this);
			var k;
			l = keys.length;
			for(; i < l; i++){
				k = keys[i];
				fn.call(this[k], this[k], k, i);
			}
		}
		
		return this;
	}


	/* 最后一个参数为false时，不覆写 */
	function extend(){
        var i = 1;
        var l = arguments.length;
        var tar = arguments[0];
        var	f = arguments[l - 1] === false;
        var	o, k;

        if( l < 1 ) return this;
        if( typeof arguments[l - 1] === 'boolean' ) --l;
        for(; i < l; i++){
        	o = arguments[i];
        	for(k in o){
        		if( f && k in tar ) continue;
        		tar[k] = o[k];
        	}
        }
        return tar;
    }


    /* Debounce */
    function debounce( fn, ms, immediate ){
    	var t;
    	var f = true;
    	ms || (ms = 250);

    	return function(){
			var args = arguments;
			var self = this;
    		if( immediate ){
    			if( f ){
    				fn.apply(self, args);
    				f = false;
    			} else {
    				t && clearTimeout(t);
    				t = setTimeout(function(){ f = true; }, ms);
    			}
    		} else {
    			t && clearTimeout(t);
    			t = setTimeout(function(){ fn.apply(self, args); }, ms);
    		}
    	}
    }


    /* Throttle */
    function throttle( fn, ms, cancelLast ){
    	var t;
		var f = true;
		ms || (ms = 250);

    	return function(){
			var args = arguments;
			var self = this;
    		t && clearTimeout(t);
    		if( f ){
    			fn.apply(self, args);
    			f = false;
    			setTimeout(function(){ f = true; }, ms);
    		} else if( cancelLast !== true ) {
    			t = setTimeout(function(){ fn.apply(self, args); }, ms);
    		}
    	}
	}


    /* 切换显示隐藏 */
	function toggle( el, appear ){
		var css = el.classList;
		if( el.getAttribute('masiv-toggable') ) return;
		el.setAttribute('masiv-toggable', true);
		if( appear ){
			css.add(ACTIVE_CLASS);
			el.offsetWidth;
			css.add(IN_CLASS);
			el.removeAttribute('masiv-toggable');
		} else {
			css.remove(IN_CLASS);
			setTimeout(function(){
				css && css.remove(ACTIVE_CLASS);
				el.removeAttribute('masiv-toggable');
			}, ANIMATE_DURATION);
		}
	}


	/* AJAX */
	function ajax( def ){
		if( !def || !def.url ) return;
		def = extend({
			method: 'GET',
			asyn: true,
			data: {},
			headers: {}
		}, def);

		var xhr = new XMLHttpRequest();

		xhr.open(def.method, def.url, def.asyn);

		var header;
		var headers = def.headers;
		for(header in headers){ xhr.setRequestHeader(header, headers[header]); }

		xhr.onreadystatechange = function(){
			if(xhr.readyState === 4){
				if(xhr.status === 200 && def.success){
					def.success( xhr.responseText );
				} else if( def.error ) {
					def.error( xhr );
				}
				def.complete && def.complete();
				xhr = null;
			}
		}

		xhr.send( def.data );
	}



	/* 计算节点相对文档位置 */
    function pos( el ){
    	if(typeof el === 'string'){ el = doc.querySelector(el); }
    	var top = el.offsetTop;
		var	left = el.offsetLeft;

		while(el.offsetParent){
			el = el.offsetParent;
			top += el.offsetTop;
			left += el.offsetLeft;
		}
		return { top: top, left: left };
	}
	
	/* 创建事件 */
	function createEvent( type ){
		return EvtMaps[type] = new CustomEvent(type, { bubbles: true, cancelable: true });
	}


	/* 返回格式时间字符串 */
    function time( time, pattern, zero ){
        if(time.getDate){
        	var map = {
        		Y: time.getFullYear(), M: time.getMonth() + 1, D: time.getDate(),
        		h: time.getHours(), m: time.getMinutes(), s: time.getSeconds()
        	}
            pattern = pattern || 'Y-M-D h:m:s';

            return pattern.replace(/Y|M|D|h|m|s/g, function( tag ){
            	tag = map[tag];
            	return !(zero === false) && tag < 10? '0'+ tag: tag;
            });
        }
        console.error(time, 'is not an instance of Date()');
        return false;
    }


	/* 返回 GUID 字符串 */
    function guid(){
	    var time = new Date().getTime();
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
	        var r = (time + Math.random() * 16)%16 | 0;
	        time = Math.floor( time/16 );
	        return ( c==='x'? r: (r&0x7|0x8) ).toString(16);
    	});
	};

	return M;
});
