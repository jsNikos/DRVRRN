define(['MapView', 'mapDataUtils'], function(MapView, mapDataUtils){
	return function(args){
		GoogleMapView.prototype = new MapView(args);
		return new GoogleMapView(args);
	};
	
	/**
	 * Implementation of map-view which uses google-maps api.
	 */
	function GoogleMapView(args){
		var scope = this;
		var controller = this.getController();
		var $map = this.$getMap();
		
		function init(){
			scope.init();			
		}		
		
		/**
		 * The map's current center.
		 * @return google.maps.LatLng
		 */
		this.getCenter = function(){
			return scope.map && scope.map.getCenter();
		};
		
		
		/**
		 * Renders map by centering at store.
		 * @param : mapOptions_ : {zoom: number, center: google.maps.LatLng},
		 * 						 if given is merged with defaults
		 * @param callback : function(map) - when given map (google.maps.Map) is ready
		 */
		this.initMap = function(mapOptions_, callback) {
			var mapOptions = _.extend({
				zoom : 18,
				center : new google.maps.LatLng(controller.storeHolder.latitude, controller.storeHolder.longitude)
			}, mapOptions_);
			scope.map = new google.maps.Map($map.get(0), mapOptions);
			if(!mapOptions_ && controller.mapData && controller.mapData.mapBounds){
				// fit map to given bounds
				var bounds = controller.mapData.mapBounds;
				var sw = new google.maps.LatLng(bounds.minLatitude, bounds.minLongitude);
				var ne = new google.maps.LatLng(bounds.maxLatitude, bounds.maxLongitude);
				scope.map.fitBounds(new google.maps.LatLngBounds(sw, ne));
			}
			callback && callback(scope.map);
		};
		
		/**
		 * Creates an icon for a marker.
		 * @return google.maps.Icon or nokia.maps.gfx.Image
		 */
		this.createIcon = function(url, width, height){
			return {url : url,
					scaledSize : new google.maps.Size(width, height || width)
				};	
		};
		
		/**
		 * Adds a polyline to the map.
		 * @param polyline : PolylineHolder
		 */
		this.addPolyline = function(polyline){
			var runPath = new google.maps.Polyline({
				path : mapDataUtils.extractPath(polyline),
				geodesic : true,
				strokeColor : 'rgb('+polyline.color+')',
				strokeOpacity : 1.0,
				strokeWeight : 2
			});
			runPath.setMap(scope.map);
		};
		
		/**
		 * Adds a marker to the chart.
		 * @param args : {marker: Marker, icon: google.map.Icon or nokia.maps.gfx.Image, zIndex : ?integer}
		 */
		this.addMarkerToMap = function(args){
			var marker = new google.maps.Marker({
			      position: new google.maps.LatLng(args.marker.latitude, args.marker.longitude),
			      icon: args.icon,
			      map: scope.map,
			      zIndex: args.zIndex
			  });
		};
		
		init();
	}
	
});