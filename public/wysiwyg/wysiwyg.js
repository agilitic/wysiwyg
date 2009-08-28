/* lwRTE + lwRTE.tb + occupload -- pimped by agilitic */

/*
 * Lightweight RTE - jQuery Plugin, version 1.2
 * Copyright (c) 2009 Andrey Gayvoronsky - http://www.gayvoronsky.com
 * Modified by agilitic.
 *
 */
jQuery.fn.rte = function(options, editors) {
	if(!editors || editors.constructor != Array)
		editors = new Object();
		
	$(this).each(function(i) {
		var id = (this.id) ? this.id : editors.length;
		editors[id] = new lwRTE (this, options || {});
	});
	
	return editors;
}

var lwRTE = function (textarea, options) {
	this.image_action_url = options.image_action_url || '';
	this.image_error_message = options.image_error_message || '';
	this.element_id = options.element_id;
	this.css		= [];
	this.css_class	= options.frame_class || '';
	this.base_url	= options.base_url || '';
	this.width		= options.width || $(textarea).width() || '100%';
	this.height		= options.height || $(textarea).height() || 350;
	this.iframe		= null;
	this.iframe_doc	= null;
	this.textarea	= null;
	this.event		= null;
	this.range		= null;
	this.toolbars	= {rte: '', html : ''};
	this.controls	= {rte: {disable: {hint: 'Source editor'}}, html: {enable: {hint: 'Visual editor'}}};

	$.extend(this.controls.rte, options.controls_rte || {});
	$.extend(this.controls.html, options.controls_html || {});
	$.extend(this.css, options.css || {});

	if(document.designMode || document.contentEditable) {
		$(textarea).wrap($('<div></div>').addClass('rte-zone').width(this.width));		
		this.textarea	= textarea;
		this.enable_design_mode();
	}
}

lwRTE.prototype.editor_cmd = function(command, args) {
	this.iframe.contentWindow.focus();
	try {
		this.iframe_doc.execCommand(command, false, args);
	} catch(e) {
	}
	this.iframe.contentWindow.focus();
}

lwRTE.prototype.get_toolbar = function() {
	var editor = (this.iframe) ? $(this.iframe) : $(this.textarea);
	return (editor.prev().hasClass('rte-toolbar')) ? editor.prev() : null;
}

lwRTE.prototype.activate_toolbar = function(editor, tb) {
	var old_tb = this.get_toolbar();

	if(old_tb)
		old_tb.remove();

	$(editor).before($(tb).clone(true));
}
	
lwRTE.prototype.enable_design_mode = function() {
	var self = this;

	// need to be created this way
	self.iframe	= document.createElement("iframe");
	self.iframe.frameBorder = 0;
	self.iframe.frameMargin = 0;
	self.iframe.framePadding = 0;
	self.iframe.width = '100%';
	self.iframe.height = self.height || '100%';
	self.iframe.src	= "javascript:void(0);";

	if($(self.textarea).attr('class'))
		self.iframe.className = $(self.textarea).attr('class');

	if($(self.textarea).attr('id'))
		self.iframe.id = $(self.textarea).attr('id');

	if($(self.textarea).attr('name'))
		self.iframe.title = $(self.textarea).attr('name');

	var content	= $(self.textarea).val();

	$(self.textarea).hide().after(self.iframe).remove();
	self.textarea	= null;
	
	var css = '';
	
	for(var i in self.css)
		css += "<link type='text/css' rel='stylesheet' href='" + self.css[i] + "' />";

	var base = (self.base_url) ? "<base href='" + self.base_url + "' />" : '';
	var style = (self.css_class) ? "class='" + self.css_class + "'" : '';

	// Mozilla need this to display caret
	/*if($.trim(content) == '')
		content	= '<br>';*/

	var doc = "<html><head>" + base + css + "</head><body " + style + " style='padding:5px'>" + content + "</body></html>";

	self.iframe_doc	= self.iframe.contentWindow.document;

	try {
		self.iframe_doc.designMode = 'on';
	} catch ( e ) {
		// Will fail on Gecko if the editor is placed in an hidden container element
		// The design mode will be set ones the editor is focused
		$(self.iframe_doc).focus(function() { self.iframe_doc.designMode(); } );
	}

	self.iframe_doc.open();
	self.iframe_doc.write(doc);
	self.iframe_doc.close();

	if(!self.toolbars.rte)
		self.toolbars.rte	= self.create_toolbar(self.controls.rte);

	self.activate_toolbar(self.iframe, self.toolbars.rte);

	$(self.iframe).parents('form').submit( 
		function() { self.disable_design_mode(true); }
	);

	$(self.iframe_doc).mouseup(function(event) { 
		if(self.iframe_doc.selection)
			self.range = self.iframe_doc.selection.createRange();  //store to restore later(IE fix)

		self.set_selected_controls( (event.target) ? event.target : event.srcElement, self.controls.rte); 
	});

	$(self.iframe_doc).blur(function(event){ 
		if(self.iframe_doc.selection) 
			self.range = self.iframe_doc.selection.createRange(); // same fix for IE as above
	});

	$(self.iframe_doc).keyup(function(event) { self.set_selected_controls( self.get_selected_element(), self.controls.rte); });

	// Mozilla CSS styling off
	if(!$.browser.msie)
		self.editor_cmd('styleWithCSS', false);
}
    
