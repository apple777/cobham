/**
 * Algorithm:
 * This file holds a database of values that it receives from the server. This is how it works:
 * At the very beginning, it shows the range in the uplink.
 * However it is interactive to user's needs. The user can call the setLink() and manipulating the result
 * of getFrequencyRange() to change the query that
 */
define([ '/js/api.js', '/js/convert.js' ],
function ( api, convert ) {

    /** how often poll the server (ms) for obtaining the "averages".*/
    var POLL_INTERVAL = 2000;

    /** holds the valid ranges from SAR attribute */
    var range = {};
    /** a string that can be 'UL' for Uplink or 'DL' for Downlink. Before initialization it is just null */
    var link = null;
    /** It specifies the maximum number of points that will be returned as result. The actual number of points can be less */
    var max = 200;
    /** the data that comes from spectrumdata command (interpolated average and peak values)*/
    var data;

    /**
     * Returns the link
     * @returns {string} 'UL' for Uplink and 'DL' for Downlink
     */
    function getLink () {
        "use strict";

        return link;
    }

    /**
     * Changes the link
     * @param linkUD {string} 'UL' for Uplink and 'DL' for Downlink (case insensitive)
     */
    function setLink ( linkUD ) {
        linkUD = linkUD.toUpperCase();
        if ( linkUD == 'UL' || linkUD == 'DL' ) {
            if ( link !== linkUD ) {
                link = linkUD;
                getFrequencyRange().reset();
            }
        } else {
            throw new Error('Link should be "UL" or "DL" but it is "' + linkUD + '"');
        }
    }

    /**
     * Sets the maximum number of elements that is polled from the server. see the -l switch of 'spectrumdata'
     * @param maxElements {number} the number of elements. Typically it is between 5 to 1500 elements (it will be put in this range anyway)
     */
    function setMax ( maxElements ) {
        max = Math.ceil( convert.putInLimits( maxElements, 5, 1500 ) );
    }

    /**
     * returns the maximum number of elements that is polled from the server. see the -l switch of 'spectrumdata'
     * @returns {number} returns the max
     */
    function getMax () {
        return max;
    }

    /**
     * Returns the current frequency range controller object
     * @returns {object} the convert.FrequencyRange object that controls the behavior of this spectrumdata or null if it is not initialized yet
     */
    function getFrequencyRange () {
        return range[ link ];
    }

    /**
     * Returns the closest value (from values array) that is near or equal to the freq parameter
     * @param freq {number} the frequency to look for
     * @return {object} the element from values array or null if it was impossible to find something meaningful
     */
    function getClosestValue ( freq ) {
        //check if we have any data to return something at all!
        if ( !data || !data.values ) {
            return null;
        }

        var values = data.values;
        var lo = 0;
        var hi = values.length - 1;

        //if freq is out of range, return the marginal value
        if ( freq < values[ lo ].freq ) {
            return values[ lo ];
        } else if ( freq > values[ hi ].freq ) {
            return values[ hi ];
        }

        //do a binary search to find the higher and lower values that are closest to freq
        while ( hi - lo > 1 ) {
            var i = Math.floor( ( hi + lo ) / 2 );
            var val = values[ i ];
            if ( val.freq < freq ) {
                lo = i;
            } else if ( val.freq > freq ) {
                hi = i;
            } else {
                //val.freq = freq : perfect match, return it without interpolation
                return val;
            }
        }

        //determine which one is closer to freq: the value at lo or hi?
        var middlePoint = ( values[ lo ].freq + values[ hi ].freq ) / 2;
        return freq <= middlePoint ? values[ lo ] : values[ hi ];
    }

    /** Return the last average data (or null if there was no data or there was an error in last execution) */
    function getData () {
        "use strict";

        return data;
    }

    /** forcefully update the data for average and peaks */
    function forceUpdate () {
        updateData( true );
    }

    /**
     * Updates the data with the latest queries
     * @param [dontPoll] {Boolean} if set to true, it will schedule itself for being called again!
     *        the end user should never ever call this function with true. This module should only make
     *        one such call!
     */
    function updateData ( dontPoll ) {
        var start = Math.ceil( getFrequencyRange().getStart()), stop = Math.floor( getFrequencyRange().getStop());

        api.exeArr([
            { cmd: this.cmd = api.RUN( 'spectrumdata', getLink(), start, stop, '-l', getMax(), '--json' ) },
            { cmd: this.cmd = api.RUN( 'spectrumdata', getLink(), start, stop, '-l', getMax(), '--json', '--peak' ) }
        ], function ( average, peak ) {
            if ( !dontPoll ) {
                setTimeout( updateData, POLL_INTERVAL );
            }
            var averageResult = JSON.parse( average.ajaxdata );
            var peakResult = JSON.parse( peak.ajaxdata );

            if ( averageResult && averageResult.values && averageResult.values.length >= 2 ) {
                if ( peakResult && peakResult.values && peakResult.values.length && averageResult.values.length ) {
                    //interpolate the peak data into the average data
                    for ( var i = 0; i < averageResult.values.length; i++ ) {
                        averageResult.values[ i ].peak = peakResult.values[ i ].level;
                        averageResult.values[ i ].time = peakResult.values[ i ].time;
                    }
                }
                data = averageResult;
            } else {
                data = null;
            }
        });
    }

    /**
     * Returns the index for the data with highest level in the current data set
     * @returns {number} the index number for data.values array or -1 if the data is not found
     */
    function getCurrMaxIndex () {
        if ( !data || !data.values || data.values.length < 2 ) {
            return -1;
        }

        var maxIndex = 0;
        var maxLevel = data.values[ 0 ].level;
        //if the diagram is just a straight line
        var justALine = true;
        for ( var i = 1; i < data.values.length; i++ ) {
            var level = data.values[ i ].level;
            if ( level !== maxLevel ) {
                justALine = false;
                if ( level > maxLevel ) {
                    maxIndex = i;
                    maxLevel = data.values[ i ].level;
                }
            }
        }

        //if all values are the same, then there can't be a max! test the first two values and you'll get it.
        //this is for when there's no signal or when the user has zoomed in so much that there is only a straight line on screen!
        if ( justALine ) {
            return -1;
        }

        return maxIndex;
    }

    /** Saves the peaks into a text file */
    function savePeaks () {
        api.exe({
            cmd: api.RUN( 'spectrumdata', getLink(), getFrequencyRange().getStart(), getFrequencyRange().getStop(), '-l', max, '--peak' ),
            onSuccess : function () {
                var blob = new Blob([ this.ajaxdata ], {type: 'text/plain;charset=utf-8'});
                saveAs( blob, 'Peak data.txt' );
            }
        });
    }

    /** initialize the database and draw the diagram when it's ready */
    api.exe({
        cmd : api.GET( 'SAR' ),
        parse : 'ulSpecMin:n ulSpecMax:n ulMin:n ulMax:n dlSpecMin:n dlSpecMax:n dlMin:n dlMax:n',
        onSuccess : function () {
            range = {
                UL: new convert.FrequencyRange(
                    this.parsedResults[ 'ulSpecMin' ],
                    this.parsedResults[ 'ulMin' ],
                    this.parsedResults[ 'ulMax' ],
                    this.parsedResults[ 'ulSpecMax' ]
                ),
                DL: new convert.FrequencyRange(
                    this.parsedResults[ 'dlSpecMin' ],
                    this.parsedResults[ 'dlMin' ],
                    this.parsedResults[ 'dlMax' ],
                    this.parsedResults[ 'dlSpecMax' ]
                )
            };
            //by default show the Downlink. Change the parameter to 'u' in order to show the Uplink
            setLink( 'DL' );
            //start the polling loop
            updateData( false );
        }
    });

    return {
        getData : getData,
        forceUpdate : forceUpdate,
        getFrequencyRange : getFrequencyRange,
        setMax : setMax,
        getMax : getMax,
        setLink : setLink,
        getLink : getLink,
        getClosestValue : getClosestValue,
        savePeaks : savePeaks,
        getCurrMaxIndex : getCurrMaxIndex
    }
});