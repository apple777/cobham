define(['/js/lib/jquery.js', '/js/api.js' ], function ( $, api ) {
    /**
     * Applies IHU
     * processes the result of the IHU command and removes the elements based on the specified selectors.
     * @param ihuResult {String} the result from a successful execution of GET IHU
     * @param sectionsArr {Array of Objects} each object in sectionsArr has a description and a JQuery selector
     *                            that will be used for looking it up.
     *                            If selector is missing, no action will be taken. However, description is mandatory.
     *                            For the characters of IHU which are euqal to ' ' (space), no object is necessary
     *                            and if there's something it will be ignored anyway.
     */
    function applyIhu( ihuResult, sectionsArr ) {
        if ( sectionsArr.length !== ihuResult.length ) {
            throw new Error( 'IHU1: The number of sections is different from the length of the result of IHU' );
        }

        _.each( sectionsArr, function ( section, i ) {
            switch ( ihuResult.charAt( i ) ) {
                case ' ':
                    //ignore spaces in the result of IHU
                    return;
                case '1':
                    console.log( section.description + ' available (' + section.selector + ')' );
                    break;
                case '0':
                    console.log( section.description + ' removed (' + section.selector + ')' );
                    if ( section.selector ) {
                        $( section.selector ).remove();
                    }
                    break;
            }
        });
    }

        /**
     * Gets the IHU and applies it
     */
    function getAndApplyIhu( sectionsArr ) {
        api.exe({
            cmd: 'get ihu',
            onSuccess: function ( o ) {
                applyIhu( o.ajaxdata );
            }
        });
    }

    return {
        applyIhu: applyIhu,
        getAndApplyIhu: getAndApplyIhu
    }
});