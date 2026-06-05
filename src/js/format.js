define( function () {
    "use strict";
    //this is a lookup table that is used in certain a TYPE function to uncompress nibbles
    var hexNibblesToStr = {
        "-":"----",
        "0":"0000",
        "1":"0001",
        "2":"0010",
        "3":"0011",
        "4":"0100",
        "5":"0101",
        "6":"0110",
        "7":"0111",
        "8":"1000",
        "9":"1001",
        "A":"1010",
        "a":"1010",
        "B":"1011",
        "b":"1011",
        "C":"1100",
        "c":"1100",
        "D":"1101",
        "d":"1101",
        "E":"1110",
        "e":"1110",
        "F":"1111",
        "f":"1111"
    };

    /*
    Notes for writing new TYPE:
    * IMPORTANT: make sure you have a pair of parenthesis in the pattern.
    * always return a value from the parser function
    * always write a comment about what type it is, and what is the expected result
    * write a test for it in parser-test.js
    * try using 'use strict' in your function to have high quality code
     */
    var TYPES = {
        '': {//this is the default (when no type is specified)
            pattern: '(\\S+)',
            parser: function ( txt ) {
                "use strict";
                return txt;
            }
        },
        '-': {//one or more dashes. It is used a lot in axell protocol
            pattern: '([-]+)',
            parser: function ( txt ) {
                'use strict';
                return txt;
            }
        },
        's': {//A string
            pattern: '(\\S+)',
            parser: function ( txt ) {
                "use strict";
                return txt;
            }
        },
        'st': {//A string title that looks like this "RSP:"
            pattern: '(\\S+):',
            parser: function ( txt ) {
                "use strict";
                return txt;
            }
        },
        'q':{//A string surrounded with single-quotation marks '
            pattern: "'([^']*?)'",
            parser:  function ( txt ) {
                "use strict";
                return txt;
            }
        },
        'Q':{//A string surrounded with double-quotation marks "
            pattern: '"([^"]*?)"',
            parser:  function ( txt ) {
                "use strict";
                return txt;
            }
        },
        'n':{//number
            pattern: '([e\\d\\.\\+\\-]+)',
            parser:  function ( txt ) {
                "use strict";
                return Number( txt );
            }
        },
        'nib':{//nibbles
            pattern: '([\\da-f]+)',
            parser:  function ( txt ) {
                "use strict";
                var uncompressed = '';
                for ( var i = 0; i < txt.length; i++ ) {
                    uncompressed += hexNibblesToStr[ txt.charAt( i ) ];
                }
                return uncompressed;
            }
        },
        'e':{//one character error code value based on Axell Wireless conventions '0' means no error ( false) and '1' means error (true)
            pattern: '([01-])',
            parser: function ( txt ) {
                "use strict";
                switch( txt ) {
                    case '1':
                        return true;
                    case '0':
                        return false;
                    default:
                        return null;
                }
            }
        },
        'l':{//led color: 0 -> 'green', '1' -> 'red', '2' -> 'orange', '-': 'grey'
            pattern: '([012-])',
            parser: function ( txt ) {
                switch ( txt ) {
                    case '0':
                        return 'green';
                    case '1':
                        return 'red';
                    case '2':
                        return 'orange';
                    case '-':
                        return 'grey';
                    default:
                        return '';//never happens with this pattern
                }
            }
        },
        'b':{//boolean value. using the Boolean() function
            pattern: '(\\S+)',
            parser: function ( txt ) {
                "use strict";
                return Boolean( txt );
            }
        },
        'c':{//single character (strictly should be one)
            pattern: '(\\S)',
            parser: function ( txt ) {
                "use strict";
                return txt.charAt( 0 );
            }
        },
        'carr':{//an array of characters which are stuck together
            pattern: '(\\S+)',
            parser: function ( txt ) {
                "use strict";
                return txt.split( '' );
            }
        },
        'd':{//date (axell format) YYMMDD -> YY/MM/DD
            pattern: '(\\d{6})',
            parser: function ( txt ) {
                "use strict";
                return txt.substr( 0, 2 ) + '/' + txt.substr( 2, 2 ) + '/' + txt.substr( 4, 2 );
            }
        },
        't':{//time (axell format) HHMMSS -> HH:MM:SS
            pattern: '(\\d{6})',
            parser: function ( txt ) {
                "use strict";
                return txt.substr( 0, 2 ) + ':' + txt.substr( 2, 2 ) + ':' + txt.substr( 4, 2 );
            }
        },
        'dt':{//date and time separated with one space. Same as the above date and time (axell format)
            pattern: '(\\d{6}\\s+\\d{6})',
            parser: function ( txt ) {
                "use strict";
                //remove the space(s) between date and time
                txt = txt.replace( /\s+/, '' );
                return txt.substr( 0, 2 ) + '/' + txt.substr( 2, 2 ) + '/' + txt.substr( 4, 2 ) + ' ' +
                    txt.substr( 6, 2 ) + ':' + txt.substr( 8, 2 ) + ':' + txt.substr( 10, 2 );
            }
        },
        'tm':{//temperature
            pattern: '([\\d\\.\\+\\-]+)',
            parser:  function ( txt ) {
                "use strict";
                return Number( txt );
            }
        }
    };

    /**
     * Creates a parser object
     * @param {string} formatStr the descriptor is a space-separated string of KEY:TYPE format. Key can be a valid Javascript id
     * and TYPE can be any of the types mentioned in the switch of parse() function below.
     * @constructor
     */
    function Pattern ( formatStr ) {
        var regexpStr = '^\\s*';
        var resStructure = [];
        var nameTypes = formatStr.split( /\s+/ );
        // a list of all of the names in the formatStr. It is used for checking duplicates.
        var nameSet = {};
        for ( var i = 0; i < nameTypes.length; i++ ) {
            var currNameType = nameTypes[ i ];
            if ( currNameType === '' ) {
                continue;
            }
             //'...' will accept any character and ignores the rest of the string.
            if ( currNameType === '...' ) {
                regexpStr += '.*';
                break;
            }
            var nameType = currNameType.split( ':', 2 );
            var name = nameType[ 0 ];
            var type = nameType[ 1 ] || ''; //if the type is not specified, use the '' as the name of the parser function
            var currTYPE = TYPES[ type ];
            //note: name may be '' (if the format specifier is like ':' or ':q' for example).
            // The elements with empty name will be ignored.
            if ( name && nameSet[ name ] ) {
                throw new SyntaxError( 'Duplicate definition for ' + name + ' in format string ' + formatStr );
            } else {
                nameSet[ name ] = true;
            }
            if ( !currTYPE ) {
                throw new SyntaxError( 'Unacceptable type: ' + type + ' in formatStr ' + formatStr );
            }
            regexpStr += currTYPE.pattern + '\\s*';
            resStructure.push({
                name: name,
                parser: currTYPE.parser
            });
        }
        regexpStr += '$';
        //free the memory for the namesSet. We don't need it anymore.
        nameSet = null;
        if ( resStructure.length === 0 ) {
            throw new SyntaxError( 'No element was detected in formatStr: ' + formatStr );
        }
        ///console.log( 'formatStr: ' + formatStr + ', regexpText: ' + regexpText );
        var regexp = new RegExp( regexpStr, 'i' );

        /**
         * Parses a raw text with the format specified when creating the constructor
         * @param rawText {string} one line of the string that was received from the server
         * @return {Object} the object corresponding to the format string that was passed to the constructor.
         */
        this.parseLine = function Pattern_parseLine ( rawText ) {
            "use strict";
            // @note: we should create a new object so that when parsing multi-row strings, the result is different for
            // each line
            var ret = {};
            var parts = regexp.exec( rawText );
            if ( !parts ) {
                throw new SyntaxError( 'Could not parse the result: "' + rawText + '" with regexp: ' + regexp +
                    ' (format: ' + formatStr + ')');
            }
            for( var i = 0; i < resStructure.length; i++ ) {
                //ignore the elements which have no name
                if ( resStructure[ i ].name !== '' ) {
                    //note: the first array element of the result of RegExp.match() function is not useful
                    var name = resStructure[ i ].name;
                    var parsedResults = resStructure[ i ].parser( parts[ i + 1 ] );
                    //if the name variable contains comma, then switch to multi-vars mode
                    var multiVars = name.split( ',' );
                    if ( multiVars.length > 1 ) {
                        //each name in the multi-vars mode corresponds to one character in the result
                        if ( multiVars.length !== parsedResults.length ) {
                            throw new Error( 'pattern.parser.2: Number of names (' + multiVars.length +
                                ') does not match the number of characters (' + parsedResults.length + ')' );
                        }
                        for( var n = 0; n < multiVars.length; n++ ) {
                            var subName = multiVars[ n ];
                            if ( subName === '' || subName === ' ') {
                                throw new Error( 'pattern.parser.1: The subname cannot have spaces or an extra comma' );
                            }
                            ret[ subName ] = parsedResults.charAt( n );
                        }
                    } else {
                        ret[ name ] = parsedResults;
                    }
                }
            }
            return ret;
        };

        //** returns the format string that was used to build this instance of Pattern()
        this.toString = function () {
            return formatStr + ' ' + regexp;
        }
    }
    /**
     * Creates a parser object
     * @param format {string|array} The descriptor is a space-separated string of KEY:TYPE format.
     *        Key can be a valid Javascript id and TYPE can be any of the types mentioned in the switch of
     *        parse() function below.
     * @param [alwaysReturnArray] {boolean} should we always return an array (even when format is not an array?)
     * @constructor
     */
    function Parser ( format, alwaysReturnArray ) {
        "use strict";
        var patternArr = [];
        //syntactic sugar: if format is a simple string, convert it to an array with one element: itself
        if ( typeof format === 'string' ) {
            format = [ format ];
        }
        for( var f = 0; f < format.length; f++ ) {
            patternArr.push( new Pattern( format[ f ] ) );
        }

        /**
         * Parses a raw text with the format specified when creating the constructor
         * @param rawText the string that was received from the server
         * @return {Object|Array} if the string is just one line, this returns the object corresponding to the
         *         format string that was passed to the constructor. If there are more than one lines, it returns an array
         *         of objects. Each line corresponds to an object respectively.
         */
        this.parse = function Parser_parse ( rawText ) {
            "use strict";
            var lines = rawText.split( '\n' );
            var results = [];
            //for every line try every pattern to find a match
            for ( var l = 0; l < lines.length; l++ ) {
                var found = false;
                for ( var p = 0; p < patternArr.length; p++ ) {
                    try {
                        results.push( patternArr[ p ].parseLine( lines[ l ] ) );
                        found = true;
                        break;
                    } catch ( ex ) {
                        //could not parse it with that pattern
                    }
                }
                if ( !found ) {
                    throw new SyntaxError( 'Could not match "' + lines[ l ] + '" with any patterns[' +
                        patternArr.length + ']: ' +
                        patternArr.join( '\n' ) );
                }
            }
            //if alwaysReturnArray is not true, and we only have exactly one line to parse, then we'll return only the
            // object representing that line instead of an array of objects (just a shorthand to make it easier and
            // more efficient to reference the result by the caller.
            if ( !alwaysReturnArray && results.length === 1 ) {
                return results[ 0 ];
            }
            if ( ( results.length >= 0 ) ) {
                return results;
            } else {
                throw new SyntaxError( 'Could not parse "' + rawText + '" with any pattern.' );
            }
        };
    }

    return {
        Parser:Parser
    };
});