;

/***********************************
 * All the handlebars helper functions
 ***********************************/

define([ '/js/lib/jquery.js', '/js/lib/handlebars.js' ], function ( $, Handlebars ) {
    /**
     * this one reads the template from a tag, removes the tag and adds compiles the template with the given data and puts
     * it in place
     */
    Handlebars.replaceTemplate = function Handlebars_replaceTemplate( templateSelector, templateData ) {
        var $templateSelector = $( templateSelector );
        if ( $templateSelector.length === 0 ) {
            console.error( templateSelector + ' did not specify a Handelbars template' );
            return;
        }
        var template = Handlebars.compile( $templateSelector.html() );
        $templateSelector.before( template( templateData )).remove();
    }

    /**
     * This helper generates a list of options that include numbers from 'min' to 'max' (useful for attenuation selectors
     * for example).
     * Write an option like this: {{option "min" "max" "selection"}}
     * All parameters should both be embedded in quotation. They'll be converted to number internally later.
     * if min is bigger than max, a reverse loop will be used which results in options going from big number to the small
     * number. Selection is optional but if it is provided, the relevant <option> tag will have "selected" attribute.
     */
    Handlebars.registerHelper( 'option', function ( range1, range2, selection ) {

        var range1 = Number( range1 ) || 0;
        var range2 = Number( range2 ) || 0;
        var selection = Number( selection );
        var ret = '';
        var i = range1;
        while ((range1 < range2)? (i <= range2) : (i >= range2) )  {
            if ( i === selection ) {
                ret += '<option selected="selected">' + i + '</option>';
            } else {
                ret += '<option>' + i + '</option>';
            }
            i += range1 < range2 ? 1 : -1;
        }

        return new Handlebars.SafeString( ret );
    });

    /**
     * Takes care of led <div> tags.
     * all parameters are optional. The only processing it does at the moment is to convert single-character colors
     * to their color name for example '1' becomes 'green' before beins used as a class for the generated <div>
     * It should be used as {{led STATUS}}
     */
    Handlebars.registerHelper( 'led', function ( color, extraClass, tooltip ) {
        var ret = '<div class="led';
        switch ( color ) {
            case 0:
            case true:
            case '0':
            case 'green':
                ret += ' green';
                break;
            case 1:
            case false:
            case '1':
            case 'red':
                ret += ' red';
                break;
            case NaN:
            case null:
            case '-':
            case 'grey':
                ret += ' grey';
                break;
        }
        if ( typeof extraClass === 'string' ) {
            ret += ' ' + extraClass;
        }
        ret += '"';

        if ( typeof tooltip === 'string' ) {
            ret += ' tooltip="' + tooltip + '"';
        }
        ret += '></div>';
        return new Handlebars.SafeString( ret );
    });

    /**
     * Read a date string in the format of 'YYMMDD' and show it in format of 'YY/MM/DD'
     */
    Handlebars.registerHelper( 'axelldate', function ( datetime ) {
        return datetime.substr( 0, 2 ) + '/' + datetime.substr( 2, 2 ) + '/' + datetime.substr( 4, 2 );
    });

    /**
     * Read a time string in the format of 'HHmmss' and show it in format of 'HH:mm:ss'
     */
    Handlebars.registerHelper( 'axelltime', function ( datetime ) {
        return datetime.substr( 0, 2 ) + ':' + datetime.substr( 2, 2 ) + ':' + datetime.substr( 4, 2 );
    });

    /**
     * Read a datetime string in the format of 'YYMMDDHHmmss' and show it in format of 'YY/MM/DD HH:mm:ss'
     */
    Handlebars.registerHelper( 'axelldatetime', function ( datetime ) {
        return datetime.substr( 0, 2 ) + '/' + datetime.substr( 2, 2 ) + '/' + datetime.substr( 4, 2 ) + ' ' +
               datetime.substr( 6, 2 ) + ':' + datetime.substr( 8, 2 ) + ':' + datetime.substr( 10, 2 );
    });

    return {};
});
