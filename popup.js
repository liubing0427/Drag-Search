$(document).ready(function(){
	refreshView();
});

function refreshView() {
    buildCombobox();
}

function buildCombobox() {
    chrome.extension.sendRequest({
        cmd: "get_options"
    },
    function(opts) {
		var J = opts;
		var a = $(".popup");
		a.empty();
		var g = document.createElement("select");
		g.setAttribute("id", "selectSetting");
		g.setAttribute("class", "chosen-select chosen-rtl");
		a.append(g);
		g = $("#selectSetting");
		var index = null;
		// 根据配置新建子菜单项
		for (var i = 0; i < J.SEARCHENGINES.length; i++){
			if (J.SEARCHENGINES[i].ENABLE)
			{
			   index = i;
			}
			g.append(_newRow(J.SEARCHENGINES[i].ID, J.SEARCHENGINES[i].ENABLE, J.SEARCHENGINES[i].URL, i));
		}
		$("#selectSetting").get(0).selectedIndex=index;  
		$("#selectSetting").change(function() {
				var index = $("#selectSetting").get(0).selectedIndex;
				for (var i = 0; i < J.SEARCHENGINES.length; i++){
					J.SEARCHENGINES[i].ENABLE = false;
				}
				J.SEARCHENGINES[index].ENABLE = true;
				chrome.extension.sendRequest({cmd: 'set_options', opts: opts},function() {
				});
		});
	});
}
function _newRow(h, g, v, a) {
    var i = document.createElement("option");
    i.setAttribute("id", "opt" + a);
	i.setAttribute("value",v);
	i.appendChild(document.createTextNode(h));
	return i;
}
