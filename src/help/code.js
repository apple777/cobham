requirejs.config({
    waitSeconds: 30,
    shim: {
        '/js/lib/underscore.js': {
            exports: '_'
        },
        '/js/lib/jquery.js': {
            exports: '$'
        },
        '/js/lib/jquery-ui.js': {
            deps: [ '/js/lib/underscore.js', '/js/lib/jquery.js' ],
            exports: '$'
        },
        '/js/lib/handlebars.js': {
            exports: 'Handlebars'
        }
    }
});

require( [ '/js/lib/jquery.js', '/js/lib/showdown.js', '/js/lib/jquery-url.js', '/js/icons.js'], function ( $, Showdown ) {

    var BACKUP_KEY = 'markdown-editor-backup';

    var $markdownText = $( '#markdown-text' );
    var $markdownOutputContents = $( '#markdown-output-contents' );
    var $message = $( '#message' );

    var converter = new Showdown.converter();

    $markdownText.bind( 'keyup change', function () {
        console.log( 'yeah' );
        var txt = $markdownText.val();
        //save a copy in the localStorage
        localStorage[ BACKUP_KEY ] = txt;
        $markdownOutputContents.html( converter.makeHtml( txt ) );
    });

    $( '#html-view' ).dblclick( function () {
        $( 'body' ).toggleClass( 'show-editor' );
    });

    /** loads a page and compiles its markdown and does the final touch and shows it*/
    function loadPage ( path ) {
        $message.text( 'Loading ' + pagePath + '...' );
        //try to get the file
        $.get( path, function ( data ) {
            $markdownText.val( data).trigger( 'change' );
            //convert all links which end with .txt to open with this page
            var thisFilePath = $.url( 'path' );
            $( 'a[href$=".txt"]', $markdownOutputContents ).each( function () {
                var href = $( this ).attr( 'href' );
                var newHref = thisFilePath + '?page=' + encodeURIComponent( $.url( 'path', href ) );
                $( this ).attr( 'href', newHref );
            });
            //put the header in the title
            var pageTitle = $( ':header').first().text();
            if ( pageTitle ) {
                $( 'title' ).text( pageTitle );
            }
            $message.hide();
            $( '.help-loaded' ).show();
        });
    }
    var pagePath = $.url( '?page' );
    if ( pagePath ) {
        pagePath = decodeURIComponent( pagePath );
        loadPage( pagePath );
    } else {
        //if there's anything in the localStorage already, shot it
        $markdownText.val( localStorage[ BACKUP_KEY ] || '' );
    }
});