lwRTE.prototype.disable_design_mode = function(submit) {
	var self = this;

	self.textarea = (submit) ? $('<input type="hidden" />').get(0) : $('<textarea></textarea>').width('100%').height(self.height).get(0);

	if(self.iframe.className)
		self.textarea.className = self.iframe.className;

	if(self.iframe.id)
		self.textarea.id = self.iframe.id;
		
	if(self.iframe.title)
		self.textarea.name = self.iframe.title;
	
	$(self.textarea).val($('body', self.iframe_doc).html());
	$(self.iframe).before(self.textarea);

	if(!self.toolbars.html)
		self.toolbars.html	= self.create_toolbar(self.controls.html);

	if(submit != true) {
		$(self.iframe_doc).remove(); //fix 'permission denied' bug in IE7 (jquery cache)
		$(self.iframe).remove();
		self.iframe = self.iframe_doc = null;
		self.activate_toolbar(self.textarea, self.toolbars.html);
	}
}
    
lwRTE.prototype.toolbar_click = function(obj, control) {
	var fn = control.exec;
	var args = control.args || [];
	var is_select = (obj.tagName.toUpperCase() == 'SELECT');
	
	$('.rte-panel', this.get_toolbar()).remove();

	if(fn) {
		if(is_select)
			args.push(obj);

		try {
			fn.apply(this, args);
		} catch(e) {

		}
	} else if(this.iframe && control.command) {
		if(is_select) {
			args = obj.options[obj.selectedIndex].value;

			if(args.length <= 0)
				return;
		}

		this.editor_cmd(control.command, args);
	}
}
	
lwRTE.prototype.create_toolbar = function(controls) {
	var self = this;
	var tb = $("<div></div>").addClass('rte-toolbar').width('100%').append($("<ul></ul>")).append($("<div></div>").addClass('clear'));
	var obj, li;
	
	for (var key in controls){
		if(controls[key].separator) {
			li = $("<li></li>").addClass('separator');
		} else {
			if(controls[key].init) {
				try {
					controls[key].init.apply(controls[key], [this]);
				} catch(e) {
				}
			}
				
			if(controls[key].select) {
				obj = $(controls[key].select)
					.change( function(e) {
						self.event = e;
						self.toolbar_click(this, controls[this.className]); 
						return false;
					});
			} else {
				obj = $("<a href='#'></a>")
					.attr('title', (controls[key].hint) ? controls[key].hint : key)
					.attr('rel', key)
					.click( function(e) {
						self.event = e;
						self.toolbar_click(this, controls[this.rel]); 
						return false;
					})
			}

			li = $("<li></li>").append(obj.addClass(key));
		}

		$("ul",tb).append(li);
		
		// HACK
		if(key == "image") {
			obj.unbind("click");
			var up = obj.upload({
		       	name: 'file',
				enctype: 'multipart/form-data',
				params : {},
				action: self.image_action_url,
				element_id: this.element_id, // aurels
				autoSubmit: false,
				onSelect: function() {
					for(var i=0; i<10000; i++) {}
					var file = $(".file").attr('value')
					// alert("file:" + file)
					var ext = (/[.]/.exec(file)) ? /[^.]+$/.exec(file.toLowerCase()) : '';
					if(!(ext && /^(jpg|png|jpeg)$/.test(ext))){
						alert(self.image_error_message);
						return;
					}					
					this.submit();
				}
			});
		}
		// END HACK
	}

	$('.enable', tb).click(function() {
		self.enable_design_mode();
		return false; 
	});

	$('.disable', tb).click(function() {
		self.disable_design_mode();
		return false; 
	});

	return tb.get(0);
}

