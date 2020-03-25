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
            var oldFormatId = this.options.formatId,
                oldDecimal = this.options.delimitersDecimal;
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

            if (!dontCallOnChange && ((oldFormatId != formatId) || (oldDecimal != dS)))
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
                window.latLngFormat.setFormat();

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
;
/****************************************************************************
latlng-format-degrees

Set methodes and options for format degrees, minutes, seconds


****************************************************************************/

(function ($, window/*, document, undefined*/) {
    "use strict";
    var LATLNGFORMAT_DMSS = window.latLngFormat.LATLNGFORMAT_DMSS, //Degrees Minutes Seconds Decimal Seconds: N65d30'15.3"  d='degree sign'
        LATLNGFORMAT_DMM  = window.latLngFormat.LATLNGFORMAT_DMM,  //Degrees Decimal minutes                : N65d30.258'
        LATLNGFORMAT_DD   = window.latLngFormat.LATLNGFORMAT_DD;   //Decimal degrees                        : N41.1234d

    window.latLngFormat.formatList[LATLNGFORMAT_DMSS] =
    window.latLngFormat.formatList[LATLNGFORMAT_DMM] =
    window.latLngFormat.formatList[LATLNGFORMAT_DD] = {

        /************************************
        getOptions
        ************************************/
        getOptions: function(formatId){
            /*
            Create options with editMask, convertMask, regexp, placeholder
            Regular expressions for different type of position input
            The regexp are 'build' using regexp for the sub-parts:
                H=Hemisphere        : [n,N,s,S]
                DD=Degrees          : 0-9, 00-09, 10-89
                dddd=Degrees decimal: 0-9999
                MM=Minutes          : 0-9, 00-09, 10-59
                SS=Seconds          : 0-59
                .=seperator         : blank, "." or ","
                mmm=decimal min     : 0-999
            */
            var _regexp = {
                anySpace      : '\\s*',
                hemisphereLat : '([nNsS])?',    //H=Hemisphere  : [n,N,s,S] (optional,
                hemisphereLong: '([eEwW])?',    //H=Hemisphere : [e,E,w,W] (optional,

                DD            : '((0?[0-9])|[1-8][0-9])',  //DD=Degrees 0-89        :    0-9, 00-09 or 10-89
                DDD           : '((\\d?\\d)|1[0-7][0-9])', //DDD=Degrees 0-179    :    0-9, 00-99 or 100-179

                MM            : '\\s' + '((0?[0-9])|[1-5][0-9])', //MM=Minutes: 0-9, 00-09 or 10-59 (allways with a seperator in front)
            };
            _regexp.SS        = _regexp.MM;
            _regexp.seperator = _regexp.anySpace + '[\\s\\.,]' + _regexp.anySpace; //seperator: blank, "." or ",". Allow any number of spac,

            _regexp.dddd      = '(' + _regexp.seperator + '\\d{1,4}' + ')?'; //dddd=decimal degrees (0-9999) optional

            _regexp.MMmmm     = '(' + _regexp.MM + '(' + _regexp.seperator + '\\d{1,3}' + ')?' + ')?';                           //MMmmm=Minutes and Decimal minutes = [MM[0-999]]
            _regexp.MMSSs     = '(' + _regexp.MM + '(' + _regexp.SS + '(' + _regexp.seperator + '\\d{1,1}' + ')?' + ')?' + ')?'; //MMSSss= Minutes Second and Decimal Seconds = [MM[ SS[0-99]]]

            var dS     = window.latLngFormat.options.delimitersDecimal,
                dC     = window.latLngFormat.options.degreeChar,
                result = {
                    twoValueMode: true,
                         //lat, lng
                    min: [-90, -180],
                    max: [ 90,  180]
                };

            switch (formatId){
                case LATLNGFORMAT_DMSS:
                    $.extend(result, { //Degrees Minutes Seconds (N41d25'01")
                        displayMask: "DDD"+dC+"MM'SS"+dS+"s\"H",
                        editMask   : "DDD MM SS"+dS+"sH",
                        convertMask: ['DDD', 'MM', 'SS', 's'],
                        regexp     : [ _regexp.anySpace + '(90|'  + _regexp.DD  + _regexp.anySpace + _regexp.MMSSs + ')' + _regexp.anySpace + _regexp.hemisphereLat  + _regexp.anySpace,
                                       _regexp.anySpace + '(180|' + _regexp.DDD + _regexp.anySpace + _regexp.MMSSs + ')' + _regexp.anySpace + _regexp.hemisphereLong + _regexp.anySpace  ],
                        placeholder: ["89 59 59"+dS+"9N", "179 59 59"+dS+"9E"],
                    });
                    break;

                case LATLNGFORMAT_DMM:
                    $.extend(result, { //Degrees Decimal minutes (N41d25.123')
                        displayMask: "DDD"+dC+"MM"+dS+"mmm'H",
                        editMask   : "DDD MM"+dS+"mmmH",
                        convertMask: ['DDD', 'MM', 'mmm'],
                        regexp     : [ _regexp.anySpace + '(90|'  + _regexp.DD  + _regexp.anySpace + _regexp.MMmmm + ')' + _regexp.anySpace + _regexp.hemisphereLat  + _regexp.anySpace,
                                       _regexp.anySpace + '(180|' + _regexp.DDD + _regexp.anySpace + _regexp.MMmmm + ')' + _regexp.anySpace + _regexp.hemisphereLong + _regexp.anySpace  ],
                        placeholder: ["89 59"+dS+"999N", "179 59"+dS+"999E"],
                    });
                    break;

                case LATLNGFORMAT_DD:
                    $.extend(result, { //Decimal degrees (N41.1234d)
                        displayMask: "DDD"+dS+"dddd"+dC+"H",
                        editMask   : "DDD"+dS+"ddddH",
                        convertMask: ['DDD', 'dddd'],
                        regexp     : [ _regexp.anySpace + '(90|'  + _regexp.DD  + _regexp.anySpace + _regexp.dddd + ')' + _regexp.anySpace + _regexp.hemisphereLat  + _regexp.anySpace,
                                       _regexp.anySpace + '(180|' + _regexp.DDD + _regexp.anySpace + _regexp.dddd + ')' + _regexp.anySpace + _regexp.hemisphereLong + _regexp.anySpace  ],
                        placeholder: ["89.9999N", "179.9999E"],
                    });
                    break;
            }
            return result;
        },

        /************************************
        format
        ************************************/
        format: function(value, options, latLngFormat){
            function trim(value, lgd, inclZero){
                var result = ''+value;
                if (options.truncate){
                    if (value == 0)
                        result = inclZero ? '0' : '';
                }
                else
                    while (result.length < lgd)
                        result = '0'+result;
                return result;
            }
            function appendDecimals(value, lgd){
                var result = ''+value;
                //Convert from "100" to "0100" (length: 4)
                while (result.length < lgd)
                    result = '0'+result;

                //Remove tailing zero
                if (options.truncate)
                    result = result.replace( /0*$/g, '');

                //Prepend decimal delimiters
                return result ? options.delimitersDecimal+result : result;
            }

            var parts = latLngFormat.split(value),
                result = (options.useEditMask ? options.editMask : options.displayMask)
                            .replace('H', options.latOrLng ?
                                            (parts.hemisphere == 1 ? 'E' : 'W') :
                                            (parts.hemisphere == 1 ? 'N' : 'S')
                            )
                            .replace( options.delimitersDecimal, ''); //delimitersDecimal is added in appendDecimals if not truncate and decimal > 0

            result = result.replace(/DDD/ , parts.degrees                   );
            result = result.replace(/dddd/, appendDecimals(parts.degreesDecimal, 4) );
            result = result.replace(/MM/  , trim(parts.minutes, 2, parts.minutesDecimal) );
            result = result.replace(/mmm/ , appendDecimals(parts.minutesDecimal, 3) );
            result = result.replace(/SS/  , trim(parts.seconds, 2, parts.secondsDecimal) );
            result = result.replace(/s/   , appendDecimals(parts.secondsDecimal,   1) );


            if (options.truncate){
                /*
                Remove sign for minute (') and seconds (") without pending digital
                Using regExp result = result.replace( /(?<!\d)[\'\"]/g, ''); works but JavaScript do not support 'before': < so
                a workaround is used
                */
                var i = 1;
                while (i < result.length)
                    if ( ((result.charAt(i) == '"') || (result.charAt(i) == "'")) &&
                         !$.isNumeric(result.charAt(i-1))
                       )
                        result = result.slice(0,i) + result.slice(i+1);
                    else
                        i++;
            }

            return result;
        },

        /************************************
        value
        Using convertMask to convert the different part of the text. Any space is ignored
        ************************************/
        value: function(value, options/*, latLngFormat*/){
            //toDecimal - Convert a integer value v to a decimal. Eq    toDecimal(89)    = 0.89, toDecimal(9) = 0.9, toDecimal(1234)    = 0.1234
            function toDecimal(v) {
                var l = v.toString().length;
                return v / Math.pow(10, l);
            }

            value = value.toUpperCase().trim();

            //Convert N or E to +1 and S or W to -1
            var sign = 1;
            if ( (value.indexOf('S') > -1) || (value.indexOf('W') > -1) )
                sign = -1;

            //Remove all no-digital charts
            value = value.replace(/\D+/g, ' ');
            if ((value === '') || !this._valid(value, options))
                return false;

            var split = value.split(/\D/),
                result = 0,
                convertMaskIndex = 0,
                i, nextValue;
            for (i=0; i<split.length; i++ ){
                nextValue = parseInt(split[i]);
                if (!isNaN(nextValue)){
                    switch (options.convertMask[convertMaskIndex]){
                        case 'DDD' : result = result + nextValue;                 break;
                        case 'MM'  : result = result + nextValue/60;              break;
                        case 'mmm' : result = result + toDecimal(nextValue)/60;   break;
                        case 's'   : result = result + toDecimal(nextValue)/3600; break;
                        case 'SS'  : result = result + nextValue/3600;            break;
                        case 'dddd': result = result + toDecimal(nextValue);      break;
                    }
                    convertMaskIndex++;
                    if (convertMaskIndex >= options.convertMask.length)
                        break;
                }
            }
            return sign*result;
        }

    }; //end of window.latLngFormat.formatList[...] =

    //Set LATLNGFORMAT_DMSS as default
    if (!window.latLngFormat.options.formatId)
        window.latLngFormat.setFormat(LATLNGFORMAT_DMSS);

}(jQuery, this, document));
;
/****************************************************************************
latlng-format-nac

Set methodes and options for format nac

Using the methods
from  https://github.com/PowerPan/leaflet.mouseCoordinate
by "Johannes Rudolph johannes.rudolph@gmx.com

****************************************************************************/

