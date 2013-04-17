// 1. put the code to both DOMs (window + iFrame)
// 2. run both InitListener()
// 3. fix the where var in each SendMessage()
// 3. send example: SendMessage( { "theFunction" : "handshake", "theData" : someJsonData     });

function InitListener() {
    if (window.addEventListener) {
        window.addEventListener("message", ReceiveMessage, false);       
    } else if (window.attachEvent) {
        window.attachEvent("onmessage", ReceiveMessage);        
    } else {
        alert("could not attach event listener");
    }
}

function SendMessage(theMessage) {
    try {
        var where = document.getElementById("target_iFrame").contentWindow; // to talk to child iFrame
        // var where = window.top                                           // to talk to parent frame
        var myMsg = window.JSON.stringify(theMessage);
        where.postMessage(myMsg, '*');
    } catch (err) {
        alert("SendMessage - Error description: " + err.message);        
    }
}

function ReceiveMessage(event) {
    try {
        var eventObjData = window.JSON.parse(event.data);
        var theFunction = eventObjData.theFunction;
        var theData = eventObjData.theData;
        //
        if (theFunction == "handshake") {           
            SendMessage({ "theFunction": "replyHello", "theData": "hi there, this is a reply" });
        }   
        // go on checking for function names here... 
        if (theFunction == "doSomething"){
            // do something
        }
        // You may even eval(theFunction + "(" + theData + ")") and call the original function
    } catch (err) {
        alert("ReceiveMessage - Error description: " + err.message);        
    }
}
