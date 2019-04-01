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