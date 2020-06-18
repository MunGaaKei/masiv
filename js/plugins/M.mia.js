;((doc) => {
    'use strict';

    let _TARGET = null;
    
    function getEl ( selector ) {
        return typeof selector === 'string'? doc.querySelector(selector): selector;
    }

    function isObject ( o ) {
        return o && o.constructor === Object;
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
            }
        });
    }

    function compute ( expr, context ) {
        return new Function('context', `
        
            with( context ) {
                return ${expr};
            }
        `)( context );
    }

    function directiveFor (  ) {

    }

    function method ( type, fn ) {

    }


    class Map {
        constructor ( $el, data ) {
            this.$el = $el;
            this.map = this.build( this.$el );
            this.REG = /#(.*?)#/gm;

            this.$el.innerHTML = '';
            this.$el.append( this.compile( this.map, data ) );

            // console.log(this.map);
            
        }

        build ( $el ) {
            let map = [];
            let children = [...$el.childNodes];
            for ( let node of children ){
                map.push( this.parse(node) );
            }
            return map;
        }

        parse ( node ) {
            let o = {};
            o.type = node.nodeType;
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
                            o.children.push( this.parse( el ) );
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
                        console.log(attrs);
                        
                        if( attrs[':for'] ) {
                            $el = doc.createDocumentFragment();
                        }

                        $el = doc.createElement( node.tag );

                        for ( let attr in attrs ) {
                            $el.setAttribute(attr, attrs[attr]);
                        }

                        children && $el.append( this.compile(children, context) );

                        frag.append( $el );
                    break;
                    case 3:
                        $el = doc.createTextNode('');
                        let text = node.text.replace(this.REG, match => {
                            let expr = match.slice(1, -1).trim();
                            if( expr !== '' ) {
                                _TARGET = { node, $el, dir: 'text' };
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
                default: break;
            }
        }

        textUpdater ( $el, data ) {
            $el.textContent = this.node.text.replace(
                this.REG,
                match => {
                    return compute(match.slice(1, -1).trim(), data);
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