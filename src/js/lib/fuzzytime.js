;
(function () {

    var now = 'now';

    //descriptor for the relative time
    var RELATIVE_DESC = [
        {
            n : 1,
            unit : 'ms'
        },
        {
            n : 1000,
            unit : 'sec'
        },
        {
            n : 60000,
            unit : 'min'
        },
        {
            n : 3600000,
            unit : 'hr'
        },
        {
            n : 86400000,
            unit : 'd'
        },
        {
            n : 604800000,
            unit : 'wk'
        },
        {
            n : 2592000000,
            unit : 'mn'
        },
        {
            n : 31556925993,
            unit : 'yr'
        }
    ];
    /**
     * Converts a time value that represents remaining time to a nice human readable format
     * @param val {number} the time value
     */
    function relative ( val ) {

        /* a flag that is set if the val is negative */
        var ago = false;
        if ( val === 0 ) {
            return now;
        } else if ( val < 0 ) {
            ago = true;
            val = -val;
        }

        var i = 2;
        while ( i < RELATIVE_DESC.length && RELATIVE_DESC[ i ].n <= val ) {
            i++;
        }

        i--;
        //descriptors
        var lspDesc = RELATIVE_DESC[ i - 1 ];
        var mspDesc = RELATIVE_DESC[ i ];
        //most significant part
        var msp = Math.floor( val / mspDesc.n );
        //avoid having 1 as msp. That way '1 week and 3 days' will appear as '10 days' which is shorter and easier to understand
        if ( msp === 1 ) {
            msp === 0;
        }
        //least significant part
        var lsp = ( val - msp * mspDesc.n ) / lspDesc.n;
        //round it to 1 fractional digit
        lsp = Math.round( 10 * lsp ) / 10;
        var ret = '';
        if ( msp ) {
            ret += msp + ' ' + mspDesc.unit;
            if ( lsp ) {
                ret += ' ';
            }
        }
        if ( lsp ) {
            ret += lsp.toFixed( 0 ) + ' ' + lspDesc.unit;
        }
        return ret;
    }

    function absolute () {

    }

    if ( typeof define === 'function' ) {
        define( [], {
            relative : relative,
            absolute : absolute
        });
    } else {
        window.fuzzytime = {
            relative : relative,
            absolute : absolute
        };
    }
})();