	function URLparamsObj() {
		// function returns an object with url parameters
		// URL sample: www.test.com?var1=value1&var2=value2
		// USE:	var params = URLparamsObj();
		//      alert(params.var2)    // output: value2
		if (window.location.search) {
			// if there are params in URL
			var param_array = document.location.search.substring(1).split('&');
			var params = new Object();
			for(var i=0; i < param_array.length; i++){
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
	
