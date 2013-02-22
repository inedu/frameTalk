	function FocusToRibbonTab(tabName) {
		// will load Ribbon and Focus to tab. Only works inside SharePoint 2010
		var pm = SP.Ribbon.PageManager.get_instance();
		pm.add_ribbonInited(function () {
			SelectRibbonTab("Ribbon." + tabName, true);
		});
		var ribbon = null;
		try {
			ribbon = pm.get_ribbon();
		} catch (e) {
			//alert("catch!"); // allow alert for debug purposes only
		}
		if (!ribbon) {
			if (typeof (_ribbonStartInit) == "function") {
			    _ribbonStartInit(_ribbon.initialTabId, false, null);
			} else {
			    __doPostBack('ctl00$SiteActionsMenuMain$ctl00$wsaShowMenu_CmsActionControl', 'reviewPage');
			}
		} else {
			var ribbon = SP.Ribbon.PageManager.get_instance().get_ribbon();
			// set Ribbon Focus to tabName
			SelectRibbonTab("Ribbon." + tabName, true);
		}
	}
	
	function say(what) {   
		// Avoids exceptions when console is undefined. 
		// BUT Will log only if there is a 'debug' param in URL. Needs URLparamsObj()
   		if (window.console && URLparamsObj().debug) { console.log(what); } 
	}	
	
	function URLparamsObj() {
		// function returns an object with url parameters
		// URL sample: www.test.com?var1=value1&var2=value2
		// USE:	var params = URLparamsObj();
		//      alert(params.var2)    // output: value2
		if (window.location.search) {
			// if there are params in URL
			var param_array = document.location.search.substring(1).split('&');
			var params = new Object();
			var times = param_array.length;
			for(var i=0; i < times; i++){
				var x = param_array[i].toString().split('=');
				params[x[0]] = x[1];
				// console.log("param name: " + x[0] + " --content: " + x[1]);
			}
			return params;
		} 
		return ;
	}
	
	String.prototype.attachFileName = function (filename){
		// function adds filename string to this string if it's not already there. Checks for slash also.
		// USE: somePath = somePath.attachFileName("imsmanifest.xml");
		var attached = "";
		if ( this.indexOf(filename)<0 ){
			// if it does not contain the filename
			if (this.charAt(this.length - 1) != "/" ) {
				// if needs to add a slash
				attached += "/";
			}
			attached += filename;
		}
		return String(this + attached);
	}
	
	String.prototype.toBoolean: function () {	 
	    value = this;
	    if (typeof value === 'undefined' || value === null) {
	       return false;
	    } else {
		switch (value.toLowerCase()) {
			case 'false':
			case 'no':
			case '0':
				return false;
			default:
				return true;
		}
	    }
	}
	
	function GetRandomColor(param) {
		var options;
		switch (param) {
			case "light":
			    options = "89ABCDEF";
			    break;
			case "middle":
			    options = "56789ABC";
			    break;
			case "dark":
			    options = "01234567";
			    break;
			}
		var letters = options.split('');
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.round(Math.random() * (letters.length-1))];
		}
		return color;
	}
