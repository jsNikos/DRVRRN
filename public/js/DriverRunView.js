define(['libs/timeZoneUtils',
        'commons/libs/jquery-dataTables/jquery.dataTables',
        'libs/jquery.scrollTo.min'],
function(timeZoneUtils){	
	return DriverRunView;
	
	function DriverRunView(args){
		var scope = this;
		var controller = args.controller;
		var DATE_FORMAT = 'ddd M/DD/YY';
		this.DATEPICKER_FORMAT_JAVA = 'MM/dd/yyyy';
		this.DATEPICKER_FORMAT_MOM = 'MM/DD/YYYY';
		
		// el
		var $container = jQuery('.driverrun');
		var $map = jQuery('.map', $container);
		var $datepicker = jQuery('.datepicker', $container);
		var $daySelect = jQuery('.day-select', $container);
		var $drivers = jQuery('.drivers', $container);
		var $options = jQuery('.options', $container);
		var $menueIcon = jQuery('.menue-icon', $container);
		var $driverIcon = jQuery('.driver-icon', $container);
		var $left = $container.find('.left');
		var $right = $container.find('.right');
		
		// components
		var driverTable = undefined; // points to the drivers DataTable
		
		// templates
		var driverRunRowTmpl = _.template(jQuery('.driver-run-row-tmpl').text());
		
		function init(){		
			initDatePicker();
			initOptions();
			initDriverRuns();	
			initMenueIcon();
			initDriverIcon();
			initResizeListener();
			showComponents();
		}
		
		/**
		 * This icon is only shown in small-view.
		 * Registers onclick which triggers to show map-options.
		 */
		function initMenueIcon(){
			$menueIcon.on('click', function(){
				scope.toggleShowMenue();
			});
		}
		
		/**
		 * This icon is only shown in small-view.
		 * Registers onclick which triggers to show driver-table.
		 */
		function initDriverIcon(){
			$driverIcon.on('click', function(){
				scope.toggleShowDrivers();
			});
		}
		
		/**
		 * Toggles showing driver-menue.
		 */
		this.toggleShowMenue = function(){
			$options.toggleClass('hide-small');
		};
		
		this.toggleShowDrivers = function(){
			$left.toggleClass('hide-small');
			$right.toggleClass('hide-small');
		};
		
		/**
		 * Inits check-boxes showOrders, driverStops, show-return.
		 * Registers click-listener.
		 */
		function initOptions(){
			jQuery('[type="checkbox"]', $container).each(function(){
				$checkbox = jQuery(this);
				// pre-select			 
				controller.mapOptions 
					&& controller.mapOptions[$checkbox.attr('id')]
					&& $checkbox.attr('checked', 'checked');			
				
				// style
				if($checkbox.attr('id') === 'showMaxSpeed' && !controller.showSpeedOptionOnDriverRuns){
					$checkbox.hide();
					jQuery('[for="showMaxSpeed"]').hide();
					return;
				}			
				
				// register click listener
				$checkbox.button().on('change', function(event){
					var $target = jQuery(event.target);
					var value = true;
					if($target.attr('checked')){
						$target.removeAttr('checked');
						value = false;
					} else{
						$target.attr('checked', 'checked');
					} 					
					controller.handleOptionChange($target.attr('id'), value);
				});					
			});			
		}
		
		/**
		 * Registers resize listener on window.
		 */
		function initResizeListener(){
			jQuery(window).on('resize', function(){
				driverTable && adjustDriverTableHeader();			
			});
		}
		
		/**
		 * This fixes the DataTable by adjusting fixed headers during resizing.
		 */
		function adjustDriverTableHeader(){			
			var width = jQuery('.dataTables_scrollBody > table', $drivers);
			jQuery('.dataTables_scrollHeadInner', $drivers).width(width);
		}
		
		/**
		 * Applies some specific style which corrects table during resizing.
		 */
		function fixDriverTableLayout(){
			jQuery('.dataTables_scrollHeadInner').css({width: 'auto'});
			jQuery('.dataTables_scrollHeadInner > table', $drivers).css({width : '100%'});
			jQuery('.dataTables_scrollBody', $drivers).css({'overflow-y' : 'auto', 'overflow-x': 'hidden'});
			jQuery('.dataTables_scrollHead th, .dataTables_scrollBody th', $drivers).css({width : 'auto'});
		}
		
		/**
		 * Registers delegating click-listener on driver-runs and calls to render.
		 */
		function initDriverRuns(){
			$drivers.on('click', '.driver-run', function(event){
				 jQuery('.driver-run', $drivers).removeClass('selected'); // unselect
				 controller.handleDriverRunSelect(jQuery(event.currentTarget).addClass('selected').data('driverRun'));
			});
			updateDriverRuns();
			
			driverTable = jQuery('table', $drivers).dataTable({
				'sScrollY' : '435px',
				'bPaginate' : false,
				'bScrollCollapse' : true,
				'bJQueryUI' : true
			}).on('sort, filter', function(){
				setTimeout(fixDriverTableLayout, 0);
			});
			setTimeout(fixDriverTableLayout, 0);
			
			if(controller.selectedDriverRun){
				// pre-select		
				var driverName = controller.selectedDriverRun.driverName;
				var startRun = controller.selectedDriverRun.startRun;
				var $selectedRow = jQuery('[data-drivername="'+driverName+'"][data-startrun="'+startRun+'"]', $drivers).addClass('selected');
				//scroll to selection
				$drivers.find('.dataTables_scrollBody').scrollTo($selectedRow.get(0));
			}			
		}
		
		/**
		 * Updates driverRuns in view.
		 */
		function updateDriverRuns(){
			var $tbody = jQuery('tbody', $drivers).empty();
			_.chain(controller.driverRuns).each(function(driverRun){
				jQuery(driverRunRowTmpl(driverRun))
				.appendTo($tbody)
				.data('driverRun', driverRun);
			});			
		}
		
		function initDatePicker(){
			$datepicker
				.datepicker({onSelect : controller.handleDateSelected})
				.hide();					
			$daySelect
				.button()				
				.on('click', function(){
					$datepicker.slideToggle();
				});			
			scope.updateDatePicker();
			
			// next/prev button
			jQuery('.day-arrow', $container).on('click', function(){
				var reqDate = moment($datepicker.datepicker('getDate'));
				if(jQuery(this).hasClass('prev')){
					reqDate.add('d', -1);
					controller.handleDateSelected(reqDate.format(scope.DATEPICKER_FORMAT_MOM));
				} else{
					reqDate.add('d', 1);
					controller.handleDateSelected(reqDate.format(scope.DATEPICKER_FORMAT_MOM));
				}
			});
		}
		
		/**
		 * Updates date-picker with current model.
		 */
		this.updateDatePicker = function(){			
			var date = timeZoneUtils.inServerTime(controller.day, controller.dayOffset);
			$daySelect.text(moment(date).format(DATE_FORMAT));
			$datepicker.datepicker('setDate', date);
		};
		
		/**
		 * Components which are initialized and styled by js-calls
		 * are first hiddem.
		 */
		function showComponents(){
			jQuery('.control, .contents', $container).css('visibility', 'visible');
		}	
		
		init();
	}
	
});