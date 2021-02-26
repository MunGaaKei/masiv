;(function(M, doc, plugin){

    function Tree( el, settings ){
        this.$sets = M.extend({
            data: [],
            menu: false,
            draggable: false,
            checkbox: false,
            checked: '<i class="iconfont icon-checked"></i>',
            unchecked: '<i class="iconfont icon-unchecked"></i>',
            folder: '<i class="iconfont icon-folder"></i>',
            item: '<i class="iconfont icon-file"></i>',
            toggler: '<i class="iconfont icon-down"></i>'
        }, settings);

        generate(this.$sets, el);

        mount(this.$sets, el);

        el.$tree = this;
    }

    /* 生成 HTML 结构 */
    function generate( s, el ){
        el.classList.add('tree');
        el.innerHTML = rtnTplNode( s.data, s );
    }

    /* 挂载事件 */
    function mount( s, el ){
        M(el).on('click', function( e ){
            var tar = e.target;
            while( el !== tar ){
                if( tar.matches('.li') ){
                    var css = tar.classList;
                    css.toggle('opened');
                }
                if( s.checkbox && tar.matches('[node-checked]') ){
                    e.stopPropagation();
                    e.preventDefault();

                    checkNode( el, tar, tar.getAttribute('node-checked') === 'true', s );

                    return false;
                }
                tar = tar.parentNode;
            }
        });
    }

    /* 生成节点 HTML */
    function rtnTplNode( tree, s ) {
        var i = 0;
        var l = tree.length;
        var html = '';
        var node;
        for(; i < l; i++){
            node = tree[i];
            html += '<li>\
                        <a class="li'+ (node.open? ' opened"': '"')
                        + (node.href? rtnTplHref( node, s ): '')
                        + (node.attr? rtnTplAttr( node.attr ): '')
                        + (node.children? ' node-folder>': '>')
                            + rtnTplCheckbox( s, node.checked )
                            + rtnTplIcon( node, s )
                            +'<span node-name>'+ (node.name || 'Untitled') +'</span>'
                            + (s.toggler && node.children? '<span node-toggler>'+ s.toggler +'</span>': '')
                        +'</a>';
            if( node.children ){
                html += '<ul>'+ rtnTplNode( node.children, s ) +'</ul>';
            }
            html += '</li>';
        }
        return html;
    }

    function rtnTplHref( node, s ){
        var target = node.target || s.target;
        return ' href="'+ node.href +'"'+ (target? ' target="'+ target +'"': '');
    }

    function rtnTplAttr( attr ){
        var html = '';
        var k;
        for(k in attr){
            html += ' data-'+ k +'='+ attr[k];
        }
        return html;
    }

    function rtnTplIcon( node, s ){
        if( node.icon === false ) return '';
        return node.icon || (node.children? s.folder: s.item) || '';
    }

    function rtnTplCheckbox( s, checked ){
        if( !s.checkbox ) return '';
        return '<span node-checked="'+ (checked? 'true">': 'false">') + (checked? s.checked: s.unchecked) +'</span>';
    }

    function checkNode( tree, checkbox, checked, s ){
        checkbox.innerHTML = checked? s.unchecked: s.checked;
        checkbox.setAttribute('node-checked', !checked);
        var node = checkbox.parentNode;
        var li = node.parentNode;
        var ul = li.parentNode;
        if( checked ){
            // 取消选取
            li.querySelectorAll('[node-checked="true"]').forEach(function( el ){
                el.innerHTML = s.unchecked;
                el.setAttribute('node-checked', false);
            });
            while( ul !== tree ){
                node = ul.previousElementSibling; 
                checkbox = node.querySelector('[node-checked="true"]');
                if( checkbox ){
                    checkbox.innerHTML = s.unchecked;
                    checkbox.setAttribute('node-checked', false);
                }
                ul = ul.parentNode.parentNode;
            }
        } else {
            // 选取打勾
            li.querySelectorAll('[node-checked]').forEach(function( el ){
                el.innerHTML = s.checked;
                el.setAttribute('node-checked', true);
            });
            while( ul !== tree ){
                if( ul.querySelector('[node-checked="false"]') ) break;
                node = ul.previousElementSibling;
                checkbox = node.querySelector('[node-checked]');
                if( checkbox ){
                    checkbox.innerHTML = s.checked;
                    checkbox.setAttribute('node-checked', true);
                }
                ul = ul.parentNode.parentNode;
            }
        }
        node = li = ul = checkbox = null;
    }

    /* 挂载 */
	M.MASIV[plugin] = function( a, b ){
        return this.each(function( el ){
            var $tree = el.$tree;
            $tree?
            (typeof $tree[a] === 'function' && $tree[a](b) ) :
            new Tree( el, a );
        });
	}

})(M, document, 'tree');
