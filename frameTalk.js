// 1. put the code to both DOMs (window + iFrame)
// 2. run both frameTalk.init()
// sendMessage first param must be a window object. Try .contentWindow for iFrames
// **** send example: frameTalk.sendMessage( window.top, "doRunFn", [1,2,3,'four'] );

(function (window) {
    "use strict";
    var frameTalk, hasBeenInit = false, uniqueId = getRandomInt(1000,9999);    
	
	frameTalk = {
        init : function() {
			if (! (window.JSON && window.JSON.parse && window.JSON.stringify)) {
                say("No init, JSON missing, please load JSON2");
				return;
            }		
			if (!hasBeenInit) {
				if (window.addEventListener) {
					window.addEventListener("message", receiveMessage, false); 
					hasBeenInit = true;
				} else if (window.attachEvent) {
					window.attachEvent("onmessage", receiveMessage);   
					hasBeenInit = true;					
				} else { say("could not attach event listener"); }
			} else { say("already init"); }
			say("my uniqueId: " + uniqueId);
        },		 
		
		sendMessage : function (where, theFunction, theParams) {
            try {
				if (typeof theFunction != "string" ) {
					say("sendMessage second param must be a function's name (string)");
					return;
				}
				if (typeof where != "object" || !where.postMessage ) {
					say("sendMessage first param must be a window object with postMessage defined. Try .contentWindow for iFrames");
					return;
				} 
				if (typeof theParams != "object" ) {
					// turn theParams into single record array
					theParams = [theParams];
				}
                // some browsers do not support json via postMessage, so stringify                                   
                var myMsgObj = {"theFunction":theFunction, "theParams":theParams, "windowId":uniqueId};
				var myMsg = window.JSON.stringify(myMsgObj);
                where.postMessage(myMsg, '*');
            } catch (err) {
                say("sendMessage Error - description: " + err.message);        
            }
        },
		 
        handshake : function (toWindow) {
			var windowFromName;
			if ( typeof toWindow != "object" || !toWindow.postMessage ) {
				say('handshake needs a window object with postMessage defined');
				return; 
			}
			if (window.top === window) {
				// handshake starts from top window
				windowFromName = "@@top@@"; 
			} else {
				windowFromName = window.name;
			}
			frameTalk.sendMessage(toWindow, "handshake", [windowFromName]);
		}
    };    

	function receiveMessage (event) {
		var a = 1; // for breakpoint reasons
		try {
			// sendMessage always sends a string, so, turn it into json
			var eventObjData = window.JSON.parse(event.data),
				theFunction = eventObjData.theFunction,
				theParams = eventObjData.theParams,
				windowId = eventObjData.windowId,
				wObj;
			//
			if (windowId == uniqueId) {
				// this is an echo, do not examine!
				return;
			}
			if (theFunction == "handshake") { 
				var windowNameToReply = theParams[0]; 
				if (windowNameToReply === "@@top@@") {
					wObj = window.top;
					frameTalk.sendMessage(wObj, "replyHandshake", [0] );
				} else {
					wObj = window.document.getElementById(windowNameToReply);					
					if ( wObj && wObj.contentWindow ) {
						// it's an iFrame. Put [1] in params
						frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1] );
					} else {
						// it's not the top window nor an iFrame in this window. Look for iFrames in parent (nested case)
						wObj = window.parent.document.getElementById(windowNameToReply);
						if ( wObj && wObj.contentWindow ) {
							frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1] );
						} else {
							say("could not find handshake receiver");
						}
					}
				}				 
			}  
			if (theFunction == "replyHandshake") {           
				if (theParams[0] === 0) { 
					say("HandShake with top window completed." ); 
				} else {
					say("HandShake completed." ); 
				}
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
	
	function getRandomInt (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function say(what){	console.log("frameTalk says: " + what);	}
	   
  window.frameTalk = frameTalk;
}(window));
