//  实现划词搜索功能
//  在打开页面中加载context.js脚本，监听鼠标拖拽事件，显示动态创建的搜索菜单
//
document.addEventListener('dragend', function(e) {
	var selectionText;
	if(window.getSelection){//DOM,FF,Webkit,Chrome,IE10
	selectionText = window.getSelection().toString();
	}else if(document.getSelection){//IE10
	selectionText = document.getSelection().toString();
	}else if(document.selection){//IE6+10-
	selectionText = document.selection.createRange().text;
	}else{
	selectionText = "";
	}
	chrome.extension.sendRequest({cmd: 'click', opts: selectionText}, function() {
		selectionText = "";
	});
}, false);
