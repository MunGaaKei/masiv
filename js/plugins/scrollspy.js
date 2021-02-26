;(function(M, doc, plugin){

    function monitor( el, s ){
        s = M.extend({
            active: 'active',
            navs: 'a',
            offset: '0px',
            viewport: undefined
        }, s);

        var navs = el.querySelectorAll( s.navs );
        var io = createObserver( s, navs );

        observe( io, navs );
    }

    function createObserver( s, navs ){
        var vp = [];
        var options = {
            root: s.viewport,
            rootMargin: s.offset
        };

        return new IntersectionObserver(function( v ){
            var l = v.length;
            var i = 0;
            var tar;
            for(; i < l; i++){
                bcr = v[i].boundingClientRect;
                tar = v[i].target;
                vp[ tar.$scrollspy ] = v[i].isIntersecting? true: false;
            }

            update( vp, navs, s );
        }, options);
    }

    function observe( io, navs ){
        var i = 0;
        var l = navs.length;
        for(; i < l; i++){
            var hash = navs[i].getAttribute('href').split('#')[1];
            var target = doc.getElementById( hash );
            target.$scrollspy = i;
            io.observe( target );
        }
    }

    function update( vp, navs, s ){
        var i = 0;
        var l = vp.length;
        var out = true;
        var css;
        for(; i < l; i++){
            css = navs[i].classList;
            if( out && vp[i] ){
                out = false;
                if( !css.contains( s.active ) ){
                    css.add( s.active );
                    typeof s.enter === 'function' && s.enter.call( navs[i] );
                }
            } else {
                css.remove( s.active );
            }
        }
        css = null;
    }

    /* 挂载 */
	M.MASIV[plugin] = function( settings ){
        return this.each(function( el ){
            monitor( el, settings );
        });
    }

})(M, document, 'scrollspy');