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