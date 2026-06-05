/**
 * JQuery plugin for loading the contents of an element from the result of running an axell shell command
 */

define([ '/js/lib/jquery.js', '/js/api.js' ], function ( $, api ) {
    /*
    function smartWhat ( $element ) {
        if ( $element.prop( 'tagName' ) === 'select' ) {
            //for <select> elements
            return 'val';
        } else if ( $element.prop( 'tagName' ) === 'input' ) {
            //for <input> elements (mostly type="text")
            return 'val';
        } else if ( $element.hasClass( 'powerbutton' ) ) {
            //for .powerbutton elements
            return 'powerbutton';
        } else if ( $element.hasClass( 'led' ) ) {
            //for .led elements
            return 'led';
        } else {
            return 'text';
        }
    }
    */

    $.fn.loadAxsh = function ( cmd /*, what */ ) {
        api.exe({
            cmd: cmd,
            __this: this,
            onSuccess: function () {
                var result = this.ajaxdata;
                this.__this.each( function ( index, element ) {
                    var $element = $( element );
                    if ( $element.prop( 'tagName' ) === 'select' ) {
                        //for <select> elements
                        $element.val( result );
                    } else if ( $element.prop( 'tagName' ) === 'input' ) {
                        //for <input> elements (mostly type="text")
                        $element.val( result );
                    } else if ( $element.hasClass( 'powerbutton' ) ) {
                        //for .powerbutton elements
                        $element.powerbutton( 'option', 'state', result );
                    } else if ( $element.hasClass( 'led' ) ) {
                        //for .led elements
                        $element.powerbutton( 'option', 'color', result );
                    } else {
                        $element.text( result );
                    }
                });
            }
        });
    };
});