/* 
To store a var to Session: exposeToSession("myName","johnpan");
To read a var from Session: alert(sessionData().myName);
*/
function sessionData(){  
    var theJson = {};
    for (var i =0; i < sessionExposedData.length; i++) {
        varName = sessionExposedData[i];
        theJson[varName] = sessionStorage[varName];
    } 
    return theJson;
}
function exposeToSession(attr, val){
    if (typeof sessionExposedData == 'undefined') sessionExposedData = []; 
    sessionExposedData.push(attr);
    sessionStorage[attr] = val;     
}
