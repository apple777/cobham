ax.api.exe({
    cmd: 'get mdl',
    onSuccess: function ( o ) {
        $( '.product-mdl' ).text( o.ajaxdata );
    }
});

ax.api.exe({
    cmd: 'get swv',
    onSuccess: function ( o ) {
        $( '.product-swv' ).text( o.ajaxdata );
    }
});