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


(function(){
	try{
		var DEBUG = false;

		var QUERY_LIMIT = 1;
		var WAIT_COUNT = 400;

		function log(message){
			if(DEBUG){
				alert(message);
			}
			console.log(message);
		}
		var map;
		
		var address_list = [];
		var marker_table = [];
		
		function append_result(marker, info, message){
			var span = info.state;
			while(span.firstChild){
				span.removeChild(span.firstChild);
			}
			var m = document.createElement("a");
			m.href = "#map";
			m.appendChild(document.createTextNode("マーカーへジャンプ"));
			m.addEventListener("click", function(event){
				map.panTo(marker.position);
				event.preventDefault();
				return false;
			},false);
			span.appendChild(m);
		}
		function check_completed(){
			try{
				if(!is_searching()){
					var lat = 0.0;
					var lng = 0.0;
					var count = 0;
					for(var i = 0; i < address_list.length; i ++){
						var address = address_list[i];
						var marker_info = marker_table[address];
						var marker = marker_info.marker;
						var info_list = marker_info.info_list;
						if(marker){
							var title = info_list[0].title;
							for(var j = 1; j < info_list.length; j ++){
								title += "\n" + info_list[j].title;
							}
							marker.setTitle(title);
							lat += marker.position.lat();
							lng += marker.position.lng();
							count += 1;
						}
					}
					map.panTo(new google.maps.LatLng(lat / count, lng / count));
				}
			}catch(e){
				log(e);
			}
		}
		var waiting_queue = [];
		
		function draw_item(state, address, title, href){
			try{
				var marker_info = marker_table[address];
				var info = {
					state : state,
					address : address,
					title : title,
					href : href
				};
				if(marker_info){
					marker_info.info_list.push(info);
				}else{
					address_list.push(address);
					marker_table[address] = {
						marker : null,
						info_list : [info]
					};
					
					waiting_queue.push(address);
					if(searching_on_map_count < QUERY_LIMIT){
						execute_query();
					}
				}
			}catch(e){
				log(e);
			}
		}
		
		var geocoder = new google.maps.Geocoder();
		
		function execute_query(){
			try{
				var address = waiting_queue.shift();
				searching_on_map_count ++;
				var marker_info = marker_table[address];
				var info_list = marker_info.info_list;
				geocoder.geocode({address : address}, function(results, status){
					try{
						if (status == google.maps.GeocoderStatus.OK){
							var marker;
							for (var i in results) {
								if (results[i].geometry) {
									var loc = results[i].geometry.location;
									marker = marker_info.marker = new google.maps.Marker({
										position: loc,
										map: map,
										title: ""
									});
									
									map.panTo(loc);
									google.maps.event.addListener(marker, 'click', function() {
										for(var i = 0; i < info_list.length; i ++){
											if(info_list[i].href){
												window.open(info_list[i].href);
											}
										}
									});
									break;
								}
							}
							for(var i = 0; i < info_list.length; i ++){
								append_result(marker, info_list[i]);
							}
						}else{
							for(var i = 0; i < info_list.length; i ++){
								var span = info_list[i].state;
								span.firstChild.nodeValue = "住所が見つかりませんでした(エラーコード: " + status + ")";
								span.style.color = "red";
							}
						}

						searching_on_map_count --;
						if(searching_on_map_count < QUERY_LIMIT && waiting_queue.length > 0){
							setTimeout(execute_query, WAIT_COUNT);
						}else{
							check_completed();
						}
					}catch(e){
						log(e);
					}
				});
			}catch(e){
				log(e);
			}
		}
		
		
		var searching_on_map_count = 0;
		
		function is_searching(){
			return searching_on_map_count > 0 || waiting_queue.length > 0;
		}
		function draw_items(){
			var results = document.getElementsByClassName("result");
			for(var i = 0; i < results.length; i ++){
				var result = results[i];
				var state = result.firstChild;
				var a = state.nextSibling.nextSibling;
				var address = a.firstChild.nodeValue;
				var href = a.nodeName == "A" ?  a.href : null;
				var title = a.nextSibling.nextSibling.firstChild.nodeValue;
				draw_item(state, address, title, href);
			}
		}
		
		function wait_for_completed(){
			try{
				if(document.getElementById("completed")){
					draw_items();
				}else{
					setTimeout(wait_for_completed, 100);
				}
			}catch(e){
				log(e);
			}
		}
		
		function initialize(){
			set_toggles("toggle");
			
			var opts = {
				zoom: 15,
				center: new google.maps.LatLng(34.819476,135.523825),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			map = new google.maps.Map(document.getElementById("map_canvas"), opts);

			wait_for_completed();

			var div = document.createElement("div");
			div.id = "loaded";
			document.body.appendChild(div);
			
		}
		function toggle(event, id){
			var e = document.getElementById(id);
			if(e && e.style){
				if(e.style.display == "none"){
					e.style.display = "block";
				}else{
					e.style.display = "none";
				}
				event.preventDefault();
			}
		}
		function set_toggles(className){
			var as = document.getElementsByClassName(className);
	
			for(var i = 0; i < as.length; i ++){
				var a = as[i];
				if(a.href && a.href.match(/#/)){
					var id = RegExp.rightContext;
					if(document.getElementById(id)){
						a.addEventListener("click", function(event){ toggle(event, id); }, false);
					}
				}
			}
		}
		
		window.addEventListener("load", initialize, false);
	}catch(e){
		log(e);
	}
})();