(function ($, window/*, document, undefined*/) {
    "use strict";

    /**
    * Created by Johannes Rudolph <johannes.rudolph@gmx.com> on 01.09.2016.
    */

    /**
    *
    * @type {{fromLatLng: NAC.fromLatLng, _nac2Letter: NAC._nac2Letter}}
    */
    var NAC = {

        /**
        *
        * @param {{lat: number, lng: number}}
        * @returns {string}
        */
        fromLatLng: function(latlng) {
            var lat = latlng.lat;
            var lon = latlng.lng;
            var x = [];
            var y = [];
            var xy = [];
            xy.x = '';
            xy.y = '';
            if (lon >= -180 && lon <= 180) {
                var xlon = (lon + 180) / 360;
                x = this._calcValues(xlon);
            } else {
                x[0] = 0;
            }
            if (lat >= -90 && lat <= 90) {
                var ylat = (lat + 90) / 180;
                y = this._calcValues(ylat);
            } else {
                y[0] = 0;
            }
            for (var i = 0; i < x.length; i++) {
                xy.x += this._nac2Letter(x[i]);
            }
            for (i = 0; i < y.length; i++) {
                xy.y += this._nac2Letter(y[i]);
            }
            return xy;
        },

        /**
        *
        * @param z
        * @returns {Array}
        * @private
        */
        _calcValues: function (z){
            var ret = [];
            ret[0] = parseInt(z * 30,10);
            ret[1] = parseInt((z * 30 - ret[0]) * 30,10);
            ret[2] = parseInt(((z * 30 - ret[0]) * 30 - ret[1]) * 30,10);
            ret[3] = parseInt((((z * 30 - ret[0]) * 30 - ret[1]) * 30 - ret[2]) * 30,10);
            ret[4] = parseInt(((((z * 30 - ret[0]) * 30 - ret[1]) * 30 - ret[2]) * 30 - ret[3]) * 30,10);
            ret[5] = parseInt((((((z * 30 - ret[0]) * 30 - ret[1]) * 30 - ret[2]) * 30 - ret[3]) * 30 - ret[4]) * 30,10);
            return ret;
        },

        /**
        *
        * @param number
        * @returns {string}
        * @private
        */
        _nac2Letter: function(number){
            var nac_letters = "0123456789BCDFGHJKLMNPQRSTVWXZ";
            if(!isNaN(number) && number < 30)
                return nac_letters.substr(number,1);
            else return 0;
        }
    };


    /************************************************************************************
    ************************************************************************************/
    window.latLngFormat.formatList[window.latLngFormat.LATLNGFORMAT_NAC] = {

        /************************************
        getOptions
        ************************************/
        getOptions: function( /*formatId*/ ){
            var zeroOrMoreSpace = '\\s*',
                oneOrMoreSpace  = '\\s+',
                nacChars        = '[0123456789BCDFGHJKLMNPQRSTVWXZ]{2,6}';
            return {
                twoValueMode: false,
                    //lat, lng
                min: [-90, -180],
                max: [ 90,  180],

                displayMask : "",
                editMask    : "",
                regexp      : zeroOrMoreSpace + nacChars + oneOrMoreSpace + nacChars + zeroOrMoreSpace,
                placeholder : "J0Z8B S8NRP",
           };
        },

        /************************************
        format
        ************************************/
        format: function(value/*, options, latLngFormat*/){
            var result = NAC.fromLatLng({lat:value[0], lng:value[1]});
            return [result.x, result.y];
        },

        /************************************
        value
        Convert "0VJZTG S5LFGZ" to lat-lng
        ************************************/
        value: function(value, options/*, latLngFormat*/){
            if (!this._valid(value, options))
                return false;

            //Trim and remove multi space
            value = value.toUpperCase().trim();
            value = value.replace(/\s{2,}/g, ' ');

            var nacLetters = "0123456789BCDFGHJKLMNPQRSTVWXZ",
                valueList = value.split(' '),
                result = {};

            /*
            First, convert all characters X1, X2, X3, X4, ... Y1, Y2, Y3, Y4, ... Z1, Z2, Z3, Z4, ... into integers x1, x2, x3, x4, ... y1, y2, y3, y4, ... z1, z2, z3, z4, ... according to the Table of the NAC Character and Integer Correspondences.
            Then use the following formulae to calculate coordinates:

            Longitude = (x1/30+x2/30^2+x3/30^3+x4/30^4+...)*360-180
            Latitude =  (y1/30+y2/30^2+y3/30^3+y4/30^4+...)*180-90

            */
            $.each(valueList, function(index, str){
                var charList = str.split(''),
                    coor     = 0,
                    factor   = 30;

                $.each(charList, function(index, letter){
                    coor = coor + nacLetters.indexOf(letter)/factor;
                    factor = 30*factor;
                });

                if (index)
                    result.lat = coor*180 - 90;
                else
                    result.lng = coor*360 - 180;

            });

            return [result.lat, result.lng];
        }

    }; //end of window.latLngFormat.formatList[...] =

}(jQuery, this, document));
;
/****************************************************************************
latlng-format-proj4js-mgrs

Set methodes and options for format mgrs
using a ES5-version of https://github.com/proj4js/mgrs

****************************************************************************/


