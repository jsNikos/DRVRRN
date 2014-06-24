define(['mapDataUtils',
        'text!../stop-sign.html',
        'text!../speed-sign.html',
        'text!../startEnd-sign.html',
        'text!../order-sign.html',
        'commons/libs/async',
        'libs/canvg/canvg',
        'libs/fabric.min'],
function(mapDataUtils, stopSignHtml, speedSignHtml, startEndSignHtml, orderSignHtml, async){
	return MapView;
		
	/**
	 * Defines a abstract class for supporting implementation of view for the map.
	 */
	function MapView(args){
		var scope = undefined;
		var controller = args.controller;
		this.map = undefined; // google.maps.Map or nokia.maps.map.Display
		
		// el	
		var $map = jQuery('.map', '.driverrun');
		
		// templates
		var stopSignTmpl = _.template(stopSignHtml);
		var speedSignTmpl = _.template(speedSignHtml);
		var startEndSignTmpl = _.template(startEndSignHtml);
		var orderSignTmpl = _.template(orderSignHtml);
		
		this.init = function(){
			scope = this;
			scope.initMap();	
			if(controller.mapData){
				scope.renderRun();
			}			
		};		
		
		this.getController = function(){
			return controller;
		};
		
		this.$getMap = function(){
			return $map;
		};
		
		/**
		 * The map's current zoom.
		 * @return Integer
		 */
		this.getZoom = function(){
			return scope.map && scope.map.getZoom();
		};
		
		/**
		 * The map's current center.
		 * @return google.maps.LatLng
		 */
		this.getCenter = function(){
			throw new Error('This is abstract');
		};
		
		
		/**
		 * Renders map by centering at store.
		 * @param : mapOptions_ : {zoom: number, center: google.maps.LatLng},
		 * 						 if given is merged with defaults
		 * @param callback : function(map) - when given map (google.maps.Map or nokia.maps.map.Display) is ready
		 */
		this.initMap = function(mapOptions_, callback) {
			throw new Error('This is abstract');
		};
		
		/**
		 * Renders run into map.
		 * Note: this is asynchronous!		  
		 */
		this.renderRun = function() {
			_.chain(controller.mapData.polylines).each(scope.addPolyline);		
			async.eachSeries(controller.mapData.orderMarkers, addOrderMarker);			
			controller.mapData.startEnd && addStartEndMarker(controller.mapData.startEnd);
			controller.mapData.speedMarker && addSpeedMarker(controller.mapData.speedMarker);			
			_.chain(controller.mapData.stopMarkers).each(addStopMarker);
			_.chain(controller.mapData.warningSigns).each(addWarningSigns);
			_.chain(controller.mapData.landMarkers).each(addLandMark);
		};	
		
		/**
		 * Creates an icon for a marker.
		 * @return google.maps.Icon or nokia.maps.gfx.Image
		 */
		this.createIcon = function(url, width, height){
			throw new Error('This is abstract');
		};
		
		/**
		 * Adds landMarker to the chart.
		 * @param landMarker : LandMarker
		 */
		function addLandMark(landMarker){
			var icon = scope.createIcon('/Image?name='+encodeURIComponent(landMarker.icon), 40);
			scope.addMarkerToMap({marker: landMarker, icon: icon, zIndex: -1});
		}		
		
		/**
		 * Adds warning-signs to map.
		 * @param warningSign : Marker
		 */
		function addWarningSigns(warningSign){	
			var icon = scope.createIcon('/Image?name=warning_48', 25);			
			scope.addMarkerToMap({marker: warningSign, icon: icon});
		}
		
		/**
		 * Adds the given stopMarker to the map.
		 * @param stopMarker : StopMarker
		 */
		function addStopMarker(stopMarker){
			var width = 75;
			var height = 95;
			var url = createMarkerUrl({svg: stopSignTmpl(stopMarker), width: width, height: height});
			var icon = scope.createIcon(url, width*0.7, height*0.7);
			scope.addMarkerToMap({marker : stopMarker, icon : icon});
		}		
		
		/**
		 * Adds the given speedMarker to the map.
		 * @param speedMarker : SpeedMarker
		 */
		function addSpeedMarker(speedMarker){
			var width = 70;
			var height = 85;
			var url = createMarkerUrl({svg: speedSignTmpl(speedMarker), width: width, height: height});
			var icon = scope.createIcon(url, width*0.7, height*0.7);	
			scope.addMarkerToMap({
						marker : speedMarker,
						icon : icon
					});			
		}
		
		/**
		 * Adds a marker to flag start/end of route.
		 * @param startEnd : Marker
		 */
		function addStartEndMarker(startEnd){
			var width = 150;
			var height = 85;
			var url = createMarkerUrl({svg: startEndSignTmpl(startEnd), width: width, height: height});
			var icon = scope.createIcon(url, width*0.7, height*0.7);
			scope.addMarkerToMap({
						marker : startEnd,
						icon : icon,
						zIndex: 1
					});			
		}
		
		/**
		 * Adds the given orderMarker to the map.
		 * Note: is asnyc!
		 * @param orderMarker : OrderMarker
		 * @param callback : function() called when rendered
		 */
		function addOrderMarker(orderMarker, callback){
			var newlineGap = 17;
			var width = 180;
			var initHeight = 55;
			var height = initHeight * (1 + (orderMarker.labels.length*newlineGap)/initHeight);
			var canvasId = 'canvas' + orderMarker.id;
			var $canvas = jQuery('<canvas></canvas>').attr('id', canvasId).hide().appendTo('body'); 				
			var fcanvas = new fabric.Canvas(canvasId);		
			fcanvas.setHeight(height).setWidth(width);
			
			
			var img = new Image();
			// load icon
			img.src = '/Image?name='+encodeURIComponent(orderMarker.icon);
			jQuery(img).on('load', function(){	
				img.width = 20;
				img.height = 20;	
				loadSvgForMarker();										
			});		
			
			// load svg for this marker
			function loadSvgForMarker(){				
				fabric.loadSVGFromString(orderSignTmpl(orderMarker), function(objects, options) {
					var obj = fabric.util.groupSVGElements(objects, options);
					obj.left = 0;
					obj.top = 0;
					obj.scaleY = 1 + (orderMarker.labels.length*newlineGap)/initHeight;
					fcanvas.add(obj).renderAll();

					addLabelsAndIcon();					  
					
					scope.addMarkerToMap({
						marker : orderMarker,
						icon : scope.createIcon(fcanvas.toDataURL(), 0.8*width, 0.8*height)
					});	

					$canvas.remove(); 
					fcanvas.dispose();
					jQuery('.canvas-container').remove();
					callback();
				});	
			}
			
			// adds labels and icon to canvas
			function addLabelsAndIcon(){				
				  _.chain(orderMarker.labels).each(function(label, idx){		
						fcanvas.add(new fabric.Text(label,
								{ left: 40, top: 10 + idx*17, fontFamily: 'serif', fontSize: 18, fontWeight: 'bold' }));
					});					  
				  fcanvas.add(new fabric.Image(img, {left: 13.5, top: 18}));
			}
				
		}
		
		/**
		 * Adds a polyline to the map.
		 * @param polyline : PolylineHolder
		 */
		this.addPolyline = function(polyline){
			throw new Error('This is abstract');
		};
		
		/**
		 * Adds a marker to the chart.
		 * @param args : {marker: Marker, icon: google.map.Icon or nokia.maps.gfx.Image, zIndex : ?integer}
		 */
		this.addMarkerToMap = function(args){	
			throw new Error('This is abstract');
		};
		
		/**
		 * Creates a dataUrl for the given image given as svg.
		 * @param args : {svg: string, width, height}
		 */
		function createMarkerUrl(args){
			var canvas = jQuery('<canvas></canvas>').get(0);
			canvas.width = args.width;
			canvas.height = args.height;
			var ctx = canvas.getContext('2d');
			ctx.drawSvg(args.svg, 0 , 0 , args.width, args.height);			
			return canvas.toDataURL("image/png");
		}
		
		/**
		 * Adds/remove loading state from map.
		 */
		this.toggleLoading = function() {			
			$map.toggleClass('loading');
		};	
	
		
	}
	
	
});