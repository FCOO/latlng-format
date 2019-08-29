/****************************************************************************
latlng-format-base, a class to validate, format, and transform positions (eq. leaflet LatLng)

    (c) 2015, FCOO

    https://github.com/fcoo/latlng-format
    https://github.com/fcoo

****************************************************************************/

(function ($, window, document, undefined) {
    "use strict";

    /*******************************************************
    window.latLngFormat =
    constructor of LatLngFormat, and
    holder of global options and methods
    ********************************************************/
    var latLngFormat = function( arg0, arg1 ) {
        return new LatLngFormat( arg0, arg1 );
    };

    //Options for the posible formats. Placed in seperate namespace
    latLngFormat.LATLNGFORMAT_DMSS = 0; //Degrees Minutes Seconds Decimal Seconds: N65d30'15.3"  d='degree sign'
    latLngFormat.LATLNGFORMAT_DMM  = 1; //Degrees Decimal minutes                : N65d30.258'
    latLngFormat.LATLNGFORMAT_DD   = 2; //Decimal degrees                        : N41.1234d

    latLngFormat.LATLNGFORMAT_UTM  = 3; //UTM                                    : 29Q 286657 2492164
    latLngFormat.LATLNGFORMAT_MGRS = 4; //MGRS                                   : 02U PG 03727 09686
    latLngFormat.LATLNGFORMAT_NAC  = 5; //NAC                                    : HBV6R RG77T.


    latLngFormat.LATLNGFORMAT_FIRST = latLngFormat.LATLNGFORMAT_DMSS;
    latLngFormat.LATLNGFORMAT_LAST  = latLngFormat.LATLNGFORMAT_NAC;


    //Default options
    var defaultOptions = {
        twoValueMode: false, //If true the different methods are called on lat and lng individually

        degreeChar  : String.fromCharCode(176), //or '&#176;' '&deg;'

        preText     : '',
        separator   : ' ',
        postText    : '',

             //lat, lng
        min: [-90, -180],
        max: [ 90,  180]
    };

    latLngFormat.options = $.extend({}, defaultOptions);

    /*
    latLngFormatList = list of different formats
    latLngFormatList = [id] of {
        getOptions: function()                             //Return the different options for the format. If
        format    : function(value of [lat,lng], options, latLngFormat) //Return formated string of value/[lat,lng]
        value     : function(String, options, latLngFormat) //Convert String from current string-format to latlng-value
    }
    */
    latLngFormat.formatList = {};
    latLngFormat.onChangeList = [];


    /************************************
    Static methods
    ************************************/
    $.extend( latLngFormat, {

        /************************************
        _callMethodFromFormatList
        ************************************/
        _callMethodFromFormatList: function( methodId, _this, arg ){
            var formatId = this.options.formatId;
            if (formatId === undefined)
                return '';

            if (this.formatList && this.formatList[formatId] && this.formatList[formatId][methodId])
                return this.formatList[formatId][methodId].apply(_this || this, arg);
            else {
                if (window.console && window.console.warn)
                    window.console.warn('latLngFormat: Missing '+methodId);
                return '';
            }
        },

        /************************************
        onChange( function( newFormatId, oldFormatId )[, context ])
        Adding a function to be called when the format is changed
        ************************************/
        onChange: function( func, context ){
            this.onChangeList.push( {
                context: context,
                method: func
            });
        },

        /************************************
        setFormat
        ************************************/
        setFormat: function( formatId, dontCallOnChange ){
            var oldFormatId = this.options.formatId;
            if (formatId !== undefined)
                this.options.formatId = formatId;

            formatId = this.options.formatId;

            //Reset to default options
            this.options = $.extend({}, this.options, defaultOptions );

            //Try to get delimiters from current locale in numeral
            var dS = '.',
                n = window.numeral,
                n_localeData = n && n.localeData ? n.localeData() : null,
                n_delimiters_decimal = n_localeData && n_localeData.delimiters && n_localeData.delimiters.decimal ? n_localeData.delimiters.decimal : null;

            if (n_delimiters_decimal)
              dS = n_delimiters_decimal;
            else {
                var S = Number(1.1).toLocaleString();
                dS = S.indexOf('.') > -1 ? '.' :
                     S.indexOf(',') > -1 ? ',' :
                     '.';
            }
            this.options.delimitersDecimal = dS;

            //Get new options
            var newOptions = {};

            newOptions = this._callMethodFromFormatList('getOptions', null, [formatId]);
            if (newOptions){
                //Adjust options. If convertMask, regexp, or placeholder isn't a array => convert
                $.each(['displayMask', 'editMask', 'convertMask', 'regexp', 'placeholder'], function(index, id){
                    newOptions[id] = newOptions[id] || '';
                });
                $.each(['convertMask', 'regexp', 'placeholder'], function(index, id){
                    if (!$.isArray(newOptions[id]))
                        newOptions[id] = [newOptions[id], newOptions[id]];
                });
                $.extend( this.options, newOptions );
            }

            if (!dontCallOnChange && (oldFormatId != formatId))
                $.each( this.onChangeList, function( index, rec ){
                    (rec.context ? $.proxy(rec.method, rec.context) : rec.method)(formatId, oldFormatId);
                });

            return formatId;
        }, //end of setFormat


        /************************************
        setTempFormat
        ************************************/
        setTempFormat: function( formatId ){
            return this.setFormat( formatId, true );
        },

        /************************************
        split
            Input: position (number)
            Return: {hemisphere, degrees, degreesDecimal, minutes, minutesDecimal, seconds, secondsDecimal}
        ************************************/
        split: function( position ){
            var result = {};
            result.hemisphere = position >= 0 ? +1 : -1;
            position = Math.abs(position);

            var positionDegrees = window.precision(position, 4);
            result.degrees = Math.floor(positionDegrees);
            result.degreesDecimal = Math.min(9999, Math.round((positionDegrees - result.degrees)*10000) );

            position = window.precision(position*60 % 60, 3); //Minutes
            result.minutes = Math.floor(position);
            result.minutesDecimal = Math.min( 999, Math.round((position - result.minutes)*1000) );

            position = window.precision(position*60 % 60, 1); //seconds
            result.seconds = Math.floor(position);
            result.secondsDecimal = Math.min( 9, Math.round((position - result.seconds)*10) );


            return result;
        }

    }); //end of $.extend( latLngFormat, {

    // expose access to the constructor
    window.latLngFormat = latLngFormat;

    //Overwrite numeral.js method locale to update format with new decimal delimiters
    var n = window.numeral;
    if (n && n.locale)
        n.locale = function( locale ){
            return function(){
                //Original function
                var result = locale.apply(this, arguments);

                //Update format
                window.latLngFormat.setTempFormat();

                return result;
            };
        }( n.locale );

    /************************************
    Constructors
    ************************************/
    // LatlngFormat prototype object
    function LatLngFormat( arg0, arg1 ){
        /*
        Possible arguments:
            ( Number )                                   => this._inputs = [ Number0, Number0 ]
            ( Number0, Number1 ), ( [Number0, Number1] ) => this._inputs = [ Number0, Number1 ]
            ( String ), ( String0, String1 ) ( [String0, String1] ) => this._inputs = String or [String0, String1] or error depending on options.twoValueMode
        */
        var inputs = null,
            inputValid = true;
        if (arg1 === undefined){
            if ($.isArray(arg0))
                inputs = arg0;
            else
                inputs = [ arg0 ];
        }
        else
            inputs = [ arg0, arg1 ];

        //Two arguments => must be same type
        inputValid = (inputs.length == 1) || (typeof inputs[0] == typeof inputs[1]);

        //Only Number or String
        if (inputValid)
            $.each( inputs, function( index, val ){
                if ((typeof val != 'number') && (typeof val != 'string'))
                    inputValid = false;
            });

        //[String, String] only when options.twoValueMode == true
        //[String] only when options.twoValueMode == false + [String] => String
        if (inputValid && (typeof inputs[0] == 'string'))
            inputValid = (inputs.length == (latLngFormat.options.twoValueMode ? 2 : 1));

        //[Number0] => [Number0, Number0], [String] => Stirng
        if (inputValid && (inputs.length == 1)){
            if (typeof inputs[0] == 'number')
                inputs.push( inputs[0] );
            else
                inputs = inputs[0];
        }

        this._inputs = inputValid ? inputs : [null, null];
        this.inputIsValid = inputValid;

       if (!this.inputIsValid && window.console && window.console.warn)
            window.console.warn('latLngFormat: Invalid arguments:', arg0, arg1);
    }

    /************************************
    LatlngFormat Prototype
    ************************************/
    latLngFormat.fn = LatLngFormat.prototype = {
        //_valueMethod = function(method, options): calls method(latLng, options, latLngFormat) with the latlng-value as input. Method returns a string or []string
        _valueMethod: function(method, opt) {
            var latLngFormat = window.latLngFormat,
                options = $.extend({}, latLngFormat.options, opt || {}),
                result;

            if (options.twoValueMode){
                result = [];
                options.latOrLng = 0;
                result.push( method.call( this, this._inputs[0], options, latLngFormat ) );
                options.latOrLng = 1;
                result.push( method.call( this, this._inputs[1], options, latLngFormat ) );
            }
            else
                result = method.call( this, this._inputs, options, latLngFormat );

            if (options.joinAsString && $.isArray(result))
                result = options.preText + result.join(options.separator) + options.postText;

            return result;
        },

        /**********************************************************
        _valid - Return true if the value is a valid position
        **********************************************************/
        _valid: function(value, options){
            options.latOrLng = options.latOrLng || 0;
            if (typeof value == 'number')
                return (value >= options.min[options.latOrLng]) && (value <= options.max[options.latOrLng]);
            else
                //The regexp is prefixed with ^(?: and suffixed with )$ to make it full-match-only.
                return (new RegExp( '^(?:' + options.regexp[options.latOrLng] + ')$' )).test(value);
        },

        //valid - Return true if the input is a valid position
        valid: function(asArray){
            var result = this._valueMethod( this._valid, {twoValueMode: true} );
            return asArray ? result : result[0] && result[1];
        },

        /**********************************************************
        _format - Converts value to a string
        **********************************************************/
        _format: function(value, options, latLngFormat){
            if (this.valid()){
                if (typeof value == 'string')
                    return value;
                return latLngFormat._callMethodFromFormatList( 'format', this, arguments );
            }
            else
                return false;
        },

        //format - Converts number value to a string, using this.displayMask or this.editMask
        format: function( options ){
            if (this.inputIsValid && this.valid()){
                options = options || {};
                options.joinAsString = !options.asArray;
                return this._valueMethod( this._format, options );
            }
            else
                return false;
        },

        //formatTrunc - Converts number value to a string, truncating any zero-values
        formatTrunc: function( options ){
            options = options || {};
            options.truncate = true;
            return this.format( options );
        },

        /**********************************************************
        _ value - Converts value (string masked as editMask) to decimal degrees.
        **********************************************************/
        _value: function(value, options, latLngFormat){
            if (typeof value != 'string')
                return false;

            return latLngFormat._callMethodFromFormatList( 'value', this, arguments );
        },

        //value - Converts value (string masked as editMask) to decimal degrees.
        value: function(){
            var result = this._valueMethod( this._value );

            //Check if both lat and lng are not false
            if ( $.isArray(result) && ((result[0] === false) || (result[1] === false)) )
                result = false;

            //Round or truncate
            if (result) {
                result[0] = window.precision(result[0], 4);
                result[1] = window.precision(result[1], 4);
            }

            return result;
        },


        //convertTo - If value is valid => convert it to newFormatId format and return it as text-string, else return false
        convertTo: function( newFormatId, options ){
            var formatId = latLngFormat.options.formatId,
                result   = this.value();

            if (result){
                latLngFormat.setTempFormat( newFormatId );
                var newLatLngFormat = latLngFormat( result );
                result = newLatLngFormat.valid() ? newLatLngFormat.format( options ) : false;
                latLngFormat.setTempFormat( formatId );
            }

            return result;
        }
    };//end of latLngFormat.fn = LatLngFormat.prototype = {


}(jQuery, this, document));