lwRTE.prototype.create_panel = function(title, width) {
	var self = this;
	var tb = self.get_toolbar();

	if(!tb)
		return false;

	$('.rte-panel', tb).remove();
	var drag, event;
	var left = self.event.pageX;
	var top = self.event.pageY;
	
	var panel	= $('<div></div>').hide().addClass('rte-panel').css({left: left, top: top});
	$('<div></div>')
		.addClass('rte-panel-title')
		.html(title)
		.append($("<a class='close' href='#'>X</a>")
		.click( function() { panel.remove(); return false; }))
		.mousedown( function() { drag = true; return false; })
		.mouseup( function() { drag = false; return false; })
		.mousemove( 
			function(e) {
				if(drag && event) {
					left -= event.pageX - e.pageX;
					top -=  event.pageY - e.pageY;
					panel.css( {left: left, top: top} ); 
				}

				event = e;
				return false;
			} 
		)
		.appendTo(panel);

	if(width)
		panel.width(width);

	tb.append(panel);
	return panel;
}

lwRTE.prototype.get_content = function() {
	return (this.iframe) ? $('body', this.iframe_doc).html() : $(this.textarea).val();
}

lwRTE.prototype.set_content = function(content) {
	(this.iframe) ? $('body', this.iframe_doc).html(content) : $(this.textarea).val(content);
}

lwRTE.prototype.set_selected_controls = function(node, controls) {
	var toolbar = this.get_toolbar();

	if(!toolbar)
		return false;
		
	var key, i_node, obj, control, tag, i, value;

	try {
		for (key in controls) {
			control = controls[key];
			obj = $('.' + key, toolbar);

			obj.removeClass('active');

			if(!control.tags)
				continue;

			i_node = node;
			do {
				if(i_node.nodeType != 1)
					continue;

				tag	= i_node.nodeName.toLowerCase();
				if($.inArray(tag, control.tags) < 0 )
					continue;

				if(control.select) {
					obj = obj.get(0);
					if(obj.tagName.toUpperCase() == 'SELECT') {
						obj.selectedIndex = 0;

						for(i = 0; i < obj.options.length; i++) {
							value = obj.options[i].value;
							if(value && ((control.tag_cmp && control.tag_cmp(i_node, value)) || tag == value)) {
								obj.selectedIndex = i;
								break;
							}
						}
					}
				} else
					obj.addClass('active');
			}  while(i_node = i_node.parentNode)
		}
	} catch(e) {
	}
	
	return true;
}

lwRTE.prototype.get_selected_element = function () {
	var node, selection, range;
	var iframe_win	= this.iframe.contentWindow;
	
	if (iframe_win.getSelection) {
		try {
			selection = iframe_win.getSelection();
			range = selection.getRangeAt(0);
			node = range.commonAncestorContainer;
		} catch(e){
			return false;
		}
	} else {
		try {
			selection = iframe_win.document.selection;
			range = selection.createRange();
			node = range.parentElement();
		} catch (e) {
			return false;
		}
	}

	return node;
}

lwRTE.prototype.get_selection_range = function() {
	var rng	= null;
	var iframe_window = this.iframe.contentWindow;
	this.iframe.focus();
	
	if(iframe_window.getSelection) {
		rng = iframe_window.getSelection().getRangeAt(0);
		if($.browser.opera) { //v9.63 tested only
			var s = rng.startContainer;
			if(s.nodeType === Node.TEXT_NODE)
				rng.setStartBefore(s.parentNode);
		}
	} else {
		this.range.select(); //Restore selection, if IE lost focus.
		rng = this.iframe_doc.selection.createRange();
	}

	return rng;
}

lwRTE.prototype.get_selected_text = function() {
	var iframe_win = this.iframe.contentWindow;

	if(iframe_win.getSelection)	
		return iframe_win.getSelection().toString();

	this.range.select(); //Restore selection, if IE lost focus.
	return iframe_win.document.selection.createRange().text;
};

