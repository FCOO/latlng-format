# latlng-format
A class to validate, format, and transform positions (e.g. leaflet LatLng)

Can handle tree different formats:

1. Degrees Minutes Seconds Decimal Seconds: `N65°30'15.3"`
2. Degrees Decimal minutes: `N65°30.258'`
3. Decimal degrees: `N65.5043°`
 

## Installation
### bower
`bower install https://github.com/fcoo/latlng-format.git --save`

## Create

    var myLatLngFormat = latLngFormat( 12.345 );
    myLatLngFormat.formatLng(); //12°20'42.0" = {string}

    var myLatLngFormat = latLngFormat( 55.6, 12.345 );
    myLatLngFormat.format(); //[ 55°36'0.0", 12°20'42.0" ] = {string[]}

    var myLatLngFormat = latLngFormat( '55°36\'0.0"', '12°20\'42.0"' );
    myLatLngFormat.value(); //[ 55.6, 12.345 ] = {number[]}

```var myLatLngFormat = new LatLngFormat( formatId )```

### Validate, format and convert
All validation, format, and covert methods comes in tree versions:

    latLngFormat.METHOD    = function( {(number|string)[]} ) return {(number|string|boolean)[]}
	latLngFormat.METHODLat = function( {(number|string)} )   return {(number|string|boolean)}
	latLngFormat.METHODLng = function( {(number|string)} )   return {(number|string|boolean)}

#### valid
Input: A position as formatted string. Eq. `"N41.1234°"` 	 
Output: `{boolean}` or `{boolean[]}` if `input` is a valid position

    latLngFormat.valid()
	latLngFormat.validLat()
	latLngFormat.validLng()

#### format
Converts signed decimal degrees `({number})` to a string
Input: A position as decimal degrees (`{number[]}` or `{number}`).
Output: The position as formatted string. Eq. `"N41°30'00""` (`{string[]}` or `{string}`).

	latLngFormat.format()
	latLngFormat.formatLat()
	latLngFormat.formatLng()

#### formatTrunc
Converts signed decimal degrees `({number})` to a string AND trunctate it
Input: A position as decimal degrees (`{number[]}` or `{number}`).
Output: The position as formatted string. Eq. `"N41°30'"` (`{string[]}` or `{string}`).

	latLngFormat.formatTrunc()
	latLngFormat.formatTruncLat()
	latLngFormat.formatTruncLng()

#### value
Converts value = string masked as editMask to decimal degrees.
Input: A position as formatted string. Eq. `"N41.1234°"`
Output: Decimal degrees (`{number[]}` or `{number}`).

	latLngFormat.value()
	latLngFormat.valueLat()
	latLngFormat.valueLng()

#### convert
Converts value = string masked as editMask between two different formats. NOTE: Used to edit positions
Input: `orgFormatId` = id of the original format
Output: The position as formatted string in the current format

    latLngFormat.convert( orgFormatId )
	latLngFormat.convertLat( orgFormatId )
	latLngFormat.convertLng( orgFormatId )


## Settings

    latLngFormat.setFormat( formatId )

Sets the format used by `latLngFormat` where `formatId`is a number between 0-2, or use one of the following const 

| value | const | Description | Example |
| :--: | :--: | --- | :--: |
| `0` | `latLngFormat.LATLNGFORMAT_DMSS` | Degrees Minutes Seconds Decimal Seconds| `N65°30'15.3"` |
| `1` | `latLngFormat.LATLNGFORMAT_DMM` | Degrees Decimal minutes| `N65°30.258'` |
| `2` | `latLngFormat.LATLNGFORMAT_DD` | Decimal degrees| `N65.5043°` |

NOTE: The decimal delimiter used is set in [Numeral.js](http://numeraljs.com/) using [locale](http://numeraljs.com/#locales)


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/fcoo/latlng-format/LICENSE).

Copyright (c) 2015 [FCOO](https://github.com/FCOO)

## Contact information

[Niels Holt](https://github.com/NielsHolt)

