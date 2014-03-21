// 1. put the code to both DOMs (window + iFrame)
// 2. run both frameTalk.init()
// sendMessage first param must be a window object. Try .contentWindow for iFrames
// **** send example: frameTalk.sendMessage( window.top, "doRunFn", [1,2,3,'four'] );

(function (window) {
    "use strict";
    var frameTalk, hasBeenInit = false, uniqueId = getRandomInt(1000,9999), useOfPromises = true, promisesTable = [];   
	
	frameTalk = {
        init : function() {
			if (! (window.JSON && window.JSON.parse && window.JSON.stringify)) {
                say("No init, JSON missing, please load JSON2");
				return false;
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
			say("init ready, window unique Id: " + uniqueId);
			return true;
        },		 
		
		sendMessage : function (where, theFunction, theParams, promiseInd) {
            try {
				if (typeof theFunction != "string" ) {
					say("sendMessage second param must be a function's name (string)");
					return;
				}				
				if (typeof theParams != "object" ) {
					// turn theParams into single record array
					theParams = [theParams];
				}
				where = findPostMsgFn(where);
				if ( !where ) {
					say("sendMessage first param must be a window object with postMessage defined.");
					return;
				} 
                // some browsers do not support json via postMessage, so stringify                                   
                var myMsgObj = {"theFunction":theFunction, "theParams":theParams, "windowId":uniqueId, "promiseInd":promiseInd};
				var myMsg = window.JSON.stringify(myMsgObj);
                where.postMessage(myMsg, '*');
            } catch (err) {
                say("sendMessage Error - description: " + err.message);        
            }
        },
		 
        handshake: function (toWindow) {
			var windowFromName, hsPromiseInd;
			toWindow = findPostMsgFn(toWindow);
			if ( !toWindow ) {
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
			if (useOfPromises) {
				hsPromiseInd = newPromiseInd();
				return promisesTable[hsPromiseInd].promise();
			}
		}	
    };    

	function receiveMessage (event) {
		try {
			// frameTalk.sendMessage always sends a string, so, turn it into json
			var eventObjData = window.JSON.parse(event.data),
				theFunction = eventObjData.theFunction,
				theParams = eventObjData.theParams,
				windowId = eventObjData.windowId,
				promiseInd = eventObjData.promiseInd,
				wObj;
			//
			if (windowId == uniqueId) {
				// this is an echo, do not examine!
				say('msg rejected as echo');
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
							// in case iFrame has a 'name' tag, look again.
							wObj = window.document.getElementsByName(windowNameToReply)[0];					
							if ( wObj && wObj.contentWindow ) {
								// it's an iFrame. Put [1] in params
								frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1] );
							} else {
								// it's not the top window nor an iFrame in this window. Look for iFrames in parent (nested case)
								wObj = window.parent.document.getElementsByName(windowNameToReply)[0];
								if ( wObj && wObj.contentWindow ) {
									frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1] );
								} else {
									say("could not find handshake receiver");		
								}
							}		
						}
					}
				}				 
			}  
			else if (theFunction == "replyHandshake") {
				if (!promiseInd) {
					if (theParams[0] === 0) { 
						say("HandShake with top window completed." ); 
					} else {
						say("HandShake completed." ); 
					}
				} else {
					// resolve promise
					promisesTable[promiseInd].resolve(true);
				}
			}                  
			else {
				// call the function that other iFrame asked to
				var fn = window[theFunction];
				if (typeof fn === "function") {
					fn.apply(this, theParams);
				} else {
					say("receiveMessage: function not found");
				}
			}
		} catch (err) {
			say("receiveMessage Error - description: " + err.message);        
		}
	}	
	
	function getRandomInt (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function say(what){	console.log("frameTalk says: " + what);	}
	
	function findPostMsgFn(where) {
		if (where.postMessage) return where;
		if (where.contentWindow && where.contentWindow.postMessage) return where.contentWindow;	
		return null;
	}
	
	function newPromiseInd() {
		var l = promisesTable.length,
			r = new $.Deferred();
		promisesTable[l] = r;
		// return the index of the new promise
		return l;
	}
	
	// examine promises availability
	if (typeof window.jQuery !== "function") {
		// we cannot give promises, use fallbacks
		useOfPromises = false;		
		say("caution, since no jQuery found, handshake functionality will not include promises");
	}
	
  window.frameTalk = frameTalk;
}(window));