lwRTE.prototype.get_selected_html = function() {
	var html = null;
	var iframe_window = this.iframe.contentWindow;
	var rng	= this.get_selection_range();

	if(rng) {
		if(iframe_window.getSelection) {
			var e = document.createElement('div');
			e.appendChild(rng.cloneContents());
			html = e.innerHTML;		
		} else {
			html = rng.htmlText;
		}
	}

	return html;
};

lwRTE.prototype.selection_replace_with = function(html) {
	var rng	= this.get_selection_range();
	var iframe_window = this.iframe.contentWindow;

	if(!rng)
		return;
	
	this.editor_cmd('removeFormat'); // we must remove formating or we will get empty format tags!

	if(iframe_window.getSelection) {
		rng.deleteContents();
		
		if ($.browser.safari) {
			rng.insertNode(html);
		}
		
		rng.insertNode(rng.createContextualFragment(html));
		this.editor_cmd('delete');
	} else {
		this.editor_cmd('delete');
		rng.pasteHTML(html);
	}
}

// ========================================================================
// ========================================================================
// ========================================================================
/*
 * Lightweight RTE - jQuery Plugin, v1.2
 * Basic Toolbars
 * Copyright (c) 2009 Andrey Gayvoronsky - http://www.gayvoronsky.com
 */
var rte_tag		= '-rte-tmp-tag-';

var	rte_toolbar = {
	s1				: {separator: true},
	bold			: {command: 'bold', tags:['b', 'strong']},
	italic			: {command: 'italic', tags:['i', 'em']},
	strikeThrough	: {command: 'strikethrough', tags: ['s', 'strike'] },
	underline		: {command: 'underline', tags: ['u']},
	s2				: {separator: true },
	indent			: {command: 'indent'},
	outdent			: {command: 'outdent'},
	s5				: {separator : true },
	unorderedList	: {command: 'insertunorderedlist', tags: ['ul'] },
	s6				: {separator : true },
	font			: {command: 'fontname', select: '\
<select>\
	<option value="">- font -</option>\
	<option value="arial">Arial</option>\
	<option value="comic sans ms">Comic Sans</option>\
	<option value="courier new">Courier New</options>\
	<option value="georgia">Georgia</option>\
	<option value="helvetica">Helvetica</options>\
	<option value="impact">Impact</option>\
	<option value="times new roman">Times</options>\
	<option value="trebuchet ms">Trebuchet</options>\
	<option value="verdana">Verdana</options>\
</select>\
	', tags: ['font']},
	size			: {command: 'fontsize', select: '\
<select>\
	<option value="">-</option>\
	<option value="1">1 (8pt)</option>\
	<option value="2">2 (10pt)</option>\
	<option value="3">3 (12pt)</options>\
	<option value="4">4 (14pt)</option>\
	<option value="5">5 (16pt)</options>\
	<option value="6">6 (18pt)</option>\
	<option value="7">7 (20pt)</options>\
</select>\
	', tags: ['font']},
	color			: {exec: lwrte_color},
	image			: {exec: lwrte_image, tags: ['img'] },
	link			: {exec: lwrte_link, tags: ['a'] },
	unlink			: {command: 'unlink'},
	s8				: {separator : true },
	clear			: {exec: lwrte_clear}
};

var html_toolbar = {
	s1				: {separator: true},
	clear			: {exec: lwrte_clear}
};

/*** tag compare callbacks ***/
function lwrte_block_compare(node, tag) {
	tag = tag.replace(/<([^>]*)>/, '$1');
	return (tag.toLowerCase() == node.nodeName.toLowerCase());
}

/*** init callbacks ***/
function lwrte_style_init(rte) {
	var self = this;
	self.select = '<select><option value="">- no css -</option></select>';

	// load CSS info. javascript only issue is not working correctly, that's why ajax-php :(
	if(rte.css.length) {	
		$.ajax({
			url: "styles.php", 
			type: "POST",
			data: { css: rte.css[rte.css.length - 1] }, 
			async: false,
			success: function(data) {
				var list = data.split(',');
				var select = "";

				for(var name in list)
					select += '<option value="' + list[name] + '">' + list[name] + '</option>';
	
				self.select = '<select><option value="">- css -</option>' + select + '</select>';
			}});
	}
}

