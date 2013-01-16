/*
Copyright (c) 2013, Takaaki Umedu
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Takaaki Umedu nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL TAKAAKI Umedu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var plotonmap_f7e44ddb_51de_4979_8c3c_0c4585f20bef;

(function(){
	try{
		var DEBUG = false;

		var ID = "plotonmap_f7e44ddb_51de_4979_8c3c_0c4585f20bef";
		function log(message){
			if(DEBUG){
				alert(message);
			}
			console.log(message);
		}
		
		function load_search_word(){
			try{
				initialize_preferences();
			}catch(e){
				log(e);
				return null;
			}
		}
	
		function save_search_word(search_word){
			try{
				initialize_preferences();
				var pref_data = 
				pref_data.data = search_word;
				preference.setComplexValue("search_word", pref_interface, pref_data);
			}catch(e){
				log(e);
			}
		}
	
		function clear_setting(){
			try{
				initialize_preferences();
				
			}catch(e){
				log(e);
			}
		}
		function escape_number(number){
			return ("" + number).replace(/[^0-9]/g, "");
		}
		function initialize(){
			try{
				var win = window.openDialog("chrome://" + ID + "/content/dialog.xul", "Preferences", "chrome,titlebar,toolbar,centerscreen,modal","dialog");
				if(win.plotonmap_f7e44ddb_51de_4979_8c3c_0c4585f20bef_accept){
					var branch_name = "extensions." + ID + "."
					var pref_service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
					var search_word = null;
					var max_depth = null;
					var anchor_index = null;
	
					var branch = pref_service.getBranch(branch_name);
					try{
						search_word = branch.getComplexValue("search_word", Components.interfaces.nsISupportsString).data;
					}catch(e){
					}
					try{
						max_depth = branch.getIntPref("max_depth", 0);
					}catch(e){
						max_depth = 0;
					}
					try{
						anchor_index = branch.getIntPref("anchor_index", 1);
					}catch(e){
					}
					if(anchor_index < 0){
						anchor_index = 0;
					}
					if(search_word){
						var escaped_search_word = search_word.replace(/\\/g,"\\\\").replace(/"/g,"\\\"");
						var target_window = window._content;
						open_map_window(target_window.document.body, search_word, max_depth, anchor_index);
					}else{
						pref_service.deleteBranch(branch_name);
						alert("設定を削除しました");
					}
				}
			}catch(e){
				log(e);
			}
		}
		function find_element(element, checker){
			if(checker(element)){
				return element;
			}
			if(element.nodeType == 1){
				for(var child = element.firstChild; child; child = child.nextSibling){
					var ret = find_element(child, checker);
					if(ret){
						return ret;
					}
				}
			}
			return null;
		}
		
		var FOR_IGNORE_DESCENDANTS = new Object();
		var FOR_BREAK = new Object();
		function for_all_elements(element, func){
			try{
				var ret = func(element);
				if(ret === FOR_BREAK){
					return FOR_BREAK;
				}
				if(ret === FOR_IGNORE_DESCENDANTS){
					return;
				}
				if(element.nodeType == 1){
					for(var child = element.firstChild; child; child = child.nextSibling){
						if(for_all_elements(child, func) === FOR_BREAK){
							return FOR_BREAK;
						}
					}
			}
			}catch(e){
				log(e);
				return FOR_BREAK;
			}
		}

		function find_href(element, anchor_index){
			if(anchor_index > 0){
				var count = 0;
				var ret = null;
				find_element(element, function(element){
					if(element.nodeType == 1 && element.nodeName == "A"){
						count ++;
						if(count == anchor_index){
							ret = element.href;
							return FOR_BREAK;
						}
					}
				});
				return ret;
			}else{
				return null;
			}
		}
		
		
		function listup_targets(target_element, search_word, max_depth, anchor_index){
			try{
				var targets = [];
				var addresses = [];
				for_all_elements(target_element, function(element){
					if(element.className == ID || element.nodeName == "SCRIPT"){
						return FOR_IGNORE_DESCENDANTS;
					}
					if(element.nodeType == 3 && element.nodeValue.match(search_word)){
						var address = RegExp.$1;
						if(!address){
							address = RegExp.lastMatch;
						}
						targets.push(element);
						addresses.push(address);
					}
				});
				for(var i = 0; i < targets.length; i ++){
					var depth = 1;
					var target = targets[i];
					while(max_depth == 0 || depth < max_depth){
						var parent_tmp = target.parentNode;
						if(parent_tmp && parent_tmp.nodeName != "BODY"){
							if(for_all_elements(parent_tmp, function(element){
								if(element == target){
									return FOR_IGNORE_DESCENDANTS;
								}
								for(var j = 0; j < targets.length; j ++){
									if(element == targets[j]){
										return FOR_BREAK;
									}
								}
							}) != FOR_BREAK){
								target = parent_tmp;
							}else{
								break;
							}
						}else{
							break;
						}
						depth ++;
					}
					targets[i] = target;
				}
				var items = [];
				for(var i = 0; i < targets.length; i ++){
					var target = targets[i];
					var title = "";
					for_all_elements(target, function(element){
						if(element.className == ID || element.nodeName == "SCRIPT"){
							return FOR_IGNORE_DESCENDANTS;
						}
						if(element.nodeType == 3){
							title += element.nodeValue;
						}else if(element.nodeName == "BR"){
							title += "\n";
						}
					});
					title = title.replace(/^\s+/g,'').replace(/\s+$/g,'').replace(/(\r|\n)+/g,"\n").replace(/\s+/g," ").replace(/^(\r|\n)/,"").replace(/(\r|\n)$/,"");

					var href = find_href(target, anchor_index);
					items.push({
						address : addresses[i],
						title : title,
						href : href
					});
				}
			}catch(e){
				log(e);
			}
			return items;
		}
		
		function open_map_window(target_element, search_word, max_depth, anchor_index){
			try{
				var search_regexp;
				try{
					search_regexp = new RegExp(search_word);
				}catch(e){
					alert("正規表現のコンパイルエラー : " + e);
					return;
				}

				var subwindow = window.open("chrome://" + ID + "/content/map.html");

				function loaded(){
					try{
						function ct(text){
							return subwindow.document.createTextNode(text);
						}
						function ce(name, text){
							var e = subwindow.document.createElement(name);
							if(text){
								e.appendChild(ct(text));
							}
							return e;
						}
						subwindow.document.getElementById("search_word").appendChild(ct(search_word));
						var targets = listup_targets(target_element, search_regexp, max_depth, anchor_index);
						var ul = ce("ul");
						for(var i = 0; i < targets.length; i ++){
							var target = targets[i];
							var li = ce("li");
							li.className = "result";
							var span = ce("span", "検索中");
							span.className = "state";
							li.appendChild(span);
							li.appendChild(ct(" : "));
							if(target.href){
								var a = ce("a", target.address);
								a.href = target.href;
								a.target = "_blank";
								li.appendChild(a);
							}else{
								li.appendChild(ce("span", target.address));
							}
							li.appendChild(ct("("));
							li.appendChild(ce("span", target.title));
							li.appendChild(ct(")"));
							ul.appendChild(li);
						}
						subwindow.document.body.appendChild(ul);
						var p = ce("p", "全" + targets.length + "件");
						p.id = "completed";
						subwindow.document.body.appendChild(p);
					}catch(e){
						log(e);
					}
				}
				function wait_for_load(){
					try{
						if(subwindow.document && subwindow.document.getElementById && subwindow.document.getElementById("loaded")){
							loaded();
							return;
						}
					}catch(e){
					}
					setTimeout(wait_for_load, 1000);
				}
				wait_for_load();

			}catch(e){
				log(e);
			}
		}

		plotonmap_f7e44ddb_51de_4979_8c3c_0c4585f20bef = {
			initialize: initialize
		};
	}catch(e){
		log(e);
	}
})();
