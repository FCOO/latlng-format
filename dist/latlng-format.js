/****************************************************************************
latlng-format, a class to validate, format, and transform positions (eq. leaflet LatLng)

    (c) 2015, FCOO

    https://github.com/fcoo/latlng-format
    https://github.com/fcoo

****************************************************************************/

(function ($, window/*, document, undefined*/) {
    "use strict";

    //Options for the tree posible formats. Placed in seperate namespace
    var LATLNGFORMAT_DMSS = 0, //Degrees Minutes Seconds Decimal Seconds: N65d30'15.3"  d='degree sign'
        LATLNGFORMAT_DMM  = 1, //Degrees Decimal minutes                : N65d30.258'
        LATLNGFORMAT_DD   = 2; //Decimal degrees                        : N41.1234d

    // _split - Input: position (number) Return: {hemisphere, degrees, degreesDecimal, minutes, minutesDecimal, seconds, secondsDecimal}
    function _split( position ){
        var result = {};
        result.hemisphere = position >= 0 ? +1 : -1;
        position = Math.abs(position);
        result.degrees = Math.floor(position);
        result.degreesDecimal = Math.min(9999, Math.round((position - result.degrees)*10000) );

        position = position*60 % 60; //Minutes
        result.minutes = Math.floor(position);
        result.minutesDecimal = Math.min( 999, Math.round((position - result.minutes)*1000) );

        position = position*60 % 60; //seconds
        result.seconds = Math.floor(position);
        result.secondsDecimal = Math.min( 9, Math.floor/*round*/((position - result.seconds)*10) );


        return result;
    }

    var latLngFormat;

   
    /************************************
    Constructors
    ************************************/

    // LatlngFormat prototype object
    function LatLngFormat( inputs ){
        this._inputs = inputs;
        this.inputIsValid = (this._inputs !== null);
        this.inputIsSingle = this.inputIsValid && (this._inputs.length == 1);


        if (!this.inputIsValid && console.warn)
            console.warn('latLngFormat: Invalid arguments');         
    }

    
    latLngFormat = function() {
        //Possible arguments: ( Number ), ( Number, Number ) ( [Number, Number] ), ( String ), ( String, String ) ( [String, String] ) 
        var inputs = null,
            inputValid = false;
        if (arguments.length && (arguments.length <= 2)){
            if (arguments.length == 1){
                if ($.isArray(arguments[0]))
                    inputs = arguments[0];
                else
                    inputs = [ arguments[0] ];
            }
            if (arguments.length == 2)
              inputs = [ arguments[0], arguments[1] ];
        
            inputValid = true;
            $.each( inputs, function( index, val ){
                if ((typeof val != 'number') && (typeof val != 'string')){
                    inputValid = false;
                    return false;
                }        
            });
        }
        return new LatLngFormat( inputValid ? inputs : null );
    };

    //Defalut options
    latLngFormat.options = {
        degreeChar: '&#176;', //or '&deg;'
             //lat, lng
        min: [-90, -180],
        max: [ 90,  180]
    };
    latLngFormat.LATLNGFORMAT_DMSS = LATLNGFORMAT_DMSS;
    latLngFormat.LATLNGFORMAT_DMM  = LATLNGFORMAT_DMM;
    latLngFormat.LATLNGFORMAT_DD   = LATLNGFORMAT_DD;

   
    /************************************
    LatlngFormat Prototype
    ************************************/
    latLngFormat.fn = LatLngFormat.prototype = {
        _getLat: function(){ return this._inputs[0]; },
        _getLng: function(){ return this.inputIsSingle ? this._inputs[0] : this._inputs[1]; },

        //_method - call this.method with correct parametre. method = function( regexpIndex,  value [, extraParam] ): return (Boolean|Number|String)
        _method   : function (method, param1, param2) { return [ method.call( this, 0, this._getLat(), param1, param2 ), method.call( this, 1, this._getLng(), param1, param2 ) ]; },
        _methodLat: function (method, param1, param2) { return method.call( this, 0, this._getLat(), param1, param2 ); },
        _methodLng: function (method, param1, param2) { return method.call( this, 1, this._getLng(), param1, param2 ); },
    
        //**********************************************************
        //_valid - Return true if the value is a valid position
        _valid: function(latOrLng, value){
            if (typeof value == 'number')
                return (value >= latLngFormat.options.min[latOrLng]) && (value <= latLngFormat.options.max[latOrLng]);
            else
                //The regexp is prefixed with ^(?: and suffixed with )$ to make it full-match-only.
                return (new RegExp( '^(?:' + latLngFormat.options.regexp[latOrLng] + ')$' )).test(value);
        },

        //valid - Return true if the input is a valid position
        valid   : function(){ return this._method( this._valid ); },
        validLat: function(){ return this._methodLat( this._valid ); },
        validLng: function(){ return this._methodLng( this._valid ); },

        //**********************************************************
        //_format - Converts value to a string, using this.displayMask or this.editMask
        _format: function(latOrLng, value, useEditMask){
            function trim(value, lgd)  {var result = ''+value; while (result.length < lgd) result = '0'+result; return result; }
            function append(value, lgd){var result = ''+value; while (result.length < lgd) result = result+'0'; return result; }

            if (typeof value == 'string')
                return this._valid(latOrLng, value) ? value : '';

            var parts = _split(value);
            var result = (useEditMask ? latLngFormat.options.editMask : latLngFormat.options.displayMask).replace('H', latOrLng ? (parts.hemisphere == 1 ? 'E' : 'W') : (parts.hemisphere == 1 ? 'N' : 'S') );
            result = result.replace(/DDD/ , parts.degrees                   );
            result = result.replace(/dddd/, append(parts.degreesDecimal,4)  );
            result = result.replace(/MM/  , trim(parts.minutes, 2)          );
            result = result.replace(/mmm/ , append(parts.minutesDecimal, 3) );
            result = result.replace(/SS/  , trim(parts.seconds, 2)          );
            result = result.replace(/s/   , trim(parts.secondsDecimal, 1)   );
            return result;
        },
        //format - Converts number value to a string, using this.displayMask or this.editMask
        format   : function( useEditMask ){ return this._method( this._format, useEditMask ); },
        formatLat: function( useEditMask ){ return this._methodLat( this._format, useEditMask ); },
        formatLng: function( useEditMask ){ return this._methodLng( this._format, useEditMask ); },

        //**********************************************************
        //_ value - Converts value (string masked as editMask) to decimal degrees.
        //Using convertMask to convert the different part of the text. Any space is ignored
        _value: function(latOrLng,  value){
            //toDecimal - Convert a integer value v to a decimal. Eq    toDecimal(89)    = 0.89, toDecimal(9) = 0.9, toDecimal(1234)    = 0.1234
            function toDecimal(v) {
                var l = v.toString().length;
                return v / Math.pow(10, l);
            }

            if (typeof value != 'string')
              return value;

            value = value.toUpperCase().trim();

            //Convert N or E to +1 and S or W to -1
            var sign = 1;
            if ( (value.indexOf('S') > -1) || (value.indexOf('W') > -1) )
                sign = -1;

            //Remove all no-digital charts
            value = value.replace(/\D+/g, ' ');

            if ((value === '') || !this._valid(latOrLng,  value))
                return null;
            
            var split = value.split(/\D/),
                result = 0,
                convertMaskIndex = 0,
                i, nextValue;
            for (i=0; i<split.length; i++ ){
                nextValue = parseInt(split[i]);
                if (!isNaN(nextValue)){
                    switch (latLngFormat.options.convertMask[convertMaskIndex]){
                        case 'DDD' : result = result + nextValue;                 break;
                        case 'MM'  : result = result + nextValue/60;              break;
                        case 'mmm' : result = result + toDecimal(nextValue)/60;   break;
                        case 's'   : result = result + toDecimal(nextValue)/3600; break;
                        case 'SS'  : result = result + nextValue/3600;            break;
                        case 'dddd': result = result + toDecimal(nextValue);      break;
                    }
                    convertMaskIndex++;
                    if (convertMaskIndex >= latLngFormat.options.convertMask.length)
                        break;
                }
            }
            return sign*result;
        },
        //value - Converts value (string masked as editMask) to decimal degrees.
        value   : function(){ return this._method( this._value ); },
        valueLat: function(){ return this._methodLat( this._value ); },
        valueLng: function(){ return this._methodLng( this._value ); },


        //**********************************************************
        //_convert - If value is valid string in orgLatlngFormat => convert it to this' format and return it as text-string, else return original input-string
        _convert: function( latOrLng, value, orgFormatId ){
            if (typeof value != 'string')
              return value;

            if (orgFormatId){
                //Change to original format
                var formatId = latLngFormat.options.formatId;
                latLngFormat.setFormat( orgFormatId );

                if (this._valid( latOrLng, value )){
                    var numberValue = this._value( latOrLng, value );

                    //Reset format
                    latLngFormat.setFormat( formatId );

                    //Convert to current format
                    value = this._format( latOrLng, numberValue, true/*useEditMask*/);
                }
                else
                    //Reset format
                    latLngFormat.setFormat( formatId );
            }
            return value;
        },
        //convert - If value is valid in orgLatlngFormat => convert it to this' format and return it as text-string, else return original input-string
        convert   : function( orgLatLngFormat ){ return this._method( this._convert, orgLatLngFormat ); },
        convertLat: function( orgLatLngFormat ){ return this._methodLat( this._convert, orgLatLngFormat ); },
        convertLng: function( orgLatLngFormat ){ return this._methodLng( this._convert, orgLatLngFormat ); },

        
    };//end of latLngFormat.fn = LatLngFormat.prototype = {
    
   
    /************************************
    Static methods
    ************************************/
    $.extend( latLngFormat, {
        //setFormat
        setFormat: function( formatId ){
            if (formatId !== null)
              this.options.formatId = formatId; 

            /*
            Create editMask,convertMask, regexp, placeholder in options based on options.formatId and numeral.js
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

            var dS = '.', //Default
                dC = this.options.degreeChar,
                newOptions = {};

            //Try to get delimiters from current locale in numeral
            var n = window.numeral,
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

            switch (this.options.formatId){
                case LATLNGFORMAT_DMSS:
                    newOptions = { //Degrees Minutes Seconds (N41d25'01")
                        displayMask: "DDD"+dC+"MM'SS"+dS+"s\"H",
                        editMask   : "DDD MM SS"+dS+"sH",
                        convertMask: ['DDD', 'MM', 'SS', 's'],
                        regexp     : [ _regexp.anySpace + '(90|'  + _regexp.DD  + _regexp.anySpace + _regexp.MMSSs + ')' + _regexp.anySpace + _regexp.hemisphereLat  + _regexp.anySpace,
                                       _regexp.anySpace + '(180|' + _regexp.DDD + _regexp.anySpace + _regexp.MMSSs + ')' + _regexp.anySpace + _regexp.hemisphereLong + _regexp.anySpace  ],
                        placeholder: ["89 59 59"+dS+"9N", "179 59 59"+dS+"9E"],
                    };
                    break;

                case LATLNGFORMAT_DMM:
                    newOptions = { //Degrees Decimal minutes (N41d25.123')
                        displayMask: "DDD"+dC+"MM"+dS+"mmm'H",
                        editMask   : "DDD MM"+dS+"mmmH",
                        convertMask: ['DDD', 'MM', 'mmm'],
                        regexp     : [ _regexp.anySpace + '(90|'  + _regexp.DD  + _regexp.anySpace + _regexp.MMmmm + ')' + _regexp.anySpace + _regexp.hemisphereLat  + _regexp.anySpace,
                                       _regexp.anySpace + '(180|' + _regexp.DDD + _regexp.anySpace + _regexp.MMmmm + ')' + _regexp.anySpace + _regexp.hemisphereLong + _regexp.anySpace  ],
                        placeholder: ["89 59"+dS+"999N", "179 59"+dS+"999E"],
                    };
                    break;

                case LATLNGFORMAT_DD:
                    newOptions = { //Decimal degrees (N41.1234d)
                        displayMask: "DDD"+dS+"dddd"+dC+"H",
                        editMask   : "DDD"+dS+"ddddH",
                        convertMask: ['DDD', 'dddd'],
                        regexp     : [ _regexp.anySpace + '(90|'  + _regexp.DD  + _regexp.anySpace + _regexp.dddd + ')' + _regexp.anySpace + _regexp.hemisphereLat  + _regexp.anySpace,
                                       _regexp.anySpace + '(180|' + _regexp.DDD + _regexp.anySpace + _regexp.dddd + ')' + _regexp.anySpace + _regexp.hemisphereLong + _regexp.anySpace  ],
                        placeholder: ["89.9999N", "179.9999E"],
                    };
                    break;
            }
            $.extend( this.options, newOptions );
        
            return formatId;
        }
    }); //end of $.extend( latLngFormat, {

    // expose access to the constructor and set default format
    window.latLngFormat = latLngFormat;
    window.latLngFormat.setFormat( LATLNGFORMAT_DMSS );

    //Overwrite numeral.js method XX to update format with new decimal delimiters
    var n = window.numeral;
    if (n && n.locale){
        n.locale = 
            function( locale ){
                return function(){
                    //Original function 
                    var result = locale.apply(this, arguments);

                    //Update format
                    window.latLngFormat.setFormat();

                    return result;
                };
            }( n.locale );
    }


    
}(jQuery, this, document));