/*** exec callbacks ***/
function lwrte_style(args) {
	if(args) {
		try {
			var css = args.options[args.selectedIndex].value
			var self = this;
			var html = self.get_selected_text();
			html = '<span class="' + css + '">' + html + '</span>';
			self.selection_replace_with(html);
			args.selectedIndex = 0;
		} catch(e) {
		}
	}
}

function lwrte_color(){
	var self = this;
	var panel = self.create_panel('Set color for text', 385);
	var mouse_down = false;
	var mouse_over = false;
	panel.append('\
<div class="colorpicker1"><div class="rgb" id="rgb"></div></div>\
<div class="colorpicker1"><div class="gray" id="gray"></div></div>\
<div class="colorpicker2">\
	<div class="palette" id="palette"></div>\
	<div class="preview" id="preview"></div>\
	<div class="color" id="color"></div>\
</div>\
<div class="clear"></div>\
<p class="submit"><button id="ok">Ok</button><button id="cancel">Cancel</button></p>'
).show();

	var preview = $('#preview', panel);
	var color = $("#color", panel);
	var palette = $("#palette", panel);
	var colors = [
		'#660000', '#990000', '#cc0000', '#ff0000', '#333333',
		'#006600', '#009900', '#00cc00', '#00ff00', '#666666',
		'#000066', '#000099', '#0000cc', '#0000ff', '#999999',
		'#909000', '#900090', '#009090', '#ffffff', '#cccccc',
		'#ffff00', '#ff00ff', '#00ffff', '#000000', '#eeeeee'
	];
			
	for(var i = 0; i < colors.length; i++)
		$("<div></div>").addClass("item").css('background', colors[i]).appendTo(palette);
			
	var height = $('#rgb').height();
	var part_width = $('#rgb').width() / 6;

	$('#rgb,#gray,#palette', panel)
		.mousedown( function(e) {mouse_down = true; return false; } )
		.mouseup( function(e) {mouse_down = false; return false; } )
		.mouseout( function(e) {mouse_over = false; return false; } )
		.mouseover( function(e) {mouse_over = true; return false; } );

	$('#rgb').mousemove( function(e) { if(mouse_down && mouse_over) compute_color(this, true, false, false, e); return false;} );
	$('#gray').mousemove( function(e) { if(mouse_down && mouse_over) compute_color(this, false, true, false, e); return false;} );
	$('#palette').mousemove( function(e) { if(mouse_down && mouse_over) compute_color(this, false, false, true, e); return false;} );
	$('#rgb').click( function(e) { compute_color(this, true, false, false, e); return false;} );
	$('#gray').click( function(e) { compute_color(this, false, true, false, e); return false;} );
	$('#palette').click( function(e) { compute_color(this, false, false, true, e); return false;} );

	$('#cancel', panel).click( function() { panel.remove(); return false; } );
	$('#ok', panel).click( 
		function() {
			var value = color.html();

			if(value.length > 0 && value.charAt(0) =='#') {
				if(self.iframe_doc.selection) //IE fix for lost focus
					self.range.select();

				self.editor_cmd('foreColor', value);
			}
					
			panel.remove(); 
			return false;
		}
	);

	function to_hex(n) {
		var s = "0123456789abcdef";
		return s.charAt(Math.floor(n / 16)) + s.charAt(n % 16);
	}			

	function get_abs_pos(element) {
		var r = { x: element.offsetLeft, y: element.offsetTop };

		if (element.offsetParent) {
			var tmp = get_abs_pos(element.offsetParent);
			r.x += tmp.x;
			r.y += tmp.y;
		}

		return r;
	};
			
	function get_xy(obj, event) {
		var x, y;
		event = event || window.event;
		var el = event.target || event.srcElement;

		// use absolute coordinates
		var pos = get_abs_pos(obj);

		// subtract distance to middle
		x = event.pageX  - pos.x;
		y = event.pageY - pos.y;

		return { x: x, y: y };
	}
			
	function compute_color(obj, is_rgb, is_gray, is_palette, e) {
		var r, g, b, c;

		var mouse = get_xy(obj, e);
		var x = mouse.x;
		var y = mouse.y;

		if(is_rgb) {
			r = (x >= 0)*(x < part_width)*255 + (x >= part_width)*(x < 2*part_width)*(2*255 - x * 255 / part_width) + (x >= 4*part_width)*(x < 5*part_width)*(-4*255 + x * 255 / part_width) + (x >= 5*part_width)*(x < 6*part_width)*255;
			g = (x >= 0)*(x < part_width)*(x * 255 / part_width) + (x >= part_width)*(x < 3*part_width)*255	+ (x >= 3*part_width)*(x < 4*part_width)*(4*255 - x * 255 / part_width);
			b = (x >= 2*part_width)*(x < 3*part_width)*(-2*255 + x * 255 / part_width) + (x >= 3*part_width)*(x < 5*part_width)*255 + (x >= 5*part_width)*(x < 6*part_width)*(6*255 - x * 255 / part_width);

			var k = (height - y) / height;

			r = 128 + (r - 128) * k;
			g = 128 + (g - 128) * k;
			b = 128 + (b - 128) * k;
		} else if (is_gray) {
			r = g = b = (height - y) * 1.7;
		} else if(is_palette) {
			x = Math.floor(x / 10);
			y = Math.floor(y / 10);
			c = colors[x + y * 5];
		}

		if(!is_palette)
			c = '#' + to_hex(r) + to_hex(g) + to_hex(b);

		preview.css('background', c);
		color.html(c);
	}
}

