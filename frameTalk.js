// 1. put the code to both DOMs (window + iFrame)
// 2. run both frameTalk.init()
// sendMessage first param must be a window object. Try .contentWindow for iFrames
// **** send example: frameTalk.sendMessage( window.top, "doRunFn", [1,2,3,'four'] );

(function (window) {
    "use strict";
    var frameTalk;    
	
	frameTalk = {
        init : function() {
            if (window.addEventListener) {
                window.addEventListener("message", receiveMessage, false);       
            } else if (window.attachEvent) {
                window.attachEvent("onmessage", receiveMessage);        
            } else {
                say("could not attach event listener");
            }
            if (! (window.JSON && window.JSON.parse && window.JSON.stringify)) {
                say("JSON missing, please load JSON2");
            }
        },		 
		
		sendMessage : function (where, theFunction, theParams) {
            try {
				if (typeof theFunction != "string" ||
					typeof theParams != "object" ) {
						say("theFunction must be a function's name (string), and theParams must be an array");
						return;
				}
				if (typeof where != "object" || !where.postMessage ) {
					say("sendMessage first param must be a window object with postMessage defined. Try .contentWindow for iFrames");
					return;
				} 
                // some browsers do not support json via postMessage, so stringify                                   
                var myMsgObj = {"theFunction":theFunction, "theParams":theParams};
				var myMsg = window.JSON.stringify(myMsgObj);
                where.postMessage(myMsg, '*');
            } catch (err) {
                say("sendMessage Error - description: " + err.message);        
            }
        }
		 
        /*handshake : function (fromWindow, toWindow) {
			if (typeof fromWindow != "object" || !fromWindow.postMessage || 
				typeof toWindow != "object" || !toWindow.postMessage ) {
					say('handshake needs to window objects with postMessage defined');
					return; 
			}
			frameTalk.sendMessage(to, { "theFunction": "handshake", "theParams": from });
		};*/
    };    

	function receiveMessage (event) {
		try {
			// sendMessage always sends a string, so, turn it into json
			var eventObjData = window.JSON.parse(event.data);
			var theFunction = eventObjData.theFunction;
			var theParams = eventObjData.theParams;
			//
			if (theFunction == "handshake") { 
				frameTalk.sendMessage(handShakeReplyTo, { "theFunction": "replyHandshake", "theParams": [1] });
			}  
			if (theFunction == "replyHandshake") {           
				if (theParams[0] == 1) { say("HandShake completed." ); }
			}                  
			else {
				// call the function that other iFrame asked to
				var fn = window[theFunction];
				fn.apply(this, theParams);
			}
		} catch (err) {
			say("receiveMessage Error - description: " + err.message);        
		}
	}	
	
	function say(what){	console.log("frameTalk says: " + what);	}
	   
  window.frameTalk = frameTalk;
}(window));
