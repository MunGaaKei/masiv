;((doc) => {
    'use strict';

    let _TARGET = null;
    
    function getEl ( selector ) {
        return typeof selector === 'string'? doc.querySelector(selector): selector;
    }

    function isObject ( o ) {
        return o?.constructor === Object;
    }

    function proxyData ( data, instance ) {
        if( !isObject(data) ) return;

        let keys = Object.keys( data );
        let monitor = new Monitor();
        
        for ( let k of keys ) {
            if( isObject(data[k]) ) data[k] = proxyData( data[k], instance );
        }

        return new Proxy(data, {
            get: (o, key) => {
                if ( typeof key !== 'symbol' && _TARGET ) {
                    let { node, $el, dir } = _TARGET;
                    monitor.add(
                        new Updater( key, node, dir, $el, instance.data )
                    );
                }
                return Reflect.get(o, key);
            },
            set: (o, key, val) => {
                if( val === o[key] ) return;
                
                Reflect.set(o, key, val);
                
                monitor.execute( key );

                if( isObject(val) ) o[key] = proxyData( val, instance );

                return true;
            }
        });
    }

    function compute ( expr, context ) {
        return new Function('context', `
            let rtn = undefined;
            let l = context.length;

            while ( l-- ) {
                try {
                    with ( context[l] ) {
                        rtn = ${expr};
                    }
                } catch ( error ) {
                    rtn = undefined;
                }

                if ( rtn ) return rtn;
            }
            return rtn;
        `)( context );
    }

    function directiveFor ( expr, context ) {
        // (item, key, index) in object
        // (a, b, c) in object
        // a in object
        expr = expr.split(' in ');
        
        let params = expr[0];
        let space = compute(expr[1], context);
        let handler = [];
        let i = 0;

        if ( params.startsWith('(') ) params = params.slice(1, -1);
        params = params.split(',');
        
        for ( let p of params ) {
            params[i] = p.trim();
            i++;
        }
        
        i = 0;

        for ( let key in space ) {
            handler[i] = {};
            handler[ i ][ params[0] ] = space[key];
            if ( params.length > 1 ) handler[ i ][ params[1] ] = key;
            if ( params.length > 2 ) handler[ i ][ params[2] ] = i;
            i++;
        }
        
        return handler;
    }

    function method ( type, fn ) {

    }


    class Map {
        constructor ( $el, data ) {
            this.$el = $el;
            this.map = this.build( this.$el );
            this.REG = /#(.*?)#/gm;

            this.$el.innerHTML = '';
            this.$el.append( this.compile( this.map, [data] ) );

            console.log(this.map);
            
        }

        build ( $el ) {
            let map = [];
            let children = [...$el.childNodes];
            for ( let node of children ){
                map.push( this.parse(node) );
            }
            return map;
        }

        parse ( node, parent ) {
            let o = {};
            o.type = node.nodeType;
            o.parent = parent;
            switch (o.type) {
                case 1:
                    o.tag = node.tagName;
    
                    let attrs = [...node.attributes];
                    o.attrs = [];
                    for ( let attr of attrs ) {
                        o.attrs[attr.nodeName] = attr.nodeValue;
                    }
                    
                    let children = [...node.childNodes];
                    if( children.length > 0 ) {
                        o.children = [];
                        for ( let el of children ) {
                            o.children.push( this.parse( el, o ) );
                        }
                    }
    
                break;
                case 3:
                    o.text = node.nodeValue;
                break;
                default: break;
            }
            return o;
        }

        compile ( map, context ) {
            let frag = doc.createDocumentFragment();
            let node = null;
            let $el = null;

            for ( node of map ) {
                switch (node.type) {
                    case 1:
                        // this.render
                        // return el | fragment(:for)
                        let { attrs, children } = node;
                        
                        if ( attrs[':for'] ) {
                            $el = doc.createDocumentFragment();

                            _TARGET = { node, $el, dir: 'for' };
                            let scopes = directiveFor( attrs[':for'], context );
                            _TARGET = null;

                            delete node.attrs[':for'];
                            
                            for ( let scope of scopes ) {
                                let domain = context.slice();
                                domain.push( scope );
                                $el.append( this.compile([node], domain) );
                            }

                        } else {
                            $el = doc.createElement( node.tag );

                            if ( attrs[':if'] ) {
                                let show = compute(attrs[':if'], context);
                                
                            }

                            for ( let attr in attrs ) {
                                $el.setAttribute(attr, attrs[attr]);
                            }
    
                            children && $el.append( this.compile(children, context) );
                        }
                        

                        frag.append( $el );
                    break;
                    case 3:
                        $el = doc.createTextNode('');
                        let text = node.text.replace(this.REG, match => {
                            let expr = match.slice(1, -1).trim();
                            if( expr !== '' ) {
                                _TARGET = { node, $el, dir: 'text', context: context };
                                console.log(node, $el);
                                
                                let val = compute(expr, context);
                                _TARGET = null;
                                return val;
                            }
                            return expr;
                        });
                        
                        $el.textContent = text;
                        frag.append( $el );
                    break;
                    default: break;
                }
            }

            return frag;
        }
    }


    class Updater {
        constructor ( key, node, dir, $el, data ) {
            this.key = key;
            this.node = node;
            this.dir = dir;
            this.$el = $el;
            this.data = data;
            this.REG = /#(.*?)#/gm;
        }

        update () {
            switch ( this.dir ) {
                case 'text':
                    this.textUpdater( this.$el, this.data );
                break;
                case 'attr':
                    this.attrUpdater( this.$el, this.data );
                break;
                case 'bind':

                break;
                case 'for':
                    console.log(this.$el);
                    
                break;
                default: break;
            }
        }

        textUpdater ( $el, data ) {
            $el.textContent = this.node.text.replace(
                this.REG,
                match => {
                    return compute(match.slice(1, -1).trim(), [data]);
                }
            );
        }

        attrUpdater ( $el, attr, val, data ) {
            
        }

    }

    class Monitor {
        constructor () {
            this.queue = [];
        }
        add ( updater ) {
            this.queue.push( updater );
        }
        execute ( key ) {
            for( let updater of this.queue ) {
                updater.key === key && updater.update();
            }
        }
    }

    class Mia {
        constructor ( options ) {
            let $el = getEl( options.el );
            if( !$el ) return;

            this.$el = $el;
            this.$rawEl = $el.childNodes;

            this.data = proxyData( options.data, this );

            new Map( $el, this.data );

        }

        destroy () {

        }
    }

    if( M && M.version ) {
        Object.assign(M, {
            mia: options => new Mia( options )
        });
    } else {
        window.Mia = options => new Mia(options);
    }


})(document);