function lwrte_image() {
	// removed see hack in create_toolbar
}

function lwrte_unformat() {
	this.editor_cmd('removeFormat');
	this.editor_cmd('unlink');
}

function lwrte_clear() {
	if(confirm('Clear Document?')) 
		this.set_content('');
}

function lwrte_link() {
	var self = this;
    var panel = self.create_panel("Créer un lien", 385);
    panel.append('\
<p><label>Adresse</label><input type="text" id="url" size="30" value="http://">\
<div class="clear"></div>\
<p class="submit"><button id="ok">Ok</button><button id="cancel">Annuler</button></p>'
).show();

	$('#cancel', panel).click( function() { panel.remove(); return false; } );

	var url = $('#url', panel);

	$('#ok', panel).click( 
	  function() {
	    var url = $('#url', panel).val();
	    var target = $('#target', panel).val() || "";
	    var title = $('#title', panel).val() || "";
	
	    if(self.get_selected_text().length <= 0) {
	      alert('Sélectionnez le texte que vous voulez lier!');
	      return false;
	    }
	
	    panel.remove();
	
	    if(url.length <= 7) {
			alert('Veuillez entrer un lien valide');
			return false;
		}
	    self.editor_cmd('unlink');
	
	    if ($.browser.safari) {
			var html = '<a href="' + url + '" target="_blank" title="'+title+'" />' + self.get_selected_text() + '</a>';
			self.editor_cmd("insertHTML", html)
		} else {
			self.editor_cmd('createLink', rte_tag);
			var tmp = $('<span></span>').append($.trim(self.get_selected_html()));
			if(target.length > 0)
				$('a[href*="' + rte_tag + '"]', tmp).attr('target', target);
			if(title.length > 0)
				$('a[href*="' + rte_tag + '"]', tmp).attr('title', title);

			$('a[href*="' + rte_tag + '"]', tmp).attr('href', url);

			//self.selection_replace_with(tmp.html());
		}
		self.set_content($.trim(self.get_content()));
		return false;
	 });
}

// ========================================================================
// ========================================================================
// ========================================================================
/*
 * One Click Upload - jQuery Plugin
 * Copyright (c) 2008 Michael Mitchell - http://www.michaelmitchell.co.nz
 * Patched/fixed by Andrey Gayvoronsky - http://www.gayvoronsky.com
 */