(function ($, window/*, document, undefined*/) {
    "use strict";

    /**
     * UTM zones are grouped, and assigned to one of a group of 6
     * sets.
     *
     * {int} @private
     */
    var NUM_100K_SETS = 6;

    /**
     * The column letters (for easting) of the lower left value, per
     * set.
 *
     * {string} @private
 */
    var SET_ORIGIN_COLUMN_LETTERS = 'AJSAJS';

    /**
    * The row letters (for northing) of the lower left value, per
    * set.
    *
    * {string} @private
    */
    var SET_ORIGIN_ROW_LETTERS = 'AFAFAF';

    var A = 65; // A
    var I = 73; // I
    var O = 79; // O
    var V = 86; // V
    var Z = 90; // Z

    /**
     * Conversion from degrees to radians.
     *
     * @private
     * @param {number} deg the angle in degrees.
     * @return {number} the angle in radians.
     */
    function degToRad(deg) {
        return (deg * (Math.PI / 180.0));
    }

    /**
     * Conversion from radians to degrees.
     *
     * @private
     * @param {number} rad the angle in radians.
     * @return {number} the angle in degrees.
     */
    function radToDeg(rad) {
        return (180.0 * (rad / Math.PI));
    }

    /**
    * Calculates the MGRS letter designator for the given latitude.
    *
    * @private
    * @param {number} lat The latitude in WGS84 to get the letter designator
    *     for.
    * @return {char} The letter designator.
    */
    function getLetterDesignator(lat) {
        //This is here as an error flag to show that the Latitude is
        //outside MGRS limits
        var LetterDesignator = 'Z';

        if ((84 >= lat) && (lat >= 72)) {
            LetterDesignator = 'X';
        }
        else if ((72 > lat) && (lat >= 64)) {
            LetterDesignator = 'W';
        }
        else if ((64 > lat) && (lat >= 56)) {
            LetterDesignator = 'V';
        }
        else if ((56 > lat) && (lat >= 48)) {
            LetterDesignator = 'U';
        }
        else if ((48 > lat) && (lat >= 40)) {
            LetterDesignator = 'T';
        }
        else if ((40 > lat) && (lat >= 32)) {
            LetterDesignator = 'S';
        }
        else if ((32 > lat) && (lat >= 24)) {
            LetterDesignator = 'R';
        }
        else if ((24 > lat) && (lat >= 16)) {
            LetterDesignator = 'Q';
        }
        else if ((16 > lat) && (lat >= 8)) {
            LetterDesignator = 'P';
        }
        else if ((8 > lat) && (lat >= 0)) {
            LetterDesignator = 'N';
        }
        else if ((0 > lat) && (lat >= -8)) {
            LetterDesignator = 'M';
        }
        else if ((-8 > lat) && (lat >= -16)) {
            LetterDesignator = 'L';
        }
        else if ((-16 > lat) && (lat >= -24)) {
            LetterDesignator = 'K';
        }
        else if ((-24 > lat) && (lat >= -32)) {
            LetterDesignator = 'J';
        }
        else if ((-32 > lat) && (lat >= -40)) {
            LetterDesignator = 'H';
        }
        else if ((-40 > lat) && (lat >= -48)) {
            LetterDesignator = 'G';
        }
        else if ((-48 > lat) && (lat >= -56)) {
            LetterDesignator = 'F';
        }
        else if ((-56 > lat) && (lat >= -64)) {
            LetterDesignator = 'E';
        }
        else if ((-64 > lat) && (lat >= -72)) {
            LetterDesignator = 'D';
        }
        else if ((-72 > lat) && (lat >= -80)) {
            LetterDesignator = 'C';
        }
        return LetterDesignator;
    }

    /**
    * Encodes a UTM location as MGRS string.
    *
    * @private
    * @param {object} utm An object literal with easting, northing,
    *     zoneLetter, zoneNumber
    * @param {number} accuracy Accuracy in digits (1-5).
    * @return {string} MGRS string for the given UTM location.
    */
    function encode(utm, accuracy) {
        // prepend with leading zeroes
        var seasting = "00000" + utm.easting,
            snorthing = "00000" + utm.northing;
        return utm.zoneNumber + utm.zoneLetter + get100kID(utm.easting, utm.northing, utm.zoneNumber) + seasting.substr(seasting.length - 5, accuracy) + snorthing.substr(snorthing.length - 5, accuracy);
    }

    /**
    * Get the two letter 100k designator for a given UTM easting,
    *  northing and zone number value.
    *
    * @private
    * @param {number} easting
    * @param {number} northing
    * @param {number} zoneNumber
    * @return the two letter 100k designator for the given UTM location.
    */
    function get100kID(easting, northing, zoneNumber) {
        var setParm = get100kSetForZone(zoneNumber);
        var setColumn = Math.floor(easting / 100000);
        var setRow = Math.floor(northing / 100000) % 20;
        return getLetter100kID(setColumn, setRow, setParm);
    }

    /**
    * Given a UTM zone number, figure out the MGRS 100K set it is in.
    *
    * @private
    * @param {number} i An UTM zone number.
    * @return {number} the 100k set the UTM zone is in.
    */
    function get100kSetForZone(i) {
        var setParm = i % NUM_100K_SETS;
        if (setParm === 0) {
            setParm = NUM_100K_SETS;
        }
        return setParm;
    }

    /**
    * Get the two-letter MGRS 100k designator given information
    * translated from the UTM northing, easting and zone number.
    *
    * @private
    * @param {number} column the column index as it relates to the MGRS
    *        100k set spreadsheet, created from the UTM easting.
    *        Values are 1-8.
    * @param {number} row the row index as it relates to the MGRS 100k set
    *        spreadsheet, created from the UTM northing value. Values
    *        are from 0-19.
    * @param {number} parm the set block, as it relates to the MGRS 100k set
    *        spreadsheet, created from the UTM zone. Values are from
    *        1-60.
    * @return two letter MGRS 100k code.
    */
    function getLetter100kID(column, row, parm) {
        // colOrigin and rowOrigin are the letters at the origin of the set
        var index = parm - 1;
        var colOrigin = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(index);
        var rowOrigin = SET_ORIGIN_ROW_LETTERS.charCodeAt(index);

        // colInt and rowInt are the letters to build to return
        var colInt = colOrigin + column - 1;
        var rowInt = rowOrigin + row;
        var rollover = false;

        if (colInt > Z) {
            colInt = colInt - Z + A - 1;
            rollover = true;
        }

        if (colInt === I || (colOrigin < I && colInt > I) || ((colInt > I || colOrigin < I) && rollover)) {
            colInt++;
        }

        if (colInt === O || (colOrigin < O && colInt > O) || ((colInt > O || colOrigin < O) && rollover)) {
            colInt++;

            if (colInt === I) {
                colInt++;
            }
        }

        if (colInt > Z) {
            colInt = colInt - Z + A - 1;
        }

        if (rowInt > V) {
            rowInt = rowInt - V + A - 1;
            rollover = true;
        }
        else {
            rollover = false;
        }

        if (((rowInt === I) || ((rowOrigin < I) && (rowInt > I))) || (((rowInt > I) || (rowOrigin < I)) && rollover)) {
            rowInt++;
        }

        if (((rowInt === O) || ((rowOrigin < O) && (rowInt > O))) || (((rowInt > O) || (rowOrigin < O)) && rollover)) {
            rowInt++;

            if (rowInt === I) {
                rowInt++;
            }
        }

        if (rowInt > V) {
            rowInt = rowInt - V + A - 1;
        }

        var twoLetter = String.fromCharCode(colInt) + String.fromCharCode(rowInt);
        return twoLetter;
    }

    /**
    * Decode the UTM parameters from a MGRS string.
    *
    * @private
    * @param {string} mgrsString an UPPERCASE coordinate string is expected.
    * @return {object} An object literal with easting, northing, zoneLetter,
    *     zoneNumber and accuracy (in meters) properties.
    */
    function decode(mgrsString) {

        if (mgrsString && mgrsString.length === 0) {
            throw ("MGRSPoint coverting from nothing");
        }

        var length = mgrsString.length;

          var hunK = null;
        var sb = "";
        var testChar;
        var i = 0;

          // get Zone number
        while (!(/[A-Z]/).test(testChar = mgrsString.charAt(i))) {
            if (i >= 2) {
            throw ("MGRSPoint bad conversion from: " + mgrsString);
            }
            sb += testChar;
            i++;
        }

          var zoneNumber = parseInt(sb, 10);

          if (i === 0 || i + 3 > length) {
            // A good MGRS string has to be 4-5 digits long,
            // ##AAA/#AAA at least.
            throw ("MGRSPoint bad conversion from: " + mgrsString);
        }

        var zoneLetter = mgrsString.charAt(i++);

        // Should we check the zone letter here? Why not.
        if (zoneLetter <= 'A' || zoneLetter === 'B' || zoneLetter === 'Y' || zoneLetter >= 'Z' || zoneLetter === 'I' || zoneLetter === 'O') {
            throw ("MGRSPoint zone letter " + zoneLetter + " not handled: " + mgrsString);
        }

        hunK = mgrsString.substring(i, i += 2);

        var set = get100kSetForZone(zoneNumber);

        var east100k = getEastingFromChar(hunK.charAt(0), set);
        var north100k = getNorthingFromChar(hunK.charAt(1), set);

        // We have a bug where the northing may be 2000000 too low.
        // How
        // do we know when to roll over?

        while (north100k < getMinNorthing(zoneLetter)) {
            north100k += 2000000;
        }

        // calculate the char index for easting/northing separator
        var remainder = length - i;

        if (remainder % 2 !== 0) {
            throw ("MGRSPoint has to have an even number \nof digits after the zone letter and two 100km letters - front \nhalf for easting meters, second half for \nnorthing meters" + mgrsString);
        }

        var sep = remainder / 2;

        var sepEasting = 0.0;
        var sepNorthing = 0.0;
        var accuracyBonus, sepEastingString, sepNorthingString, easting, northing;
        if (sep > 0) {
            accuracyBonus = 100000.0 / Math.pow(10, sep);
            sepEastingString = mgrsString.substring(i, i + sep);
            sepEasting = parseFloat(sepEastingString) * accuracyBonus;
            sepNorthingString = mgrsString.substring(i + sep);
            sepNorthing = parseFloat(sepNorthingString) * accuracyBonus;
        }

        easting = sepEasting + east100k;
        northing = sepNorthing + north100k;

        return {
            easting: easting,
            northing: northing,
            zoneLetter: zoneLetter,
            zoneNumber: zoneNumber,
            accuracy: accuracyBonus
        };
    }

    /**
    * Given the first letter from a two-letter MGRS 100k zone, and given the
    * MGRS table set for the zone number, figure out the easting value that
   * should be added to the other, secondary easting value.
    *
    * @private
    * @param {char} e The first letter from a two-letter MGRS 100´k zone.
    * @param {number} set The MGRS table set for the zone number.
    * @return {number} The easting value for the given letter and set.
    */
    function getEastingFromChar(e, set) {
        // colOrigin is the letter at the origin of the set for the
        // column
        var curCol = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(set - 1);
        var eastingValue = 100000.0;
        var rewindMarker = false;

        while (curCol !== e.charCodeAt(0)) {
            curCol++;
            if (curCol === I) {
                curCol++;
            }
            if (curCol === O) {
                curCol++;
            }
            if (curCol > Z) {
                if (rewindMarker) {
                    throw ("Bad character: " + e);
                }
                curCol = A;
                rewindMarker = true;
            }
            eastingValue += 100000.0;
        }

        return eastingValue;
    }

    /**
    * Given the second letter from a two-letter MGRS 100k zone, and given the
    * MGRS table set for the zone number, figure out the northing value that
    * should be added to the other, secondary northing value. You have to
    * remember that Northings are determined from the equator, and the vertical
    * cycle of letters mean a 2000000 additional northing meters. This happens
    * approx. every 18 degrees of latitude. This method does *NOT* count any
    * additional northings. You have to figure out how many 2000000 meters need
    * to be added for the zone letter of the MGRS coordinate.
    *
    * @private
    * @param {char} n Second letter of the MGRS 100k zone
    * @param {number} set The MGRS table set number, which is dependent on the
    *     UTM zone number.
    * @return {number} The northing value for the given letter and set.
    */
    function getNorthingFromChar(n, set) {
        if (n > 'V') {
            throw ("MGRSPoint given invalid Northing " + n);
        }

        // rowOrigin is the letter at the origin of the set for the
        // column
        var curRow = SET_ORIGIN_ROW_LETTERS.charCodeAt(set - 1);
        var northingValue = 0.0;
        var rewindMarker = false;

        while (curRow !== n.charCodeAt(0)) {
            curRow++;
            if (curRow === I) {
                curRow++;
            }
            if (curRow === O) {
                curRow++;
            }
            // fixing a bug making whole application hang in this loop
            // when 'n' is a wrong character
            if (curRow > V) {
                if (rewindMarker) { // making sure that this loop ends
                    throw ("Bad character: " + n);
                }
                curRow = A;
                rewindMarker = true;
            }
            northingValue += 100000.0;
        }

        return northingValue;
    }

    /**
    * The function getMinNorthing returns the minimum northing value of a MGRS
    * zone.
    *
    * Ported from Geotrans' c Lattitude_Band_Value structure table.
    *
    * @private
    * @param {char} zoneLetter The MGRS zone to get the min northing for.
    * @return {number}
    */
    function getMinNorthing(zoneLetter) {
        var northing;
        switch (zoneLetter) {
            case 'C': northing = 1100000.0; break;
            case 'D': northing = 2000000.0; break;
            case 'E': northing = 2800000.0; break;
            case 'F': northing = 3700000.0; break;
            case 'G': northing = 4600000.0; break;
            case 'H': northing = 5500000.0; break;
            case 'J': northing = 6400000.0; break;
            case 'K': northing = 7300000.0; break;
            case 'L': northing = 8200000.0; break;
            case 'M': northing = 9100000.0; break;
            case 'N': northing = 0.0; break;
            case 'P': northing = 800000.0; break;
            case 'Q': northing = 1700000.0; break;
            case 'R': northing = 2600000.0; break;
            case 'S': northing = 3500000.0; break;
            case 'T': northing = 4400000.0; break;
            case 'U': northing = 5300000.0; break;
            case 'V': northing = 6200000.0; break;
            case 'W': northing = 7000000.0; break;
            case 'X': northing = 7900000.0; break;
            default: northing = -1.0;
        }
        if (northing >= 0.0) {
            return northing;
        }
        else {
            throw ("Invalid zone letter: " + zoneLetter);
        }
    }

    /**
    * Converts a set of Longitude and Latitude co-ordinates to UTM
    * using the WGS84 ellipsoid.
    *
    * @private
    * @param {object} ll Object literal with lat and lon properties
    *     representing the WGS84 coordinate to be converted.
    * @param {boolean} truncate When true the result is truncated.
    * @return {object} Object literal containing the UTM value with easting,
    *     northing, zoneNumber and zoneLetter properties, and an optional
    *     accuracy property in digits. Returns null if the conversion failed.
    */
    function LLtoUTM(ll, truncate) {
        var Lat = ll.lat;
        var Long = ll.lon;
        var a = 6378137.0; //ellip.radius;
        var eccSquared = 0.00669438; //ellip.eccsq;
        var k0 = 0.9996;
        var LongOrigin;
        var eccPrimeSquared;
        var N, T, C, A, M;
        var LatRad = degToRad(Lat);
        var LongRad = degToRad(Long);
        var LongOriginRad;
        var ZoneNumber;
        // (int)
        ZoneNumber = Math.floor((Long + 180) / 6) + 1;

        //Make sure the longitude 180.00 is in Zone 60
        if (Long === 180) {
            ZoneNumber = 60;
        }

        // Special zone for Norway
        if (Lat >= 56.0 && Lat < 64.0 && Long >= 3.0 && Long < 12.0) {
            ZoneNumber = 32;
        }

        // Special zones for Svalbard
        if (Lat >= 72.0 && Lat < 84.0) {
            if (Long >= 0.0 && Long < 9.0) {
                ZoneNumber = 31;
            }
            else if (Long >= 9.0 && Long < 21.0) {
                ZoneNumber = 33;
            }
            else if (Long >= 21.0 && Long < 33.0) {
                ZoneNumber = 35;
            }
            else if (Long >= 33.0 && Long < 42.0) {
                ZoneNumber = 37;
            }
        }

        LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3; //+3 puts origin
        // in middle of
        // zone
        LongOriginRad = degToRad(LongOrigin);

        eccPrimeSquared = (eccSquared) / (1 - eccSquared);

        N = a / Math.sqrt(1 - eccSquared * Math.sin(LatRad) * Math.sin(LatRad));
        T = Math.tan(LatRad) * Math.tan(LatRad);
        C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad);
        A = Math.cos(LatRad) * (LongRad - LongOriginRad);

        M = a * ((1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256) * LatRad - (3 * eccSquared / 8 + 3 * eccSquared * eccSquared / 32 + 45 * eccSquared * eccSquared * eccSquared / 1024) * Math.sin(2 * LatRad) + (15 * eccSquared * eccSquared / 256 + 45 * eccSquared * eccSquared * eccSquared / 1024) * Math.sin(4 * LatRad) - (35 * eccSquared * eccSquared * eccSquared / 3072) * Math.sin(6 * LatRad));

        var UTMEasting = (k0 * N * (A + (1 - T + C) * A * A * A / 6.0 + (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A * A * A / 120.0) + 500000.0);

        var UTMNorthing = (k0 * (M + N * Math.tan(LatRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24.0 + (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A / 720.0)));
        if (Lat < 0.0) {
            UTMNorthing += 10000000.0; //10000000 meter offset for
            // southern hemisphere
        }

        return {
            northing: truncate ? Math.floor(UTMNorthing) : Math.round(UTMNorthing),
            easting : truncate ? Math.floor(UTMEasting)  : Math.round(UTMEasting),
            zoneNumber: ZoneNumber,
            zoneLetter: getLetterDesignator(Lat)
        };
    }

    /**
    * Converts UTM coords to lat/long, using the WGS84 ellipsoid. This is a convenience
    * class where the Zone can be specified as a single string eg."60N" which
    * is then broken down into the ZoneNumber and ZoneLetter.
    *
    * @private
    * @param {object} utm An object literal with northing, easting, zoneNumber
    *     and zoneLetter properties. If an optional accuracy property is
    *     provided (in meters), a bounding box will be returned instead of
    *     latitude and longitude.
    * @return {object} An object literal containing either lat and lon values
    *     (if no accuracy was provided), or top, right, bottom and left values
    *     for the bounding box calculated according to the provided accuracy.
    *     Returns null if the conversion failed.
    */
    function UTMtoLL(utm) {
        var UTMNorthing = utm.northing;
        var UTMEasting = utm.easting;
        var zoneLetter = utm.zoneLetter;
        var zoneNumber = utm.zoneNumber;
        // check the ZoneNummber is valid
        if (zoneNumber < 0 || zoneNumber > 60) {
            return null;
        }

        var k0 = 0.9996;
        var a = 6378137.0; //ellip.radius;
        var eccSquared = 0.00669438; //ellip.eccsq;
        var eccPrimeSquared;
        var e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
        var N1, T1, C1, R1, D, M;
        var LongOrigin;
        var mu, phi1Rad;

        // remove 500,000 meter offset for longitude
        var x = UTMEasting - 500000.0;
        var y = UTMNorthing;

        // We must know somehow if we are in the Northern or Southern
        // hemisphere, this is the only time we use the letter So even
        // if the Zone letter isn't exactly correct it should indicate
        // the hemisphere correctly
        if (zoneLetter < 'N') {
            y -= 10000000.0; // remove 10,000,000 meter offset used
            // for southern hemisphere
        }

        // There are 60 zones with zone 1 being at West -180 to -174
        LongOrigin = (zoneNumber - 1) * 6 - 180 + 3; // +3 puts origin
        // in middle of
        // zone

        eccPrimeSquared = (eccSquared) / (1 - eccSquared);

        M = y / k0;
        mu = M / (a * (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256));

        phi1Rad = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu) + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu);
        // double phi1 = ProjMath.radToDeg(phi1Rad);

        N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
        T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
        C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
        R1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
        D = x / (N1 * k0);

        var lat = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * D * D * D * D / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * D * D * D * D * D * D / 720);
        lat = radToDeg(lat);

        var lon = (D - (1 + 2 * T1 + C1) * D * D * D / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * D * D * D * D * D / 120) / Math.cos(phi1Rad);
        lon = LongOrigin + radToDeg(lon);

        var result;
        if (utm.accuracy) {
            var topRight = MGRS.UTMtoLL({
                    northing: utm.northing + utm.accuracy,
                    easting: utm.easting + utm.accuracy,
                    zoneLetter: utm.zoneLetter,
                    zoneNumber: utm.zoneNumber
                });
            result = {
                top: topRight.lat,
                right: topRight.lon,
                bottom: lat,
                left: lon
            };
        }
        else {
            result = {
                lat: lat,
                lon: lon
            };
        }
        return result;
    }


    /************************************************************************************
    MGRS
    ************************************************************************************/
    var MGRS = {
        /**
             * Conversion of lat/lon to MGRS.
         *
         * @param {object} ll Object literal with lat and lon properties on a
         *     WGS84 ellipsoid.
         * @param {int} accuracy Accuracy in digits (5 for 1 m, 4 for 10 m, 3 for
         *      100 m, 2 for 1000 m or 1 for 10000 m). Optional, default is 5.
         * @return {string} the MGRS string for the given location and accuracy.
         */
        forward: function(ll, accuracy) {
            accuracy = accuracy || 5; // default accuracy 1m
            return encode(MGRS.LLtoUTM({
                lat: ll[0], //Changed by Niels Holt
                lon: ll[1]  //Changed by Niels Holt
            }, true), accuracy);
        },

        /**
         * Conversion of MGRS to lat/lon.
         *
         * @param {string} mgrs MGRS string.
         * @return {array} An array with left (longitude), bottom (latitude), right
         *     (longitude) and top (latitude) values in WGS84, representing the
         *     bounding box for the provided MGRS reference.
         */
        inverse: function(mgrs) {
            var bbox = UTMtoLL(decode(mgrs.toUpperCase()));
            if (bbox.lat && bbox.lon) {
                return [bbox.lon, bbox.lat, bbox.lon, bbox.lat];
            }
            return [bbox.left, bbox.bottom, bbox.right, bbox.top];
        },

        toPoint: function(mgrs) {
            var bbox = MGRS.UTMtoLL(decode(mgrs.toUpperCase()));
            if (bbox.lat && bbox.lon) {
                return [bbox.lon, bbox.lat];
            }
            //Changed from lng, lat to lat,lng by Niels Holt
            //return [(bbox.left + bbox.right) / 2, (bbox.top + bbox.bottom) / 2];
            return [(bbox.top + bbox.bottom) / 2 , (bbox.left + bbox.right) / 2];
        },

        LLtoUTM: LLtoUTM,
        UTMtoLL: UTMtoLL
    };



    /************************************************************************************
    ************************************************************************************/
    window.latLngFormat.formatList[window.latLngFormat.LATLNGFORMAT_MGRS] = {

        /************************************
        MGRS - the object doing the calculation
        ************************************/
        MGRS: MGRS,

        /************************************
        getOptions
        See https://www.usna.edu/Users/oceano/pguth/md_help/html/mgrs_utm.htm for format
        ************************************/
        getOptions: function( /*formatId*/ ){
            var zeroOrMoreSpace = '\\s*',
                c2xNoIorO       = '[CDEFGHJKLMNPQRSTUVWX]', //C-X without I and O
                a2zNoIorO       = '[ABCDEFGHJKLMNPQRSTUVWXYZ]', //A-Z without I and O
                regexp          =
                    zeroOrMoreSpace +
                    '(0?[1-9]|[1-5][0-9]|60)' + //[0]1-9 or 10-59 or 60
                    zeroOrMoreSpace +
                    c2xNoIorO +
                    zeroOrMoreSpace +
                    a2zNoIorO +
                    zeroOrMoreSpace +
                    a2zNoIorO +
                    zeroOrMoreSpace;

            //2, 4, 6, 8 or 10 digits with optional space in the middle
            regexp = regexp + '(';
            for (var digits=1; digits<=5; digits++){
                if (digits>1)
                    regexp += '|';
                regexp += '\\d{' + digits + '}' + zeroOrMoreSpace + '\\d{' + digits + '}';
            }
            regexp = regexp + ')' + zeroOrMoreSpace;

            return {
                twoValueMode: false,
                     //lat, lng
                min: [-80, -180],
                max: [ 84,  180],

                displayMask : "",
                editMask    : "",
                regexp      : regexp,
                placeholder : "48NCD 12345 12345",
           };
        },

        /************************************
        format
        ************************************/
        format: function(value/*, options, latLngFormat*/){

            // prepend with leading zeroes
            var utm = MGRS.LLtoUTM({lat: value[0], lon: value[1]}, true),
                accuracy  = 5,
                zoneNumber = ''+utm.zoneNumber,
                seasting  = "00000" + utm.easting,
                snorthing = "00000" + utm.northing,
                result = [
                    (zoneNumber.length < 2  ? '0'+zoneNumber : zoneNumber) + utm.zoneLetter + get100kID(utm.easting, utm.northing, utm.zoneNumber),
                    seasting.substr(seasting.length - 5, accuracy),
                    snorthing.substr(snorthing.length - 5, accuracy)
                ];
            return result;
        },

        /************************************
        value
        Convert "33I UB 36257 11489" to lat-lng
        ************************************/
        value: function(value, options/*, latLngFormat*/){
            if (!this._valid(value, options))
                return false;

            //Remove ALL space => value = "33IUB3625711489"
            value = value.toUpperCase().trim();
            value = value.replace(/\s/g, '');

            //If one digit zone without leading zero => add leading zero
            if ( (new RegExp('^\\d?\\D')).test(value))
                value = '0'+value;

            return MGRS.toPoint(value);
        }

    }; //end of window.latLngFormat.formatList[...] =
}(jQuery, this, document));
;
/****************************************************************************
latlng-format-utm

Set methodes and options for format utm


****************************************************************************/

