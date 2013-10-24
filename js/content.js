//正则 匹配属性
BLOCKS_INSIDE = /[^\s{\(\)};,@%\d][^{\(\)}%]*\{[^{}]*\}/g;
/*eg
s="{v{a:1;b:2} a{c:2}}"
s.match(BLOCKS_INSIDE)
["v{a:1;b:2}", "a{c:2}"]
//页面样式集合crossstylesheets
//crossstylesheets = [];
*/
//start
$(function() {
	var jqLoaderCode =
		"if (typeof jQuery === 'undefined') {\n" +
		"    var jqscript = document.createElement('script');\n" +
		"    jqscript.type = 'text/javascript';\n" +
		"    jqscript.src = 'http' + (/^https/.test(location.protocol) ? 's' : '') + '://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js';\n" +
		"    var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;\n" +
		"    head.insertBefore(jqscript, head.firstChild);\n" +
		"}\n";

	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = true;
	script.appendChild(document.createTextNode(jqLoaderCode));
	var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
	head.insertBefore(script, head.firstChild);

	$('BODY').append('<iframe id="cph_xorcss" style="display: none;" />'); // we'll keep track of our injected stylesheets by putting them into this hidden iframe, where they can't interfere
	$('BODY').append('<iframe id="cph_styleTests" style="display: none;" />'); // we'll use this iframe to test elements for their default styles

	setTimeout(function() {
		injectRestrictedCSS();
		setTimeout(function () { // crude and very error-prone attempt to catch stylesheets added via ajax and scripts; TODO: supplement with appropriate events (document load maybe? + something to detect dom changes)
			injectRestrictedCSS();
		}, 5000);
	}, 1);
});
function injectRestrictedCSS() {
  var xorcssDoc = getInjectedSheetsDocument(),
     xorSheets = [],
     sheets = document.styleSheets,
     sheetIndex = 0;

  $('LINK, :not(#cph_xorcss) STYLE').each(function () {
    $(this).attr('cph-ssorder', sheetIndex);
    sheetIndex++;
  });

  for (var s in sheets) {
    if(!sheets.hasOwnProperty(s)){
        continue;
      }
    var thisSheet = sheets[s];
    if (!thisSheet.cssRules && thisSheet.href && thisSheet.href.indexOf('http') == 0 && !isPrintOnlyStylesheet(thisSheet.media)) // if no rules present for external stylesheet
      xorSheets.push([thisSheet.href, $(thisSheet.ownerNode).attr('cph-ssorder')]);
  }

  if (xorSheets.length > $(xorcssDoc).find('STYLE').length) { // check to see if there are new stylesheets to handle or if this is our first time injecting css
    $(xorcssDoc).find('HEAD').html(''); // clear previously injected stylesheets so that we don't affect performance with redundant sheets
    $(xorcssDoc).find('BODY').html(''); 
    for (var x in xorSheets) {
        $.get(YQLURL(xorSheets[x][0]), injectSheet(xorSheets[x][1]));
    }
  }
}

function injectSheet(sheetIndex) {
  return function (xmlDoc) {
    if (xmlDoc) {
      try {
      	if(xmlDoc.getElementsByTagName('p')[0] == undefined){
      		return;
      	}
        var xorcssDoc = getInjectedSheetsDocument(),
           newStylesheet = document.createElement('style');
        var _text = xmlDoc.getElementsByTagName('p')[0].childNodes[0].nodeValue.replace(/\/\*.*?\*\//g,"").match(BLOCKS_INSIDE).join("\n");
        newStylesheet.type = 'text/css';
        newStylesheet.setAttribute('cph-ssorder', sheetIndex);
        newStylesheet.appendChild(document.createTextNode(_text));
        xorcssDoc.getElementsByTagName('head')[0].appendChild(newStylesheet);
        newStylesheet.disabled = true;
        //console.log(sheetIndex+":"+xmlDoc.getElementsByTagName('p')[0].childNodes[0].nodeValue)
        //var xmlDocsheetArray = xmlDoc.getElementsByTagName('p')[0].childNodes[0].nodeValue.match(/.*?{.*?}/);

		var _div = document.createElement('div');
		_div.id = "cph-ssorder-data"+ sheetIndex;
		_div.appendChild(document.createTextNode(_text));
		xorcssDoc.getElementsByTagName('body')[0].appendChild(_div);


  //       var xmlDocsheetArray = xmlDoc.getElementsByTagName('p')[0].childNodes[0].nodeValue.replace(/\/\*.*([^\*])*[^\*]*?\*\//g,"").match(BLOCKS_INSIDE);
  //       var crosssheetArray = [];
  //       var _xmlDocsheetstyleIndex = -1;
  //       for(var i in xmlDocsheetArray){
  //           //console.log(i+":"+_xmlDocsheetstyleIndex)
  //           _xmlDocsheetstyleIndex ++ ; 
  //          if(!xmlDocsheetArray.hasOwnProperty(i)){
  //           continue;
  //           }
  //           if(/(-moz-)|(-o-)|(-ms-)/.test(xmlDocsheetArray[i].match(/[^\s{][^{]*/)[0])){
  //              _xmlDocsheetstyleIndex = _xmlDocsheetstyleIndex-1;
  //              _xmlDocsheetstyle = {}
  //              continue;
  //           }
  //           else{
  //              _xmlDocsheetstyle =  xorcssDoc.styleSheets[xorcssDoc.styleSheets.length-1].cssRules[_xmlDocsheetstyleIndex] && xorcssDoc.styleSheets[xorcssDoc.styleSheets.length-1].cssRules[_xmlDocsheetstyleIndex].style
  //           }
  //           //console.log(i+xmlDocsheetArray[i]+"|"+xorcssDoc.styleSheets[xorcssDoc.styleSheets.length-1].cssRules[_xmlDocsheetstyleIndex].selectorText)
  //          crosssheetArray.push({"selectorText":xmlDocsheetArray[i].match(/[^\s{][^{]*/)[0],"cssText":xmlDocsheetArray[i],"style":_xmlDocsheetstyle})
  //       }
  //       crossstylesheets.push({"cssRules":crosssheetArray,"sheetIndex":sheetIndex})
		// console.log(crossstylesheets);
		//localStorage['crossstylesheets'] += xmlDoc.getElementsByTagName('p')[0].childNodes[0].nodeValue; 
		//chrome.extension.sendMessage(crossstylesheets);
      }
      catch(e) {
        console.log(e.message); 
        console.log(e.description) 
        console.log(e.number) 
        console.log(e.name) 
        console.log('error injecting');
      }
    }
  }
}

function getInjectedSheetsDocument() {
	return $('#cph_xorcss')[0].contentDocument;
}

function YQLURL(url) {
	return 'http' + (/^https/.test(location.protocol) ? 's' : '') + '://query.yahooapis.com/v1/public/yql' + // generate YQL URL containing query to fetch stylesheet via the stylesheets URL
			 '?q=' + encodeURIComponent('select * from html where url="' + url + '" and xpath="*"') +
			 '&format=xml';
}

function isPrintOnlyStylesheet(mediaList) {
	var isPrint = false;
	if (mediaList.length) {
		for (var m = 0; m < mediaList.length; m++) {
			if (mediaList[m] == 'screen')
				return false;
			else if (mediaList[m] == 'print')
				isPrint = true;
		}
	}
	return isPrint;
}