(function($){
	$.fn.upload = function(options) {
		// Merge the users options with our defaults
		options = $.extend({
			name: 'file',
			enctype: 'multipart/form-data',
			action: '',
			autoSubmit: true,
			onSubmit: function() {},
			onComplete: function() {},
			onSelect: function() {},
			params: {}
		}, options);

		return new $.ocupload(this, options);
	},
	
	$.ocupload = function(element, options) {
		// Fix scope problems
		var self = this;
	
		// A unique id so we can find our elements later
		var id = new Date().getTime().toString().substr(8);
		var iframeID = "iframe" + id;
		// Upload Iframe
		var iframe = $(
			'<iframe '+
				'id="'+ iframeID +'" '+
				'name="'+ iframeID + '" '+
				'src="#"'+
			'></iframe>'
		).css({
			display: 'none'
		});
		
		// Form
		var form = $(
			'<form '+
				'method="post" '+
				'class="blopID"' +
				'enctype="'+options.enctype+'" '+
				'action="'+options.action+'?element_id='+options.element_id+'" '+
				'target="'+ iframeID +'"'+
			'></form>'
		).css({
			margin: 0,
			padding: 0
		});
		
		// File Input
		var input = $(
			'<input class="'+options.name+ '" ' +
				'name="'+options.name+'" '+
				'type="file" '+
			'/>'
		).css({
			'width': 'auto',
			'position': 'absolute',
			'right': 0,
			'top': 0,
			'opacity': 0,
			'zoom': 1,
			'filter': 'alpha(opacity=0)',
			'border': 0,
			'font-size': '10em'
		});
	
		// Put everything together
		element.wrap('<div></div>'); //container

		element.wrap(form);
		element.wrap('<span></span>');

		// Find the container and make it nice and snug
		element.parent().css({
			'float': 'left',
			'white-space': 'nowrap',
			'position': 'relative',
			'z-index': 1,
			'left': 0,
			'top': 0,
			'overflow': 'hidden',
			'display': 'inline',
			'border': 0
		});
			
		element.after(input);
		element.parent().parent().after(iframe);
		form = input.parent().parent(); //FIX for correct submiting

		// Watch for file selection
		input.change(function() {
			// Do something when a file is selected.
			self.onSelect();
			
			// Submit the form automaticly after selecting the file
			if(self.autoSubmit) {
				self.submit();
			}
		});
		
		// Methods
		$.extend(this, {
			autoSubmit: options.autoSubmit,
			onSubmit: options.onSubmit,
			onComplete: options.onComplete,
			onSelect: options.onSelect,
		
			// get filename		
			filename: function() {
				return input.attr('value');
			},
			
			// get/set params
			params: function(params) {
				var params = params ? params : false;
				
				if(params) {
					options.params = $.extend(options.params, params);
				}
				else {
					return options.params;
				}
			},
			
			// get/set name
			name: function(name) {
				var name = name ? name : false;
				
				if(name) {
					input.attr('name', value);
				}
				else {
					return input.attr('name');
				}
			},
			
			// get/set action
			action: function(action) {
				var action = action ? action : false;
				
				if(action) {
					form.attr('action', action);
				}
				else {
					return form.attr('action');
				}
			},
			
			// get/set enctype
			enctype: function(enctype) {
				var enctype = enctype ? enctype : false;
				
				if(enctype) {
					form.attr('enctype', enctype);
				}
				else {
					return form.attr('enctype');
				}
			},
			
			// set options
			set: function(obj, value) {
				var value =	value ? value : false;
								
				function option(action, value) {
					switch(action) {
						default:
							throw new Error('[jQuery.ocupload.set] \''+action+'\' is an invalid option.');
							break;
						case 'name':
							self.name(value);
							break;
						case 'action':
							self.action(value);
							break;
						case 'enctype':
							self.enctype(value);
							break;
						case 'params':
							self.params(value);
							break;
						case 'autoSubmit':
							self.autoSubmit = value;
							break;
						case 'onSubmit':
							self.onSubmit = value;
							break;
						case 'onComplete':
							self.onComplete = value;
							break;
						case 'onSelect':
							self.onSelect = value;
							break;
					}
				}				
				
				if(value) {
					option(obj, value);
				}
				else {				
					$.each(obj, function(key, value) {
						option(key, value);
					});
				}
			},
			
			// Submit the form
			submit: function() {
				// Do something before we upload
				self.onSubmit();				
				// add additional paramters before sending
				$.each(options.params, function(key, value) {
					form.append($(
						'<input '+
							'type="hidden" '+
							'name="'+key+'" '+
							'value="'+value+'" '+
						'/>'
					));
				});
				$('.blopID').submit();
			}
		});
	}
})(jQuery);

var wysiwyg; // useful to get the editor back.

function wysiwygSetup(id, picture_action_url, width){
	wysiwyg = $('#' + id).rte({
		element_id : id,
		image_action_url : picture_action_url,
		image_error_message: 'Bad file.',
		width: width,
		controls_rte: rte_toolbar,
		controls_html: html_toolbar
	});
}