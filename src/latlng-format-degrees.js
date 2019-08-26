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