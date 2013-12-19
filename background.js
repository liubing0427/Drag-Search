// 使用浏览器间同步的方式保存配置
var Storage = chrome.storage.sync;

// 默认配置数据
var defOpts = {"NAME":"用\"%w\"引擎搜索\"%s\"","SEARCHENGINES":[
	{"ID":"百度","URL":"http://www.baidu.com/s?wd=%s","ENABLE":true},
	{"ID":"必应","URL":"http://www.bing.com/search?q=%s","ENABLE":false}
]};
var URL = null;
// 创建上下文菜单项和子菜单
function createContextMenu(opts)
{
	var J = opts;
	var Name = null;
	for (var i = 0; i < J.SEARCHENGINES.length; i++)
	{
		if (J.SEARCHENGINES[i].ENABLE)
		{
		   Name = J.SEARCHENGINES[i].ID;
		   URL = J.SEARCHENGINES[i].URL;
		}
	};
    // 新建选择页面内容后显示的菜单项
    var context = "selection";
    var id = chrome.contextMenus.create({
			"title" : J.NAME.replace("%w", Name),
			"id" : "c" + context,
			"contexts" :[context],
			"onclick" : onClickMenu
		});
};

// 菜单项点击后调用相应的搜索引擎
function onClickMenu(info, tab)
{
	var search = URL;
	var url = search.replace("%s", encodeURIComponent(info.selectionText));
	chrome.tabs.create({"url": url, "index": tab.index+1});
};

// 删除本扩展创建的上下文菜单
function deleteContextMenu()
{
	chrome.contextMenus.removeAll();
};

// 保存配置到Storage，超过QUOTA_BYTES_PER_ITEM需要进行分片保存。
function setOptions(opts, cb)
{
	for (var i = 0; i < opts.SEARCHENGINES.length; i++)
	{
		if (opts.SEARCHENGINES[i].ENABLE)
		{
			URL = opts.SEARCHENGINES[i].URL;
		}
	};
	var optionStr = JSON.stringify(opts);
	var length = optionStr.length;
	var sliceLength = Storage.QUOTA_BYTES_PER_ITEM / 2; // 简单设置每个分片最大长度，保证能存储到
	var optionSlices = {}; // 保存分片数据
	var i = 0; // 分片序号

	// 分片保存数据
	while (length > 0)
	{
		optionSlices["cs_options_" + i] = optionStr.substr(i * sliceLength, sliceLength);
		length -= sliceLength;
		i++;
	}

	// 保存分片数量
	optionSlices["cs_options_num"] = i;

	// 写入Storage
	Storage.set(optionSlices, cb);
}

// 从Storage读取配置
function getOptions(cb)
{
	Storage.get(null, function(items) {
		// 新建菜单
		if (!items.cs_options_num || items.cs_options_num == 0)
		{
			// 保存默认配置
			setOptions(defOpts);

			cb(defOpts);
		}
		else
		{	
			console.log('get');
			var opts = "";
			// 把分片数据组成字符串
			for(var i = 0; i < items.cs_options_num; i++)
			{
				opts += items["cs_options_"+i];
			}

			cb(JSON.parse(opts));
		}
	});
}

// 初始化入口
function init()
{
	// 首先清空原有菜单
	deleteContextMenu();
	
	// 读取选项配置，加载菜单
	getOptions(function(opts){
		// 初始化时创建菜单
		createContextMenu(opts);
		 // 注册Storage改动监听函数
		 // 调用getOptions函数重新生成菜单
		chrome.storage.onChanged.addListener(function(changes, namespace) {
			console.log('change');
			deleteContextMenu();
			getOptions(createContextMenu);
		});
	});
	
	// 其他页面请求事件处理
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		//console.log("Recieve request: " + request);

		if (request.cmd == 'click')
		{
			if(!URL)
			{
				getOptions(function(opts){
					for (var i = 0; i < opts.SEARCHENGINES.length; i++)
					{
						if (opts.SEARCHENGINES[i].ENABLE)
						{
							URL = opts.SEARCHENGINES[i].URL;
						}
					};
				});
			}
			chrome.tabs.getSelected(null, function(tab)
			{
				var search = URL;
				var url = search.replace("%s", encodeURIComponent(request.opts));
				chrome.tabs.create({"url": url, "index": tab.index+1});
			});
		}
		else if (request.cmd == 'get_options')
		{
			getOptions(function(opts){
				sendResponse(opts);
			});
		}
		else if (request.cmd == 'set_options')
		{
			setOptions(request.opts, function(){
				sendResponse();
			});
		}
		else
		{
			console.log("Recieve request: " + request);
		}
	});
};


// 初始化
init();