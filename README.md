# latlng-format
A class to validate, format, and transform positions (e.g. leaflet LatLng)

Can handle five different formats:

1. Degrees Minutes Seconds Decimal Seconds: `N65°30'15.3"`
2. Degrees Decimal minutes: `N65°30.258'`
3. Decimal degrees: `N65.5043°`
4. UTM: `29Q 286657 2492164`
5. MGRS: `MANGLER`
 

## Installation
### bower
`bower install https://github.com/fcoo/latlng-format.git --save`

## Demo
http://FCOO.github.io/latlng-format/demo/ 

## Usage

### `latLngFormat.setFormat( formatId )`

Sets the format used by `latLngFormat` where `formatId` is a number between 0-5, or use one of the following const 

    latLngFormat.LATLNGFORMAT_DMSS = 0; //Degrees Minutes Seconds Decimal Seconds: N65d30'15.3"  d='degree sign'
    latLngFormat.LATLNGFORMAT_DMM  = 1, //Degrees Decimal minutes                : N65d30.258'
    latLngFormat.LATLNGFORMAT_DD   = 2; //Decimal degrees                        : N41.1234d

    latLngFormat.LATLNGFORMAT_UTM  = 3; //UTM                                    : 29Q 286657 2492164
    latLngFormat.LATLNGFORMAT_MGRS = 4; //MGRS                                   : 4QFJ1234567890
    latLngFormat.LATLNGFORMAT_NAC  = 5; //NAC                                    : HBV6R RG77T

NOTE: The decimal delimiter used is set in [Numeral.js](http://numeraljs.com/) using [locale](http://numeraljs.com/#locales)

### `latLngFormat.onChange( method[, context])`
Adds a method (and context) to be called when a new format is set using `latLngFormat.setFormat( formatId )`

`method = function( formatId, oldFormatId )`

### Create `latLngFormat`

    var myLatLngFormat = latLngFormat( <input> );

The `<input>` can be one of the following

    Number           : latLngFormat(85)
    [Number, Number] : latLngFormat(55.123, 12.4321)
    String           : latLngFormat('33I 0336257 6111490')
    [String, String] : latLngFormat('55°07.380N', '12°25.926E')


### `latLngFormat(...).valid(asArray: Boolean);`

    latLngFormat(...).valid() => true or false
    latLngFormat(...).valid(true) => [true or false, ture or false]

### `latLngFormat(...).format(options);`

Return the position as a `String` or `String[]`

    options:
        asArray  : false,
        preText  : '',
        separator: ' ',
        postText : '',
        truncate : false   


### `latLngFormat(...).formatTrunc(options);`

As `latLngFormat(...).format(options);` but return a truncated string

### `latLngFormat(...).value();`

Convert and return a valid position as `[lat:Number, lng:Number]`
Return `false` if the position is invalid

### `latLngFormat(...).convertTo(newFormatId);`
Convert the position to `newFormatId` and return `.value()`

## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/fcoo/latlng-format/LICENSE).

Copyright (c) 2015 [FCOO](https://github.com/FCOO)

## Contact information

[Niels Holt](https://github.com/NielsHolt)

