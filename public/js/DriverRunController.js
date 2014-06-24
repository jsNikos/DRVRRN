define(['DriverRunView',
        'MapViewImpl',
        'libs/timeZoneUtils',
        'commons/libs/async',
        'mapDataUtils',
        'commons/libs/jquery.parsequery'],
function(DriverRunView, MapViewImpl, timeZoneUtils, async, mapDataUtils){
	
	return DriverRunController;
	
	/**
	 * Pagecontroller.
	 * @constructor
	 */
	function DriverRunController(args){
		var scope = this;		
		var view = undefined;
		var mapView = undefined;
		
		
		// model
		this.day = undefined; // integer, the current day
		this.dayOffset = undefined; // server-side time-offset for day
		this.driverRuns = undefined; // [DriverRunHolder]
		this.storeHolder = undefined; // StoreHolder
		this.store = undefined; // string, in case of DW
		this.selectedDriverRun = undefined; // DriverRunHolder, the current selection
		this.showSpeedOptionOnDriverRuns = undefined; // controlls to show speed-check-box
		this.mapOptions = {showOrders: true}; // MapOptions, options for rendering the map
		this.isDW = parent.isDW; // boolean, if deployed to DW		
				
		// model for map
		this.mapData = undefined; // map-data for current selectedDriverRun
		
		function init(){				
			initGlobalErrorHandler();
			var state = restoreState();
			fetchInitData(state, function(err, resp){
				if (err) {
					scope.handleError(err);
					return;
				}
				updateModel(resp, function(err){
					if (err) {
						scope.handleError(err);
						return;
					}
					initView(); 
					initMapView();
				});				
			});
			parent.onpopstate = handlePopState;			
		}		
		
		/**
		 * Constructs the server-url based on deployment environment.
		 */
		this.findServerUrl = function(){
			return '/ws/webDriverRun';			
		};
		
		/**
		 * Global ajax-error handler. 
		 */
		function initGlobalErrorHandler(){
			jQuery(document).ajaxError(function(event, jqxhr){				
				switch (jqxhr.status) {
				case 403: /* forbidden */
					handleNotAuthorized();
					break;
				default:
					break;
				}
			});
		}
		
		/**
		 * Handles not-authorized errors by navigating to unauthorized-page.
		 */
		function handleNotAuthorized(){
			parent.location.assign('/webapps/html/unauthorized.html');
		}
		
		/**
		 * Handles errors by logging.
		 */
		this.handleError = function(err){
			if(!window.console || !console.error){
				return;
			}
			console.error(err); 
			err.stack && console.error(err.stack);			
		};
		
		/**
		 * Handles change of options (show-orders, show-return, ...)
		 * Triggers to update url-state and adjust map correspondingly.
		 * @param optionId : String
		 * @param value : any
		 */
		this.handleOptionChange = function(optionId, value){			
			scope.mapOptions[optionId] = value;
			updateState();
			if(scope.selectedDriverRun){
				mapView.toggleLoading();
				fetchMapData({driverRun: scope.selectedDriverRun, mapOptions: scope.mapOptions}, function(err, resp){				
					mapView.toggleLoading();
					if (err) {
						scope.handleError(err);
						return;
					}
					updateModel(resp, function(err){
						if (err) {
							scope.handleError(err);
							return;
						}
						mapView.initMap({zoom: mapView.getZoom(), center: mapView.getCenter()});
						mapView.renderRun();
					});					
				});		
			}			 
		};
		
		/**
		 * Handles selection of given driverRun by triggering to render the path.
		 * @param driverRun : DriverRunHolder
		 */
		this.handleDriverRunSelect = function(driverRun){
			view.toggleShowDrivers();
			mapView.toggleLoading();			
			scope.selectedDriverRun = driverRun;			
			updateState();			
			// fetch map-data
			fetchMapData({driverRun: driverRun, mapOptions: scope.mapOptions}, function(err, resp){				
				mapView.toggleLoading();
				if (err) {
					scope.handleError(err);
					return;
				}
				updateModel(resp, function(err){
					if (err) {
						scope.handleError(err);
						return;
					}
					mapView.initMap();
					mapView.renderRun();
				});				
			});		
		};
		
		/**
		 * Handles date selection by fetching data for this date and refreshing view related
		 * components.
		 * @param dateStrg
		 * @param $datepicker : not required - but signals that comes from datepicker
		 */
		this.handleDateSelected = function(dateStrg, $datepicker) {
			$datepicker && jQuery(this).slideToggle();			
			timeZoneUtils.fetchTimeStamp({
				dateStrg : dateStrg,
				format : view.DATEPICKER_FORMAT_JAVA,
				store : scope.store,
				controllerUrl : scope.findServerUrl()				
			}, function(err, resp) {
				if (err) {
					scope.handleError(err);
					return;
				}
				if(scope.day === resp.time){
					return;
				}
				scope.day = resp.time;		
				scope.selectedDriverRun = null;
				scope.mapData = null;
				updateState();
				parent.location.reload();
			});
		};		
		
		/**
		 * Backbutton-calls are just made triggering reload.
		 */
		function handlePopState(){
			parent.location.reload();			
		}
		
		/**
		 * Updates url-state with current model by push-state.
		 * State is defined here.
		 */
		function updateState() {
			var state = {
				day : scope.day,
				driverName : scope.selectedDriverRun && scope.selectedDriverRun.driverName,
				startRun : scope.selectedDriverRun && scope.selectedDriverRun.startRun,				
				store : scope.store
			};	
			_.chain(state).extend(scope.mapOptions);
			parent.history.pushState(state, 'driverrun', '?' + jQuery.param(state));
		}
		
		/**
		 * Restores the state on this instance from url-params.
		 * This is send in fetchInitData -request.
		 * @return state : see updateState
		 */
		function restoreState(){			
			var state = jQuery.parseQuery(parent.location.search);
			scope.day = state.day;
			scope.store = state.store;
			var mapOptions = _.pick(state, ['showOrders', 'showDriverStops', 'showMaxSpeed', 'showReturn']);
			_.chain(mapOptions).keys().each(function(key){ mapOptions[key] = convertToBoolean(mapOptions[key]); });
			_.chain(scope.mapOptions).extend(mapOptions);					
			return state;
		}
		
		/**
		 * Converts from string to boolean. 
		 * Everything which not is 'true' return false.
		 * @param strg : string
		 * @returns {Boolean}
		 */	
		function convertToBoolean(strg){
			return !!strg && strg === 'true';
		}
		
		function initView(){
			view = new DriverRunView({controller: scope});
		}
		
		function initMapView(){
			mapView = new MapViewImpl({controller: scope});			
		}
		
		/**
		 * Updates the model with given data.
		 * In case of DW, data are enhanced with geo-coord. where necessary.
		 * @param data
		 * @param callback: function(err)
		 */
		function updateModel(data, callback){
			_.chain(scope).extend(data);
			if(scope.isDW){
				var toEnhance = [];
				if(data.mapData){
					toEnhance = toEnhance.concat(data.mapData.orderMarkers)
					 					 .concat(data.mapData.landMarkers)
					 					 .concat(data.mapData.startEnd); 
				}
				if(data.storeHolder){
					toEnhance = toEnhance.concat(data.storeHolder);
				}				
				return async.each(toEnhance, task, callback);
			} else{
				return callback();
			}
			
			function task(marker, done){	
				if(!marker){
					done();
					return;
				}
				mapDataUtils.findCoordFromAddress(marker, function(err, coords){
					if(err){
						alert('Problem to create marker for address '+marker.address);
						done(err);
					} else if(coords.noResult){
						alert('Geocoding request for address '+marker.address+' failed.');
						done();
					} else{
						_.extend(marker, coords);
						done();
					}					
				});				
			}
		}		
		
		/**
		 * @param args : {day : Date (not required) }
		 * @param callback : function(err, resp), 
		 * 					 resp: {driverRuns: [DriverRunHolder], store: StoreHolder, date : Date}
		 */
		function fetchInitData(args, callback) {
			jQuery.ajax({
				url : scope.findServerUrl() + '/findInitData',
				dataType : 'json',
				type : 'POST',
				data : args,
				success : callback.bind(this, null),
				error : callback.bind(this)
			});
		}
		
		/**
		 * Fetches run-location to display for given driverRun.
		 * @param args : {driverRun : DriverRun, mapOptions: MapOptions} 
		 * @param callback : function(err, {mapData : MapDataHolder})
		 */
		function fetchMapData(args, callback) {
			var data = {};
			 _.chain(args).keys().each(function(key){
				data[key] = JSON.stringify(args[key]);
			});
			jQuery.ajax({
				url : scope.findServerUrl() + '/findMapData',
				dataType : 'json',
				type : 'POST',
				data : data,
				success : callback.bind(this, null),
				error : callback.bind(this)
			});
		}		
		
		init();
		
	}
	
});