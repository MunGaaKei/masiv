;(function(doc){

    M.extend(M, {
        monitor: function( target, data ){
            target = typeof target === 'string'? doc.querySelector(target): target;
	    	data = data || {};
            return target.$monitor || new Monitor(target, data);
        }
    });

    /* 新建实例 */
    function Monitor( el, data ){
        this.$data = data;
        this.$el = el;

        var TREE = generate( el );

        var frag = compile( TREE, this.$data );
        console.log(frag);

        return el.$monitor = this;
    }

    /* 数据劫持 */
    function Observe( data ){

    }

    /* 编译该树 */
    function compile( tree, data ){
        var i = 0;
        var l = tree.length;
        var frag = doc.createDocumentFragment();
        for(; i < l; i++ ){ frag.append( format(tree[i], data) ); }
        return frag;
    }

    /* 生成虚拟节点 & 依赖关系 */
    function format( node, data ){
        var exprREG = /#(.*?)#/gm;
        // var keyREG = /^(['"\[])(((\\['"\]])?([^\1])*)+)\1/gm;

        var el;
        if(node.type === 1){
            el = doc.createElement(node.tag);
            if( node.children ){
                el.append( compile(node.children, data) );
            }
        } else if(node.type === 3) {
            var text = node.text.replace(exprREG, function( match ){
                var expr = match.slice(1, -1).trim();


                return expr;
            });
            el = doc.createTextNode(text);
        }
        return el;
    }

    /* 获取表达式返回值 */
    function compute( expr, data ){
        var fn = new Function('$o',
            data ?
            'with( $o ){ return ('+ expr +'); }' :
            'return ('+ expr +');'
        );
        return fn( data );
    }

    /* 生成源模拟树 */
    function generate( parent ){
        var tree = [];
        var children = parent.childNodes;
        var l = children.length;
        while( l-- ){ tree.unshift( parse(children[l]) ); }
        return tree;
    }

    /* 解析节点 */
    function parse( el ){
        var node = {};
        node.type = el.nodeType;
        if(node.type === 1){
            node.tag = el.tagName;
            var attrs = el.attributes;
            var l = attrs.length;

            if( l > 0 ){
                var attr, name;
                node.attrs = {};
                while( l-- ){
                    attr = attrs[l];
                    name = attr.nodeName;
                    if(name.indexOf(':') === 0 || name.indexOf('@') === 0){
                        node[name] = attr.nodeValue;
                    } else {
                        node.attrs[name] = attr.nodeValue;
                    }
                }
            }

            var children = el.childNodes;
            l = children.length;
            if( l > 0 ){
                node.children = [];
                while( l-- ){ node.children.unshift( parse(children[l]) ); }
            }

        } else if(node.type === 3) {
            node.text = el.nodeValue;
        }
        return node;
    }

})(document);
