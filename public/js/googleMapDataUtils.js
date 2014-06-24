define(['MapDataUtils'], function(MapDataUtils){	
	GoogleMapDataUtils.prototype = new MapDataUtils();
	return new GoogleMapDataUtils();	
	
	/**
	 * An implementation of map-data utils which support google-maps.
	 */
	function GoogleMapDataUtils(){
		/**
		 * Extracts path-coord. from polyline.
		 * @param polyline : PolylineHolder
		 * @return [google.maps.LatLng]
		 */
		this.extractPath = function(polyline){			
			return _.chain(polyline.runLocations).map(function(runLocation){
				return new google.maps.LatLng(runLocation.latitude, runLocation.longitude);				
			}).value();
		};
		
		/**
		 * Request for geocoding of the given address.
		 * @param args : {address : string} or string
		 * @param callback : function(err, {latitude: integer, longitude: integer, noResult: boolean})
		 */
		this.findCoordFromAddress = function(args, callback){
			var address = _.isString(args) ? args : args.address; 
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({address: address}, function(geocoderResults, status){
				if(status === google.maps.GeocoderStatus.ZERO_RESULTS){
					return callback(null, {noResult: true});
				} else if(status !== google.maps.GeocoderStatus.OK){					
					return callback(status);
				} else{
					var first = geocoderResults[0];
					return callback(null, {latitude: first.geometry.location.lat(), longitude: first.geometry.location.lng()});
				}				
			});
		};
	}	
});