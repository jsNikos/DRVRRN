define(function(){
	return new TimeZoneUtils();

	/**
	 * Utils to switch between server and client timezone. Note because DST is made at different times
	 * it is necessary to invoke each function with the time-zone-offset of the server at the given
	 * time.
	 */
	function TimeZoneUtils(){	
		
		/**
		 * Computes from the given time (in millis) a Date-object which (day, minute, hour, ...)-infos
		 * are with respect to server's time-zone.
		 * @param time : integer
		 * @param timeZoneOffset : server-side timeZoneOffset at given time (Date(time) - Utc(time))
		 * @return Date		  
		 */
		this.inServerTime = function(time, timeZoneOffset){			
			var date = new Date(time);			 
			var clientTimeOffset = -date.getTimezoneOffset();
			return new Date(time + (timeZoneOffset - clientTimeOffset)*60*1000);
		};
		
		/**
		 * Parses given date-object into millis w.r.t server's time-zone.
		 * @param date : Date
		 * @param timeZoneOffset : server-side timeZoneOffset at given time (Date(time) - Utc(time))
		 * @return Integer
		 */
		this.parseInServerTime = function(date, timeZoneOffset){			
			var clientTimeOffset = -date.getTimezoneOffset();
			return date.getTime() + (clientTimeOffset - timeZoneOffset) * 60 *1000;			
		};
		
		/**
		 * Request for given dateStrg the timeStamp in server's time-zone.
		 * Requires a rest-method 'findTimeStamp'.
		 * @param args : {dateStrg (string), format (string, java simpleDateFormat), controllerUrl (string)}
		 * @param callback : function(err, resp)
		 */
		this.fetchTimeStamp = function(args, callback){
			jQuery.ajax({
				url : args.controllerUrl + '/findTimeStamp',
				dataType : 'json',
				type : 'POST',
				data : _.chain(args).pick('dateStrg', 'format', 'store').value(),
				success : callback.bind(this, null),
				error : callback.bind(this)
			});
		};
		
	}
	
});