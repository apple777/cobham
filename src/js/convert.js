define( function () {

    /** for linerar conversions */
    function LinerarConvertion ( x1, y1, x2, y2 ) {
        var a = ( y2 - y1 ) / ( x2 - x1 );
        var b = y1 - ( a * x1 );
        this.y = function ( x ) {
            return a * x + b;
        }
    }

    /** represents a linear equation that is used to transfer values from one range to another */
    function RangeConvertion ( srcMin, srcMax, dstMin, dstMax ) {
        "use strict";

        //** initialize it
        if ( _.isFinite( srcMin ) ) {
            this.reset( srcMin, srcMax, dstMin, dstMax );
        }
    }

    /** recalculates the ratio coefficients */
    RangeConvertion.prototype._calculateRatios = function () {
        this._a = ( this._dstMax - this._dstMin ) / ( this._srcMax - this._srcMin );
        this._b = this._dstMin - ( this._srcMin * this._a );
    };

    /** resets the ratios */
    RangeConvertion.prototype.reset = function ( srcMin, srcMax, dstMin, dstMax ) {
        "use strict";

        this.setSrc( srcMin, srcMax );
        this.setDst( dstMin, dstMax );
    };

    /** set the src ratio */
    RangeConvertion.prototype.setSrc = function ( srcMin, srcMax ) {
        "use strict";

        if ( srcMin === srcMax ) {
            //noinspection JSUnresolvedFunction
            throw new Error( 'RangeConvertion.2: The srouce range is 0 : ' + srcMin + '-' + srcMax );
        } else {
            this._srcMin = srcMin;
            this._srcMax = srcMax;
            this._calculateRatios();
        }
    };

    /** set the dst ratio */
    RangeConvertion.prototype.setDst = function ( dstMin, dstMax ) {
        "use strict";

        if ( dstMin === dstMax ) {
            //noinspection JSUnresolvedFunction
            throw new Error( 'RangeConvertion.3: The destination is 0: ' + dstMin + '-' + dstMax );
        } else {
            this._dstMin = dstMin;
            this._dstMax = dstMax;
            this._calculateRatios();
        }
    };

    /** Returns the destination span */
    RangeConvertion.prototype.getDstSpan = function () {
        return this._dstMax - this._dstMin;
    };

    /** Returns the source span */
    RangeConvertion.prototype.getSrcSpan = function () {
        return this._srcMax - this._srcMin;
    };

    /** returns the y for a specific x that is supposed to be in this line */
    RangeConvertion.prototype.convert = function ( x ) {
        "use strict";

        if ( x < this._srcMin ) {
            x = this._srcMin;
        } else if ( x > this._srcMax ) {
            x = this._srcMax;
        }
        return this._a * x + this._b;
    };

    /** returns the x for a specific y that is supposed to be in this line */
    RangeConvertion.prototype.reverse = function ( y ) {
        "use strict";

        if ( y < this._dstMin ) {
            y = this._dstMin;
        } else if ( y > this._dstMax ) {
            y = this._dstMax;
        }
        return ( y - this._b ) / this._a;
    };

    /** puts a value in the limits */
    function putInLimits ( x, minVal, maxVal ) {
        if ( x < minVal ) {
            return minVal;
        } else if ( x > maxVal ) {
            return maxVal;
        } else {
            return x;
        }
    }

    /** converts Celsius to Fahrenheit */
    function cel2fah ( c ) {
        return ( c * 9 / 5 ) + 32;
    }

    /** converts Fahrenheit to Celsius */
    function fah2cel ( f ) {
        return ( f - 32 ) * 5 / 9;
    }

    /**
     * A class that automatically converts between start/stop and center/span frequencies
     * @deprecated
     */
    function FreqRange ( init ) {
        if ( init && _.isObject( init ) ) {
            if ( 'start' in init && 'stop' in init ) {
                this.setStartStop( init.start, init.stop );
            } else if ( 'center' in init && 'span' in init ) {
                this.setCenterSpan( init.center, init.span );
            }
        }
    }

    /** Sets start/stop and updates center/span accordingly */
    FreqRange.prototype.setStartStop = function ( start, stop ) {
        this.start = start;
        this.stop = stop;
        //update center/span
        this.center = ( this.start + this.stop ) / 2;
        this.span = this.stop - this.start;
    };

    /** Sets center/span and updates start/stop accordingly */
    FreqRange.prototype.setCenterSpan = function ( center, span ) {
        this.center = center;
        this.span = span;
        //update start/stop
        this.start = center - ( span / 2 );
        this.stop = center + ( span / 2 );
    };

    /** a better version of FreqRange */
    function FrequencyRange ( minFreq, startFreq, stopFreq, maxFreq ) {
        "use strict";
        if ( minFreq < startFreq && startFreq < stopFreq && stopFreq < maxFreq ) {
            this._min = minFreq;
            this._max = maxFreq;
            this._minSpan = 0;
            //backup the initial start and stop for restoring them with reset() function
            this._startBackup = startFreq;
            this._stopBackup = stopFreq;
            this.setStart( startFreq );
            this.setStop( stopFreq );

        } else {
            //noinspection JSUnresolvedFunction
            throw new Error( 'Invalid parameters: ' + minFreq + startFreq + stopFreq + maxFreq );
        }
    }

    FrequencyRange.prototype.reset = function () {
        this.setRange( this._startBackup, this._stopBackup );
    };

    FrequencyRange.prototype.setStart = function ( start ) {
        "use strict";
        this._start = start < this.getMin() ? this.getMin() : start;
        //make sure that this new start is not going to make the span smaller than its minimum allowed value
        if ( this.getSpan() < this.getMinSpan() ) {
            this.setStop( this._start + this._minSpan );
        }
    };

    FrequencyRange.prototype.setStop = function ( stop ) {
        "use strict";
        this._stop = stop > this.getMax() ? this.getMax() : stop;
        //make sure that this new stop is not going to make the span smaller than its minimum allowed value
        if ( this.getSpan() < this.getMinSpan() ) {
            this.setStart( this._stop - this._minSpan );
        }
    };

    FrequencyRange.prototype.getMin = function () {
        return this._min;
    };

    FrequencyRange.prototype.setMinSpan = function ( minSpan ) {
        this._minSpan = minSpan;
    };

    FrequencyRange.prototype.getMinSpan = function () {
        return this._minSpan;
    };

    FrequencyRange.prototype.getMaxSpan = function () {
        return this._max - this._min;
    };

    FrequencyRange.prototype.getStart = function () {
        return this._start;
    };

    FrequencyRange.prototype.getStop = function () {
        return this._stop;
    };

    FrequencyRange.prototype.getMax = function () {
        return this._max;
    };

    FrequencyRange.prototype.setSpan = function ( span ) {
        "use strict";
        span = putInLimits( span, this.getMinSpan(), this.getMaxSpan() );
        var _center = this.getCenter();
        this.setStart( _center - span / 2 );
        this.setStop( _center + span / 2 );
    };

    FrequencyRange.prototype.getSpan = function () {
        "use strict";
        return this.getStop() - this.getStart();
    };

    FrequencyRange.prototype.setCenter = function ( center ) {
        "use strict";
        var _span = this.getSpan();
        this.setStart( center - _span / 2 );
        this.setStop( center + _span / 2 );
    };

    FrequencyRange.prototype.getCenter = function () {
        "use strict";
        return ( this.getStart() + this.getStop() ) / 2;
    };


    FrequencyRange.prototype.setRange = function ( start, stop ) {
        this.setStart( start );
        this.setStop( stop );
    };

    /**
     * @param [percent] {number} 0 means no change, positive values means smaller span (zoom in), negative values means bigger span (zoom out).
     */
    FrequencyRange.prototype.zoom = function ( percent ) {
        "use strict";
        this.setSpan( this.getSpan() * ( 100 - percent ) / 100 );
    };

    /**
     * Moves the range by a percentage of its span
     * @param percent {number} a positive or negative percentage. 0 means no move
     */
    FrequencyRange.prototype.move = function ( percent ) {
        "use strict";
        if ( percent !== 0 ) {
            var span = this.getSpan();
            var newCenter = this.getCenter() + span * percent / 100;
            //check if setting this new center will make the draw area out of range
            if ( newCenter - span / 2 < this.getMin() ) {
                newCenter = this.getMin() + span / 2;
            } else if ( newCenter + span / 2 > this.getMax() ) {
                newCenter = this.getMax() - span / 2;
            }
            this.setCenter( newCenter );
        }
    };

    /**
     * Converts Hz to MHz
     * @param hz {number} the value in hertz
     * @param [unit] {boolean} truthy values mean ' MHz' will be added to the output, falsy values mean the raw number will be returned. The default is false.
     * @returns {string|number} if unit is mentioned it will return an string, otherwise it will return a number
     */
    function hz2mhz ( hz, unit ) {
        if ( unit ) {
            return ( hz / 1000000 ).toFixed(5) + ' MHz';
        } else {
            return (hz / 1000000).toFixed(5);
        }
    }

    /**
     * Converts sec to ms
     * @param sec {number} the value in seconds (can be fractional)
     * @param [unit] {boolean} truthy values mean ' ms' will be added to the output, falsy values mean the raw number will
     *        be returned. The default is false.
     * @returns {string|number} if unit is mentioned it will return an string, otherwise it will return a number
     */
    function sec2ms ( sec, unit ) {
        if ( unit ) {
            return ( sec * 1000 ) + ' ms';
        } else {
            return sec * 1000;
        }
    }

    /**
     * Converts a time value to a nice human readable format
     * @param val {number} the time value
     * @return {String}
     */
    function fuzzyTime ( val) {
        var min, sec, hr, day;

        if ( val < 100 ) {
            //if it is less than a 100 ms
            return val + ' ms';
        } else if ( val < 1000 ) {
            //if it is less than a second
            sec = val / 1000;
            return sec.toFixed( 2 ) + ' sec';
        } else if ( val < 60000 ) {
            //if it is less than a minute
            sec = val / 1000;
            return sec.toFixed( 1 ) + ' sec';
        } else if ( val < 3600000 ) {
            //if it is less than an hour
            sec = Math.round( val / 1000 );
            min = Math.floor( sec / 60 );
            sec -= min * 60;
            if ( sec ) {
                return min + ' min and ' + sec + ' sec';
            } else {
                return min + ' min';
            }
        } else if ( val < 86400000 ) {
            //if it is less than an day
            sec = Math.round( val / 1000 );
            min = Math.floor( sec / 60 );
            sec -= min * 60;
            hr = Math.floor( min / 60 );
            min -= hr * 60;
            if ( sec && min ) {
                return hr + ' hr and ' + min + ' min and ' + sec + ' sec';
            } else if ( min ) {
                return hr + ' hr and ' + min + ' min';
            } else {
                return hr + ' hr';
            }
        } else if ( val < 604800000 ) {
            hr = Math.round( val / 3600000 );
            day = Math.floor( hr * 24 );
            hr -= day * 24;
            if ( hr ) {
                return day + ' d and ' + hr + ' hr';
            } else {
                return day + ' d';
            }
        } else {
            return 'a lot!';
        }
    }

    /**
     * Converts a string that represents Axell Date and Time to a Date object
     * @param axellDateTime {String} a string in the form of YYMMDD hhmmss or YY/MM/DD hh:mm:ss
     * @return {Date} or null if it cannot convert the string
     */
    function axell2date ( axellDateTime ) {
        var parts = axellDateTime.match( /(\d\d).(\d\d).(\d\d)\s+(\d\d).(\d\d).(\d\d)/ );
        if ( parts ) {
            return new Date( parts[ 1 ], parts[ 2 ], parts[ 3 ], parts[ 4 ], parts[ 5 ], parts[ 6 ], 0 );
        } else {
            return null;
        }
    }

    /**
     * Converts a date object to DD/MM/YYYY hh:mm:ss
     * @param date {Date}
     * @return {String}
     */
    function date2slashedDDMMYYYY ( date ) {
        var y = date.getUTCFullYear();
        y = y.toString();
        var m = date.getUTCMonth() + 1;
        m = m < 10 ? '0' + m.toString() : m.toString();
        var d = date.getUTCDate();
        d = d < 10 ? '0' + d.toString() : d.toString();
        var h = date.getUTCHours();
        h = h < 10 ? '0' + h.toString() : h.toString();
        var n = date.getUTCMinutes();
        n = n < 10 ? '0' + n.toString() : n.toString();
        var s = date.getUTCSeconds();
        s = s < 10 ? '0' + s.toString() : s.toString();
        return d + '/' + m + '/' + y + ' ' + h + ':' + n + ':' + s;
    }

    function ToLocalDate (inDate) {
        var date = new Date();
        date.setTime(inDate.valueOf() - 60000 * inDate.getTimezoneOffset());
        return date;
    }

    /**
     * Converts an epoch to a date object
     * @param epoch
     * @returns {Date}
     */
    function epoch2date ( epoch ) {
        var ret = new Date( epoch * 1000 );
        //ret.setUTCSeconds(  );
        return ret;
    }

    /**
     * Converts a timestamp from epoch to DD/MM/YYYY hh:mm:ss
     * @param epoch
     * @return {String}
     */
    function epoch2slashedDDMMYYYY ( epoch ) {
        return date2slashedDDMMYYYY( epoch2date( epoch ) );
    }
    
    /**
     * Converts a date object to a compact date time format (YYMMDD hhmmss)
     * @param date {Date}
     * @returns {string}
     */
    function date2compact ( date ) {
        var y = date.getUTCFullYear() % 100;
        y = y < 10 ? '0' + y.toString() : y.toString();
        var m = date.getUTCMonth() + 1;
        m = m < 10 ? '0' + m.toString() : m.toString();
        var d = date.getUTCDate();
        d = d < 10 ? '0' + d.toString() : d.toString();
        var h = date.getUTCHours();
        h = h < 10 ? '0' + h.toString() : h.toString();
        var n = date.getUTCMinutes();
        n = n < 10 ? '0' + n.toString() : n.toString();
        var s = date.getUTCSeconds();
        s = s < 10 ? '0' + s.toString() : s.toString();
        return y + m + d + ' ' + h + n + s;
    }

    /**
     * Converts a compact date time string to a date object
     * @param compact {String} in the form of 'YYMMDD hhmmss'
     * @return {Date} or null if it can't convert the string
     */
    function compact2date ( compact ) {
        var parts = compact.match( /(\d\d)(\d\d)(\d\d)\s+(\d\d)(\d\d)(\d\d)/ );
        if ( parts ) {
            return new Date( parts[ 1 ], parts[ 2 ], parts[ 3 ], parts[ 4 ], parts[ 5 ], parts[ 6 ], 0 );
        } else {
            return null;
        }
    }

    return {
        LinerarConvertion: LinerarConvertion,
        RangeConvertion: RangeConvertion,
        cel2fah: cel2fah,
        fah2cel: fah2cel,
        putInLimits: putInLimits,
        FreqRange: FreqRange,
        FrequencyRange: FrequencyRange,
        hz2mhz : hz2mhz,
        sec2ms : sec2ms,
        fuzzyTime : fuzzyTime,
        axell2date : axell2date,
        date2slashedDDMMYYYY : date2slashedDDMMYYYY,
        epoch2date : epoch2date,
        epoch2slashedDDMMYYYY : epoch2slashedDDMMYYYY,
        date2compact : date2compact,
        compact2date : compact2date
    };
});
