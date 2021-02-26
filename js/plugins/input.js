;(function(M, doc, plugin){

	var $calendar;
	var $widgets = {};
	var PREFIX = doc.body.getAttribute('masiv-namespace') || '';


	function input( type, configs ){
		if( !type ) return false;
		switch (type) {
			case 'file':
				this.addEventListener('change', function(e){
					var files = this.files;
					var l = files.length;
					var names = [];
					while( l-- ){ names.unshift( files[l].name ); }
					this.dataset.file = names.join(' | ');
				});
			break;
			case 'calendar':
				this.addEventListener('click', function(e){
					e.stopPropagation();
					$calendar = $calendar || createCalendar();
					if($calendar.classList.contains('active') && $calendar.$input === this) return;

					var value = new Date(this.value.trim());
					$calendar.$input = this;

					value.getDate()? setCalendarDate(value, value): setCalendarDate(new Date());

					posCalendar( this );
					M($calendar).toggle(true);
				});
			break;
			case 'editor':
				createEditor.call( this );
				listenEditor.call( this );
			break;
			default: break;
		}
	}

	function createEditor(){
		this.classList.add('editor-container');
		var template = '<div class="editor-toolbar">\
							<a class="editor-item iconfont icon-undo" data-act="undo"></a>\
							<a class="editor-item iconfont icon-redo" data-act="redo"></a>\
							\
							<div masiv-dropdown><a class="editor-item iconfont icon-heading"></a><div class="dropmenu"><a class="li" data-act="heading" data-heading="h1"><b>H1</b></a><a class="li" data-act="heading" data-heading="h2"><b>H2</b></a><a class="li" data-act="heading" data-heading="h3"><b>H3</b></a><a class="li" data-act="heading" data-heading="h4"><b>H4</b></a><a class="li" data-act="heading" data-heading="h5"><b>H5</b></a><a class="li" data-act="heading" data-heading="h6"><b>H6</b></a></div></div>\
							\
							<div masiv-dropdown><a class="editor-item iconfont icon-fontsize"></a><div class="dropmenu"><div class="group"><div class="select" masiv-dropmenu><input type="text" class="input" value="14"><span class="caret"></span><ul class="dropmenu"><li class="li" data-value="14">14</li><li class="li" data-value="16">16</li><li class="li" data-value="24">24</li></ul></div><i class="btn black-o" data-act="size">px</i></div></div></div>\
							\
							<div masiv-dropdown><a class="editor-item iconfont icon-fontcolor"></a><div class="dropmenu"><div class="group"><i class="iconfont icon-hashtag"></i><input type="text" class="input" maxlength="8"><a class="btn black-o" data-act="color-font"><i class="iconfont icon-fontcolor"></i></a></div><div class="editor-colors"><a data-act="color" data-color="2a2a2a" style="background: #2a2a2a;"></a><a data-act="color" data-color="258de6" style="background: #258de6;"></a><a data-act="color" data-color="fcea4d" style="background: #fcea4d;"></a><a data-act="color" data-color="19a054" style="background: #19a054;"></a><a data-act="color" data-color="dd0a35" style="background: #dd0a35;"></a><a data-act="color" data-color="fff" style="background: #fff;"></a><a data-act="color" data-color="808080" style="background: #808080;"></a></div></div></div>\
							\
							<div masiv-dropdown><a class="editor-item iconfont icon-brush"></a><div class="dropmenu"><div class="group"><i class="iconfont icon-hashtag"></i><input type="text" class="input" maxlength="8"><a class="btn black-o" data-act="color-background"><i class="iconfont icon-brush"></i></a></div><div class="editor-colors"><a data-act="background" data-color="2a2a2a" style="background: #2a2a2a;"></a><a data-act="background" data-color="a5d5ff" style="background: #a5d5ff;"></a><a data-act="background" data-color="fcea4d" style="background: #fcea4d;"></a><a data-act="background" data-color="9cffc8" style="background: #9cffc8;"></a><a data-act="background" data-color="ffa9a9" style="background: #ffa9a9;"></a><a data-act="background" data-color="fff" style="background: #fff;"></a><a data-act="background" data-color="d2d2d2" style="background: #d2d2d2;"></a></div></div></div>\
							\
							<a class="editor-item iconfont icon-fontweight" data-act="bold"></a>\
							<a class="editor-item iconfont icon-fontstyle" data-act="italic"></a>\
							<a class="editor-item iconfont icon-underline" data-act="underline"></a>\
							<a class="editor-item iconfont icon-strike" data-act="strike"></a>\
							<a class="editor-item iconfont icon-list-disc" data-act="disorder"></a>\
							<a class="editor-item iconfont icon-list-deci" data-act="order"></a>\
							<a class="editor-item iconfont icon-eraser" data-act="eraser"></a>\
							<a class="editor-item iconfont icon-align-left" data-act="align-left"></a>\
							<a class="editor-item iconfont icon-align-center" data-act="align-center"></a>\
							<a class="editor-item iconfont icon-align-right" data-act="align-right"></a>\
							<a class="editor-item iconfont icon-align-justify" data-act="align-justify"></a>\
							<a class="editor-item iconfont icon-link" data-act="link" masiv-dialog="#editor-link"></a>\
							<a class="editor-item iconfont icon-image" data-act="image" masiv-dialog="#editor-image"></a>\
							<a class="editor-item iconfont icon-table" data-act="table" masiv-dialog="#editor-table"></a>\
							<a class="editor-item iconfont icon-fullscreen right" data-act="fullscreen"></a>\
						</div>\
						<div class="editor" contenteditable></div>';
		
		var commonPopup = doc.getElementById('editor-popups');
		if( !commonPopup ){
			var div = doc.createElement('DIV');
			div.setAttribute('id', 'editor-popups');
			div.innerHTML = '\
							<div class="backdrop" masiv-dismiss="#editor-link"><div id="editor-link" class="dialog"><form name="editor-link" class="content"><div class="field"><label class="label-inline"><span class="label">文本:</span><input type="text" class="input" name="text"></label></div><div class="field"><label class="label-inline"><span class="label">链接:</span><input type="text" class="input" name="link"></label></div><div class="field"><label class="label-checkbox"><input type="checkbox" class="checkbox" checked name="target">新窗口打开</label></div></form><footer><a class="btn black-o right" data-act="insert-link" masiv-dismiss="#editor-link" data-name="link">插入链接</a></footer></div></div>\
							<div class="backdrop" masiv-dismiss="#editor-image"><div id="editor-image" class="dialog"><form name="editor-image" class="content"><div class="field"><label class="label-inline"><span class="label">图片链接:</span><input type="text" class="input" name="link"></label></div></form><footer><a class="btn black-o right" data-act="insert-image" masiv-dismiss="#editor-image" data-name="image">插入图片</a></footer></div></div>\
							<div class="backdrop" masiv-dismiss="#editor-table"><div id="editor-table" class="dialog"><form name="editor-table" class="content"><div class="field"><label class="label-inline"><span class="label">列:</span><input type="text" class="input" name="col" value="4"></label></div><div class="field"><label class="label-inline"><span class="label">行:</span><input type="text" class="input" name="row" value="3"></label></div></form><footer><a class="btn black-o right" data-act="insert-table" masiv-dismiss="#editor-table" data-name="table">插入表格</a></footer></div></div>\
							';
			listenEditor.call( div );
			doc.body.append( div );
		}
						
		this.innerHTML = template;
	}

	function listenEditor(){
		this.addEventListener(M.eventAlias.click, function( e ){
			var tar = e.target;
			while( this !== tar ){
				if( tar.matches('[data-act]') ){
					directive( tar, this );
				}
				tar = tar.parentNode;
			}
		});
	}

	function directive( tar, editor ){
		var act = tar.dataset.act;
		var popups = doc.getElementById('editor-popups');
		switch( act ){
			case 'undo': doc.execCommand('undo'); break;
			case 'redo': doc.execCommand('redo'); break;
			case 'heading': doc.execCommand('formatBlock', false, tar.dataset.heading); break;
			case 'size':
				var input = tar.previousElementSibling.querySelector('input');
				doc.execCommand('insertHTML', doc.getSelection(), '<font style="font-size:'+ input.value +'px;">'+ doc.getSelection() +'</font>');
			break;
			case 'color': doc.execCommand('foreColor', false, tar.dataset.color); break;
			case 'color-font':
				var input = tar.previousElementSibling;
				var color = input.value || '';
				var isColor = /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test( color );
				if( isColor ){
					doc.execCommand('foreColor', false, color);
					input.previousElementSibling.style.color = '#'+ color;
				}
			break;
			case 'background': doc.execCommand('backColor', false, tar.dataset.color);  break;
			case 'color-background':
				var input = tar.previousElementSibling;
				var color = input.value || '';
				var isColor = /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test( color );
				if( isColor ){
					doc.execCommand('backColor', false, color);
					input.previousElementSibling.style.background = '#'+ color;
				}
			break;
			case 'bold': doc.execCommand('bold'); break;
			case 'italic': doc.execCommand('italic'); break;
			case 'underline': doc.execCommand('underline'); break;
			case 'strike': doc.execCommand('strikeThrough'); break;
			case 'eraser': doc.execCommand('removeFormat'); break;
			case 'disorder': doc.execCommand('insertUnorderedList'); break;
			case 'order': doc.execCommand('insertOrderedList'); break;
			case 'align-left': doc.execCommand('justifyLeft'); break;
			case 'align-center': doc.execCommand('justifyCenter'); break;
			case 'align-right': doc.execCommand('justifyRight'); break;
			case 'align-justify': doc.execCommand('justifyFull'); break;
			case 'fullscreen': editor.classList.toggle('full'); break;
			case 'link':
			case 'image':
			case 'table':
				var sel = doc.getSelection();
				popups.cacheRange = {
					startnode: sel.anchorNode,
					startoffset: sel.anchorOffset,
					endnode: sel.focusNode,
					endoffset: sel.focusOffset
				};
				if( act === 'link' ) doc.forms['editor-link']['text'].value = sel.toString();
			break;
			case 'insert-link':
			case 'insert-image':
			case 'insert-table':
				var name = tar.dataset.name;
				var form = doc.forms['editor-'+ name];
				var cr = popups.cacheRange;
				var map = {
					'link': form['link'] && form['text'],
					'image': form['link'],
					'table': form['col'] && form['row']
				}
				if( map[name] ){
					var sel = doc.getSelection();
					sel.removeAllRanges();
					var range = doc.createRange();
					range.setStart( cr.startnode || editor, cr.startoffset || 0 );
					range.setEnd( cr.endnode || editor, cr.endoffset || 0 );
					sel.addRange( range );
					switch( name ){
						case 'link': doc.execCommand('insertHTML', sel, '<a href="'+ form['link'].value +'"'+ (form['target'].checked? ' target="_blank">': '>')+ form['text'].value +'</a>'); break;
						case 'image': doc.execCommand('insertHTML', sel, '<img src="'+ form['link'].value +'">'); break;
						case 'table':
							var table = '<div class="table-container"><table class="table">';
							var tr = '<tr>'+ '<td></td>'.repeat( form['col'].value ) +'</tr>';
							table += tr.repeat( form['row'].value ) +'</table></div>';
							doc.execCommand('insertHTML', sel, table);
						break;
						default: break;
					}
					sel.removeAllRanges();
				}
			break;
			default: break;
		}
	}

	function createCalendar(){
		var calendar = doc.createElement('DIV');
		calendar.className = 'calendar';
		calendar.innerHTML = '<ul class="cols">\
							  	<li>日</li><li>一</li><li>二</li><li>三</li><li>四</li><li>五</li><li>六</li>\
							  </ul>\
							  <ul class="calendar-days"></ul>\
							  <div class="calendar-selector"></div>\
							  <ul class="calendar-years"></ul>\
							  <ul class="calendar-months"></ul>';

		doc.body.append(calendar);
		$widgets = {
			selector: calendar.querySelector('.calendar-selector'),
			years: calendar.querySelector('.calendar-years'),
			months: calendar.querySelector('.calendar-months'),
			days: calendar.querySelector('.calendar-days')
		}

		var cacheYear;
		var cacheMonth;

		calendar.addEventListener('click', function(e){
			e.stopPropagation();
			var target = e.target;
			var ds = target.dataset;
			var input = calendar.$input;
			switch ( false ){
				case !ds.date:
					var m = target.dataset.month;
					m = $widgets.month + (m === 'prev'? -2: (m === 'next'? 0: -1));
					input.value = M.time(new Date($widgets.year, m, ds.date), 'Y-M-D');
					M(this).toggle(false);
				break;
				case !ds.years:
					cacheYear = $widgets.year;
					setYears(cacheYear, cacheYear);
					$widgets.years.classList.add('active');
				break;
				case !ds.months:
					$widgets.months.classList.add('active');
				break;
				case !ds.year:
					if(target.classList.contains('active')){
						$widgets.years.classList.remove('active');
					} else {
						var time = new Date(ds.year, $widgets.month - 1, 1);
						setCalendarDate(time, $widgets.time);
					}
				break;
				case !ds.month:
					if(target.classList.contains('active')){
						$widgets.months.classList.remove('active');
					} else {
						var time = new Date($widgets.year, ds.month - 1, 1);
						setCalendarDate(time, $widgets.time);
					}
				break;
				case !ds.pny:
					cacheYear += (ds.pny === 'prev')? -10: 10;
					setYears(cacheYear, $widgets.year);
				break;
				case !ds.pnm:
					cacheMonth = (cacheMonth % 12 || $widgets.month) + (ds.pnm === 'prev'? -1: 1);
					var time = new Date($widgets.year, cacheMonth - 1, 1);
					setCalendarDate(time, $widgets.time);
					cacheMonth = null;
				break;
				default: break;
			}
		});

		return calendar;
	}

	function setCalendarDate( date, now ){
		$widgets.years.classList.remove('active');
		$widgets.months.classList.remove('active');

		var y = date.getFullYear();
		var m = date.getMonth() + 1;

		setSelector(y, m);
		setDates(date, now);
		setMonths(m);
		setYears(y, now && now.getFullYear());

		$widgets.year = y;
		$widgets.month = m;
		$widgets.time = now;
	}

	function setSelector( year, month ){
		$widgets.selector.innerHTML = '<a data-pnm="prev" class="iconfont icon-left"></a>\
									   <a data-years="'+ year +'">'+ year + '年</a>\
									   <a data-months="'+ month +'">'+ month +'月</a>\
									   <a data-pnm="next" class="iconfont icon-right"></a>';
	}

	function setYears( year, now ){
		var html = '<li data-year="'+ year + (now && year === now? '" class="active">': '">') + year +'</li>';
		var cursor = year;
		while(cursor % 10 !== 0){
			--cursor;
			html = '<li data-year="'+ cursor +'">'+ cursor +'</li>'+ html;
		}
		while(year % 10 !== 9){
			++year;
			html += '<li data-year="'+ year +'">'+ year +'</li>';
		}
		$widgets.years.innerHTML = html +'<li data-pny="prev" class="iconfont icon-left"></li><li data-pny="next" class="iconfont icon-right"></li>';
	}

	function setMonths( month ){
		var i = 1;
		var html = '';
		for(; i < 13; i++){ html += '<li data-month="'+ i +'"' + (i === month? ' class="active">': '>') + i +'</li>'; }
		$widgets.months.innerHTML = html;
	}

	function setDates( date, now ){
		var html = '';
		var y = date.getFullYear();
		var m = date.getMonth();
		var dateFirst = new Date(y, m, 1);
		var dateLast = new Date(y, m+1, 0);
		var hasToday = now && now.getMonth() === m && now.getFullYear() === y? now.getDate(): false;
		var days = dateLast.getDate();

		while( days ){
			html = '<li data-date="'+ days +'"'+ (hasToday === days? ' class="active">': '>') + days +'</li>'+ html;
			--days;
		}

		var dateFirstDay = dateFirst.getDay();
		if( dateFirstDay > 0 ){
			var prevMonth = new Date(y, m, 0);
			var date = prevMonth.getDate();
			m = prevMonth.getMonth();
			var has = !hasToday && now && now.getMonth() === m && now.getFullYear() === y? now.getDate(): false;
			while( dateFirstDay-- ){
				html = '<li data-date="'+ date +'" data-month="prev" class="diffmon'+ (has === date? ' active">': '">') + date +'</li>'+ html;
				--date;
			}
		}

		var dateLastDay = dateLast.getDay();
		if( dateLastDay !== 6 ){
			var nextMonth = new Date(y, m+1, 1);
			var date = 1;
			m = nextMonth.getMonth();
			var has = !hasToday && now && now.getMonth() === m && now.getFullYear() === y? now.getDate(): false;
			while( dateLastDay !== 6 ){
				html += '<li data-date="'+ date +'" data-month="next" class="diffmon'+ (has === date? ' active">': '">') + date +'</li>';
				++dateLastDay;
				++date;
			}
		}
		$widgets.days.innerHTML = html;
	}

	function posCalendar( input ){
		var h = $calendar.offsetHeight;
		var w = $calendar.offsetWidth;
		var pos = M.pos(input);
		var rect = input.getBoundingClientRect();
		var left = (rect.left + w > $calendar.parentNode.clientWidth)? (pos.left + rect.width - w): pos.left;
		var top = (rect.bottom + h > $calendar.parentNode.clientHeight)? (pos.top - h): (pos.top + rect.height);
		$calendar.style.cssText = 'left:'+ left +'px;top:'+ top +'px;';
	}



	M.MASIV[plugin] = function( type, configs ){
		configs = configs || {};
		return this.each(function( el ){
			input.call( el, type || el.getAttribute('masiv-input'), configs);
		});
	}

	M('[masiv-input]').input();
	doc.addEventListener('click', function(){ $calendar && M($calendar).toggle(false); });
	window.addEventListener('resize', M.throttle(function(){ $calendar && $calendar.classList.contains('on') && posCalendar( $calendar.$input ); }));

})(M, document, 'input');
