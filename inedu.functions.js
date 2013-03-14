	
	function InitNewWindow() {
		// function builds a new window document and adds a sample html & js code
		// define internal methods
		this.writeScript = function (what){
			return ("<scri" + "pt type='text/javascript'>" + what + "</scri" + "pt>");
		}
		this.writeScriptFile = function (what){
			return ("<scri" + "pt type='text/javascript' src='" + what + "'> </scri" + "pt>");
		}
		// build the window and content
		try {
			document.write("<div id='log'></div>");
			var playerWindow = window.open();
			var objDoc = playerWindow.document;
			objDoc.open();
			objDoc.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">");
			objDoc.write("<html><head>");
			objDoc.write(writeScript("alert('script!')"));
			objDoc.write(writeScriptFile("//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"));
			objDoc.write("</head><body>");
			objDoc.write("<div id='errorLog'>no errors!</div> ");
			objDoc.write("html content");
			objDoc.write("<table border='1' width='100%'> <tr>");
			objDoc.write("   <td> html content in table </td></tr>");
			objDoc.write("</table>");
			objDoc.write("</body></html>");
			objDoc.close();
		} catch (err) {
			document.getElementById("log").innerHTML = "InitNewWindow() error: " + err.message;
		}
	}	
	
	function say(what) {   
		// Avoids exceptions when console is undefined. 
   		if (window.console) { console.log(what); } 
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
	
	String.prototype.attachURLParams = function (paramsObj) {
		// function adds parameters from json paramsObj to url string 
		// USE: params = {}; params.var1 = "value1"; params.var2 = "value2"
		//	someURL = "http://www.test.com";
		//      someURL = someURL.attachURLParams(params);
		// returns: http://www.test.com?var1=value1&var2=value2&
		var attached = "?";
		for (var key in paramsObj) {
		    attached += key + "=" + paramsObj[key] + "&";          
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
