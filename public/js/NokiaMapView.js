define(['MapView', 'mapDataUtils'], function(MapView, mapDataUtils){
	return function(args){
		NokiaMapView.prototype = new MapView(args);
		return new NokiaMapView(args);
	};	
	
	/**
	 * Implementation of map-view which uses nokia-maps api.
	 */
	function NokiaMapView(args){	
		var scope = this;
		var controller = this.getController();
		var $map = this.$getMap();
		
		function init(){
			scope.init();
		}
		
		/**
		 * The map's current center.
		 * @return nokia.maps.geo.Coordinate
		 */
		this.getCenter = function(){
			return scope.map && scope.map.center;
		};		
		
		/**
		 * Renders map by centering at store.
		 * Note: this is asnyc.
		 * @param : mapOptions_ : {zoom: number, center: nokia.maps.geo.Coordinate},
		 * 						 if given is merged with defaults
		 * @param callback : function(map) - when given map (nokia.maps.map.Display) is ready
		 */
		this.initMap = function(mapOptions_, callback) {			
			if(mapOptions_){
				mapOptions_.zoomLevel = mapOptions_.zoom;
			}
			var mapOptions = _.extend({
				zoomLevel : 15,
				center : new nokia.maps.geo.Coordinate(controller.storeHolder.latitude, controller.storeHolder.longitude),
				components: [ new nokia.maps.map.component.Behavior(),
			        		  new nokia.maps.map.component.ZoomBar(),
			        		  new nokia.maps.map.component.Overview(),
			        		  new nokia.maps.map.component.TypeSelector(),
			        		  new nokia.maps.map.component.ScaleBar() ]
			}, mapOptions_);
			scope.map && scope.map.destroy();
			var map = new nokia.maps.map.Display($map.get(0), mapOptions);
			scope.map = map;

			scope.map.addListener('displayready', function(){
				callback && callback(map);
				if(scope.map !== map){
					// new map was already rendered
					return;
				}
				!mapOptions_ && optimizeZoom();
			});			
		};
		
		/**
		 * Ensures all significant points are visible by using mapData.mapBounds
		 */ 
		function optimizeZoom(){
			if(controller.mapData && controller.mapData.mapBounds){
				// fit map to given bounds
				var bounds = controller.mapData.mapBounds;
				var corr = 0.001;
				var nw = new nokia.maps.geo.Coordinate(bounds.maxLatitude + corr, bounds.minLongitude -corr);
				var se = new nokia.maps.geo.Coordinate(bounds.minLatitude - corr, bounds.maxLongitude + corr);
				scope.map.zoomTo(new nokia.maps.geo.BoundingBox(nw, se), false);
				scope.map.update();
			}
		}
		
		/**
		 * Creates an icon for a marker.
		 */
		this.createIcon = function(url, width, height){
			return new nokia.maps.gfx.BitmapImage(url, null, width, height || width);
		};
		
		/**
		 * Adds a polyline to the map.
		 * @param polyline : PolylineHolder
		 */
		this.addPolyline = function(polyline){
			var coords = mapDataUtils.extractPath(polyline);
			if(coords.length === 0){
				return;
			}
			var props = {
					pen : {lineWidth : 5,  strokeColor: 'rgb('+polyline.color+')'},
					arrows : new nokia.maps.util.Arrows()
			};
			// reverse coords to ensure arrows are directed right
			scope.map.objects.add(new nokia.maps.map.Polyline(coords.reverse(), props));			
		};
		
		/**
		 * Adds a marker to the chart.
		 * @param args : {marker: Marker, icon: nokia.maps.gfx.Image, zIndex : ?integer}
		 */
		this.addMarkerToMap = function(args){			
			try{ 
				var coord = new nokia.maps.geo.Coordinate(args.marker.latitude, args.marker.longitude);
				var props = {icon : args.icon, zIndex : args.zIndex, anchor: {x: args.icon.width/2, y: args.icon.height} };			
				scope.map.objects.add(new nokia.maps.map.Marker(coord, props));
			}catch(err){
				window.console 
				&& console.log('Error when adding marker ')
				&& console.log(args.marker);
				controller.handleError(err);				
			}
		};
		
		init();
	}
	
});