define(['MapDataUtils'], function(MapDataUtils){
	NokiaMapDataUtils.prototype = new MapDataUtils();
	return new NokiaMapDataUtils();	
		
	/**
	 * An implementation of map-data utils which support nokia-maps.
	 */
	function NokiaMapDataUtils(){
		/**
		 * Extracts path-coord. from polyline.
		 * @param polyline : PolylineHolder
		 * @return [nokia.maps.geo.Coordinate]
		 */
		this.extractPath = function(polyline){			
			return _.chain(polyline.runLocations).map(function(runLocation){
				return new nokia.maps.geo.Coordinate(runLocation.latitude, runLocation.longitude);				
			}).value();
		};		
		
		/**
		 * Request for geocoding of the given address.
		 * @param args : {address : string} or string
		 * @param callback : function(err, {latitude: integer, longitude: integer, noResult: boolean})
		 */
		this.findCoordFromAddress = function(args, callback){			
			var address = _.isString(args) ? args : args.address;			
			jQuery.ajax({
				url : 'https://geocoder.api.here.com/6.2/geocode.json',				
					dataType: 'json',
					type: 'GET',
					data: {gen: 1,
						searchtext: address,
						language: 'en-US',					
						app_id: parent.webDriverRunAppId,
						app_code: parent.webDriverRunAppToken
						},
					success: handleResult,
					error: function(err){
						window.console && console.log(err);
						callback('error when geocoding for address '+address);
					}
			});			
			
			function handleResult(resp){
				var view = resp.Response.View && resp.Response.View[0];
				if(!view){
					return noResult();
				}
				var result = view.Result && view.Result[0];
				if(!result){
					return noResult();
				}
				var position = result.Location.DisplayPosition;
				callback(null, {latitude: position.Latitude, longitude: position.Longitude});
				
				function noResult(){
					callback(null, {noResult: true}); 
				}	
				
			}
		};		
		
		/**
		 * Makes a geocoding by using nokio's search.manager.
		 * This will not work if page is hosted in SSL environment.
		 * @param address
		 * @param callback
		 */
		function geocodeWithManager(address, callback){
			nokia.places.search.manager.geoCode({searchTerm: address, onComplete: handleResult});
			
			// handles search-result
			function handleResult(geocoderResults, status){
				if(status !== 'OK'){					
					return callback(status);
				} else{					
					return callback(null, geocoderResult.location.position);
				}				
			}
		}
		
	}	
});