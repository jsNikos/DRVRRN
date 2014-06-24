define(function(){
	return MapDataUtils;
	
	/**
	 * Defines an abstract class for model-utils supporting MapDataHolder
	 */
	function MapDataUtils(){
		
		/**
		 * Extracts path-coord. from polyline.
		 * @param polyline : PolylineHolder
		 * @return [google.maps.LatLng]
		 */
		this.extractPath = function(polyline){			
			throw new Error('This is abstract');
		};
		
		/**
		 * Request for geocoding of the given address.
		 * @param args : {address : string} or string
		 * @param callback : function(err, {latitude: integer, longitude: integer, noResult: boolean})
		 */
		this.findCoordFromAddress = function(args, callback){
			throw new Error('This is abstract');
		};
	}
	
});