(function ($, window/*, document, undefined*/) {
    "use strict";

    window.latLngFormat.formatList[window.latLngFormat.LATLNGFORMAT_UTM] = {

        /************************************
        getOptions
        ************************************/
        getOptions: function( /*formatId*/ ){
            var zeroOrMoreSpace = '\\s*',
                oneOrMoreSpace  = '\\s+',
                onToSevenDigits = '\\d{1,7}',
                regexp          =
                    zeroOrMoreSpace +
                    '(0?[1-9]|[1-5][0-9]|60)' + //[0]1-9 or 10-59 or 60
                    zeroOrMoreSpace +
                    '[CDEFGHJKLMNPQRSTUVWX]' + //C-X without I and O
                    oneOrMoreSpace +
                    onToSevenDigits +
                    oneOrMoreSpace +
                    onToSevenDigits +
                    zeroOrMoreSpace;

                //(0?[1-9]|[1-5][0-9]|60)\s*[CDEFGHJKLMNPQRSTUVWXX]\s+\d{7}\s+\d{7}\s*

            return {
                twoValueMode: false,
                     //lat, lng
                min: [-80, -180],
                max: [ 84,  180],

                displayMask : "",
                editMask    : "",
                regexp      : regexp,
                placeholder : "48N 0123456 1234567",
           };
        },

        /************************************
        format
        ************************************/
        format: function(value, options/*, latLngFormat*/){
            function pad(value, lgd){
                var result = ''+value;
                if (!options.truncate)
                    while (result.length < lgd)
                        result = '0'+result;
                return result;
            }

            var utm = window.latLngFormat.formatList[window.latLngFormat.LATLNGFORMAT_MGRS].MGRS.LLtoUTM({lat: value[0], lon: value[1]});
            return [pad(utm.zoneNumber, 2) + utm.zoneLetter, pad(utm.easting, 7), pad(utm.northing, 7)];
        },

        /************************************
        value
        Convert "12N 123456 1234567" to lat-lng
        ************************************/
        value: function(value, options/*, latLngFormat*/){
            if (!this._valid(value, options))
                return false;

            //Remove multi space => value = "12N 123456 1234567" or "12 N 123456 1234567"
            value = value.toUpperCase().trim();
            value = value.replace(/\s{2,}/g, ' ');

            //If one digit zone without leading zero => add leading zero
            if ( (new RegExp('^\\d\\s?\\D')).test(value))
                value = '0'+value;

            var valueList = value.split(' ');
            //Special case: "12 N 123456 1234567" => [0..3] converted to [0..2]
            if (valueList.length == 4){
                valueList[0] = valueList[0] + valueList[1];
                valueList[1] = valueList[2];
                valueList[2] = valueList[3];
                valueList.pop();
            }

            var latlng = window.latLngFormat.formatList[window.latLngFormat.LATLNGFORMAT_MGRS].MGRS.UTMtoLL({
                    northing  : parseInt(valueList[2]),
                    easting   : parseInt(valueList[1]),
                    zoneLetter: parseInt(valueList[0].slice(2)),
                    zoneNumber: parseInt(valueList[0].slice(0, 2))
                });
            return [latlng.lat, latlng.lon];
        }

    }; //end of window.latLngFormat.formatList[...] =

}(jQuery, this, document));