/* lwRTE + lwRTE.tb + occupload + blockUI -- pimped by agilitic 
   See bottom for "wysiwygSetup(options)".
*/

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
};
	
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
		$(self.iframe_doc).focus(function() { 
			self.iframe_doc.designMode(); 
		});
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

	$(self.iframe_doc).keyup(function(event) { 
		self.set_selected_controls( self.get_selected_element(), self.controls.rte); 
	});

	// Mozilla CSS styling off
	if(!$.browser.msie)
		self.editor_cmd('styleWithCSS', false);
};
    
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
};
    
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
};
	
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
};

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
};

lwRTE.prototype.get_content = function() {
	return (this.iframe) ? $('body', this.iframe_doc).html() : $(this.textarea).val();
};

lwRTE.prototype.set_content = function(content) {
	(this.iframe) ? $('body', this.iframe_doc).html(content) : $(this.textarea).val(content);
};

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
};

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
};

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
};

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
};

// ========================================================================
// ========================================================================
// ========================================================================
/*
 * Lightweight RTE - jQuery Plugin, v1.2
 * Basic Toolbars
 * Copyright (c) 2009 Andrey Gayvoronsky - http://www.gayvoronsky.com
 */
var rte_tag		= '-rte-tmp-tag-';

/* light toolbar */
var rte_light_toolbar = {
	s1				: {separator: true},
	bold			: {command: 'bold', tags:['b', 'strong']},
	italic			: {command: 'italic', tags:['i', 'em']},
	strikeThrough	: {command: 'strikethrough', tags: ['s', 'strike'] },
	underline		: {command: 'underline', tags: ['u']}
};

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
// 	font			: {command: 'fontname', select: '\
// <select>\
// 	<option value="">- font -</option>\
// 	<option value="arial">Arial</option>\
// 	<option value="comic sans ms">Comic Sans</option>\
// 	<option value="courier new">Courier New</options>\
// 	<option value="georgia">Georgia</option>\
// 	<option value="helvetica">Helvetica</options>\
// 	<option value="impact">Impact</option>\
// 	<option value="times new roman">Times</options>\
// 	<option value="trebuchet ms">Trebuchet</options>\
// 	<option value="verdana">Verdana</options>\
// </select>', tags: ['font']},
	
	heading			: {command: 'formatblock', select: '\
<select>\
	<option value="<p>">Normal</option>\
	<option value="<h1>">Heading 1</option>\
	<option value="<h2>">Heading 2</option>\
	<option value="<h3>">Heading 3</options>\
	<option value="<h4>">Heading 4</option>\
</select>', tags: ['h']},
	
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
		
		// Upload Iframe
		var iframe = $(
			'<iframe '+
				'id="iframe'+id+'" '+
				'name="iframe'+id+'"'+
				'src="#"'+
			'></iframe>'
		).css({
			display: 'none'
		});
		
		// Form
		var form = $(
			'<form '+
				'method="post" '+
				'enctype="'+options.enctype+'" '+
				'action="'+options.action+'?wysiwyg_id='+options.wysiwyg_id+'" '+
				'target="iframe'+id+'"'+
			'></form>'
		).css({
			margin: 0,
			padding: 0
		});
		
		// File Input
		var input = $(
			'<input '+
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
		element.wrap('<li></li>'); //container

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
				this.onSubmit();
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

				// Submit the actual form.
				// In that way, because we don't want jquery events (it fires submit event for other parent form)
				form.get(0).submit();
				
				// Do something after we are finished uploading
				iframe.unbind().load(function() {
					// Get a response from the server in plain text
					var myFrame = document.getElementById(iframe.attr('name'));
					var response = $(myFrame.contentWindow.document.body).text();
					
					// Do something on complete
					self.onComplete(response); //done :D
				});
			}
		});
	}
})(jQuery);
/*!
 * jQuery blockUI plugin
 * Version 2.26 (09-SEP-2009)
 * @requires jQuery v1.2.3 or later
 *
 * Examples at: http://malsup.com/jquery/block/
 * Copyright (c) 2007-2008 M. Alsup
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Thanks to Amir-Hossein Sobhi for some excellent contributions!
 */

;(function($) {

if (/1\.(0|1|2)\.(0|1|2)/.test($.fn.jquery) || /^1.1/.test($.fn.jquery)) {
	alert('blockUI requires jQuery v1.2.3 or later!  You are using v' + $.fn.jquery);
	return;
}

$.fn._fadeIn = $.fn.fadeIn;

// this bit is to ensure we don't call setExpression when we shouldn't (with extra muscle to handle
// retarded userAgent strings on Vista)
var mode = document.documentMode || 0;
var setExpr = $.browser.msie && (($.browser.version < 8 && !mode) || mode < 8);
var ie6 = $.browser.msie && /MSIE 6.0/.test(navigator.userAgent) && !mode;

// global $ methods for blocking/unblocking the entire page
$.blockUI   = function(opts) { install(window, opts); };
$.unblockUI = function(opts) { remove(window, opts); };

// convenience method for quick growl-like notifications  (http://www.google.com/search?q=growl)
$.growlUI = function(title, message, timeout, onClose) {
	var $m = $('<div class="growlUI"></div>');
	if (title) $m.append('<h1>'+title+'</h1>');
	if (message) $m.append('<h2>'+message+'</h2>');
	if (timeout == undefined) timeout = 3000;
	$.blockUI({
		message: $m, fadeIn: 700, fadeOut: 1000, centerY: false,
		timeout: timeout, showOverlay: false,
		onUnblock: onClose, 
		css: $.blockUI.defaults.growlCSS
	});
};

// plugin method for blocking element content
$.fn.block = function(opts) {
	return this.unblock({ fadeOut: 0 }).each(function() {
		if ($.css(this,'position') == 'static')
			this.style.position = 'relative';
		if ($.browser.msie)
			this.style.zoom = 1; // force 'hasLayout'
		install(this, opts);
	});
};

// plugin method for unblocking element content
$.fn.unblock = function(opts) {
	return this.each(function() {
		remove(this, opts);
	});
};

$.blockUI.version = 2.26; // 2nd generation blocking at no extra cost!

// override these in your code to change the default behavior and style
$.blockUI.defaults = {
	// message displayed when blocking (use null for no message)
	message:  '<h1>Please wait...</h1>',

	title: null,	  // title string; only used when theme == true
	draggable: true,  // only used when theme == true (requires jquery-ui.js to be loaded)
	
	theme: false, // set to true to use with jQuery UI themes
	
	// styles for the message when blocking; if you wish to disable
	// these and use an external stylesheet then do this in your code:
	// $.blockUI.defaults.css = {};
	css: {
		padding:	0,
		margin:		0,
		width:		'30%',
		top:		'40%',
		left:		'35%',
		textAlign:	'center',
		color:		'#000',
		border:		'3px solid #aaa',
		backgroundColor:'#fff',
		cursor:		'wait'
	},
	
	// minimal style set used when themes are used
	themedCSS: {
		width:	'30%',
		top:	'40%',
		left:	'35%'
	},

	// styles for the overlay
	overlayCSS:  {
		backgroundColor: '#000',
		opacity:	  	 0.6,
		cursor:		  	 'wait'
	},

	// styles applied when using $.growlUI
	growlCSS: {
		width:  	'350px',
		top:		'10px',
		left:   	'',
		right:  	'10px',
		border: 	'none',
		padding:	'5px',
		opacity:	0.6,
		cursor: 	'default',
		color:		'#fff',
		backgroundColor: '#000',
		'-webkit-border-radius': '10px',
		'-moz-border-radius':	 '10px'
	},
	
	// IE issues: 'about:blank' fails on HTTPS and javascript:false is s-l-o-w
	// (hat tip to Jorge H. N. de Vasconcelos)
	iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank',

	// force usage of iframe in non-IE browsers (handy for blocking applets)
	forceIframe: false,

	// z-index for the blocking overlay
	baseZ: 1000,

	// set these to true to have the message automatically centered
	centerX: true, // <-- only effects element blocking (page block controlled via css above)
	centerY: true,

	// allow body element to be stetched in ie6; this makes blocking look better
	// on "short" pages.  disable if you wish to prevent changes to the body height
	allowBodyStretch: true,

	// enable if you want key and mouse events to be disabled for content that is blocked
	bindEvents: true,

	// be default blockUI will supress tab navigation from leaving blocking content
	// (if bindEvents is true)
	constrainTabKey: true,

	// fadeIn time in millis; set to 0 to disable fadeIn on block
	fadeIn:  200,

	// fadeOut time in millis; set to 0 to disable fadeOut on unblock
	fadeOut:  400,

	// time in millis to wait before auto-unblocking; set to 0 to disable auto-unblock
	timeout: 0,

	// disable if you don't want to show the overlay
	showOverlay: true,

	// if true, focus will be placed in the first available input field when
	// page blocking
	focusInput: true,

	// suppresses the use of overlay styles on FF/Linux (due to performance issues with opacity)
	applyPlatformOpacityRules: true,

	// callback method invoked when unblocking has completed; the callback is
	// passed the element that has been unblocked (which is the window object for page
	// blocks) and the options that were passed to the unblock call:
	//	 onUnblock(element, options)
	onUnblock: null,

	// don't ask; if you really must know: http://groups.google.com/group/jquery-en/browse_thread/thread/36640a8730503595/2f6a79a77a78e493#2f6a79a77a78e493
	quirksmodeOffsetHack: 4
};

// private data and functions follow...

var pageBlock = null;
var pageBlockEls = [];

function install(el, opts) {
	var full = (el == window);
	var msg = opts && opts.message !== undefined ? opts.message : undefined;
	opts = $.extend({}, $.blockUI.defaults, opts || {});
	opts.overlayCSS = $.extend({}, $.blockUI.defaults.overlayCSS, opts.overlayCSS || {});
	var css = $.extend({}, $.blockUI.defaults.css, opts.css || {});
	var themedCSS = $.extend({}, $.blockUI.defaults.themedCSS, opts.themedCSS || {});
	msg = msg === undefined ? opts.message : msg;

	// remove the current block (if there is one)
	if (full && pageBlock)
		remove(window, {fadeOut:0});

	// if an existing element is being used as the blocking content then we capture
	// its current place in the DOM (and current display style) so we can restore
	// it when we unblock
	if (msg && typeof msg != 'string' && (msg.parentNode || msg.jquery)) {
		var node = msg.jquery ? msg[0] : msg;
		var data = {};
		$(el).data('blockUI.history', data);
		data.el = node;
		data.parent = node.parentNode;
		data.display = node.style.display;
		data.position = node.style.position;
		if (data.parent)
			data.parent.removeChild(node);
	}

	var z = opts.baseZ;

	// blockUI uses 3 layers for blocking, for simplicity they are all used on every platform;
	// layer1 is the iframe layer which is used to supress bleed through of underlying content
	// layer2 is the overlay layer which has opacity and a wait cursor (by default)
	// layer3 is the message content that is displayed while blocking

	var lyr1 = ($.browser.msie || opts.forceIframe) 
		? $('<iframe class="blockUI" style="z-index:'+ (z++) +';display:none;border:none;margin:0;padding:0;position:absolute;width:100%;height:100%;top:0;left:0" src="'+opts.iframeSrc+'"></iframe>')
		: $('<div class="blockUI" style="display:none"></div>');
	var lyr2 = $('<div class="blockUI blockOverlay" style="z-index:'+ (z++) +';display:none;border:none;margin:0;padding:0;width:100%;height:100%;top:0;left:0"></div>');
	
	var lyr3;
	if (opts.theme && full) {
		var s = '<div class="blockUI blockMsg blockPage ui-dialog ui-widget ui-corner-all" style="z-index:'+z+';display:none;position:fixed">' +
					'<div class="ui-widget-header ui-dialog-titlebar blockTitle">'+(opts.title || '&nbsp;')+'</div>' +
					'<div class="ui-widget-content ui-dialog-content"></div>' +
				'</div>';
		lyr3 = $(s);
	}
	else {
		lyr3 = full ? $('<div class="blockUI blockMsg blockPage" style="z-index:'+z+';display:none;position:fixed"></div>')
					: $('<div class="blockUI blockMsg blockElement" style="z-index:'+z+';display:none;position:absolute"></div>');
	}						   

	// if we have a message, style it
	if (msg) {
		if (opts.theme) {
			lyr3.css(themedCSS);
			lyr3.addClass('ui-widget-content');
		}
		else 
			lyr3.css(css);
	}

	// style the overlay
	if (!opts.applyPlatformOpacityRules || !($.browser.mozilla && /Linux/.test(navigator.platform)))
		lyr2.css(opts.overlayCSS);
	lyr2.css('position', full ? 'fixed' : 'absolute');

	// make iframe layer transparent in IE
	if ($.browser.msie || opts.forceIframe)
		lyr1.css('opacity',0.0);

	$([lyr1[0],lyr2[0],lyr3[0]]).appendTo(full ? 'body' : el);
	
	if (opts.theme && opts.draggable && $.fn.draggable) {
		lyr3.draggable({
			handle: '.ui-dialog-titlebar',
			cancel: 'li'
		});
	}

	// ie7 must use absolute positioning in quirks mode and to account for activex issues (when scrolling)
	var expr = setExpr && (!$.boxModel || $('object,embed', full ? null : el).length > 0);
	if (ie6 || expr) {
		// give body 100% height
		if (full && opts.allowBodyStretch && $.boxModel)
			$('html,body').css('height','100%');

		// fix ie6 issue when blocked element has a border width
		if ((ie6 || !$.boxModel) && !full) {
			var t = sz(el,'borderTopWidth'), l = sz(el,'borderLeftWidth');
			var fixT = t ? '(0 - '+t+')' : 0;
			var fixL = l ? '(0 - '+l+')' : 0;
		}

		// simulate fixed position
		$.each([lyr1,lyr2,lyr3], function(i,o) {
			var s = o[0].style;
			s.position = 'absolute';
			if (i < 2) {
				full ? s.setExpression('height','Math.max(document.body.scrollHeight, document.body.offsetHeight) - (jQuery.boxModel?0:'+opts.quirksmodeOffsetHack+') + "px"')
					 : s.setExpression('height','this.parentNode.offsetHeight + "px"');
				full ? s.setExpression('width','jQuery.boxModel && document.documentElement.clientWidth || document.body.clientWidth + "px"')
					 : s.setExpression('width','this.parentNode.offsetWidth + "px"');
				if (fixL) s.setExpression('left', fixL);
				if (fixT) s.setExpression('top', fixT);
			}
			else if (opts.centerY) {
				if (full) s.setExpression('top','(document.documentElement.clientHeight || document.body.clientHeight) / 2 - (this.offsetHeight / 2) + (blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"');
				s.marginTop = 0;
			}
			else if (!opts.centerY && full) {
				var top = (opts.css && opts.css.top) ? parseInt(opts.css.top) : 0;
				var expression = '((document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + '+top+') + "px"';
				s.setExpression('top',expression);
			}
		});
	}

	// show the message
	if (msg) {
		if (opts.theme)
			lyr3.find('.ui-widget-content').append(msg);
		else
			lyr3.append(msg);
		if (msg.jquery || msg.nodeType)
			$(msg).show();
	}

	if (($.browser.msie || opts.forceIframe) && opts.showOverlay)
		lyr1.show(); // opacity is zero
	if (opts.fadeIn) {
		if (opts.showOverlay)
			lyr2._fadeIn(opts.fadeIn);
		if (msg)
			lyr3.fadeIn(opts.fadeIn);
	}
	else {
		if (opts.showOverlay)
			lyr2.show();
		if (msg)
			lyr3.show();
	}

	// bind key and mouse events
	bind(1, el, opts);

	if (full) {
		pageBlock = lyr3[0];
		pageBlockEls = $(':input:enabled:visible',pageBlock);
		if (opts.focusInput)
			setTimeout(focus, 20);
	}
	else
		center(lyr3[0], opts.centerX, opts.centerY);

	if (opts.timeout) {
		// auto-unblock
		var to = setTimeout(function() {
			full ? $.unblockUI(opts) : $(el).unblock(opts);
		}, opts.timeout);
		$(el).data('blockUI.timeout', to);
	}
};

// remove the block
function remove(el, opts) {
	var full = (el == window);
	var $el = $(el);
	var data = $el.data('blockUI.history');
	var to = $el.data('blockUI.timeout');
	if (to) {
		clearTimeout(to);
		$el.removeData('blockUI.timeout');
	}
	opts = $.extend({}, $.blockUI.defaults, opts || {});
	bind(0, el, opts); // unbind events
	
	var els;
	if (full) // crazy selector to handle odd field errors in ie6/7
		els = $('body').children().filter('.blockUI').add('body > .blockUI');
	else
		els = $('.blockUI', el);

	if (full)
		pageBlock = pageBlockEls = null;

	if (opts.fadeOut) {
		els.fadeOut(opts.fadeOut);
		setTimeout(function() { reset(els,data,opts,el); }, opts.fadeOut);
	}
	else
		reset(els, data, opts, el);
};

// move blocking element back into the DOM where it started
function reset(els,data,opts,el) {
	els.each(function(i,o) {
		// remove via DOM calls so we don't lose event handlers
		if (this.parentNode)
			this.parentNode.removeChild(this);
	});

	if (data && data.el) {
		data.el.style.display = data.display;
		data.el.style.position = data.position;
		if (data.parent)
			data.parent.appendChild(data.el);
		$(data.el).removeData('blockUI.history');
	}

	if (typeof opts.onUnblock == 'function')
		opts.onUnblock(el,opts);
};

// bind/unbind the handler
function bind(b, el, opts) {
	var full = el == window, $el = $(el);

	// don't bother unbinding if there is nothing to unbind
	if (!b && (full && !pageBlock || !full && !$el.data('blockUI.isBlocked')))
		return;
	if (!full)
		$el.data('blockUI.isBlocked', b);

	// don't bind events when overlay is not in use or if bindEvents is false
	if (!opts.bindEvents || (b && !opts.showOverlay)) 
		return;

	// bind anchors and inputs for mouse and key events
	var events = 'mousedown mouseup keydown keypress';
	b ? $(document).bind(events, opts, handler) : $(document).unbind(events, handler);

// former impl...
//	   var $e = $('a,:input');
//	   b ? $e.bind(events, opts, handler) : $e.unbind(events, handler);
};

// event handler to suppress keyboard/mouse events when blocking
function handler(e) {
	// allow tab navigation (conditionally)
	if (e.keyCode && e.keyCode == 9) {
		if (pageBlock && e.data.constrainTabKey) {
			var els = pageBlockEls;
			var fwd = !e.shiftKey && e.target == els[els.length-1];
			var back = e.shiftKey && e.target == els[0];
			if (fwd || back) {
				setTimeout(function(){focus(back)},10);
				return false;
			}
		}
	}
	// allow events within the message content
	if ($(e.target).parents('div.blockMsg').length > 0)
		return true;

	// allow events for content that is not being blocked
	return $(e.target).parents().children().filter('div.blockUI').length == 0;
};

function focus(back) {
	if (!pageBlockEls)
		return;
	var e = pageBlockEls[back===true ? pageBlockEls.length-1 : 0];
	if (e)
		e.focus();
};

function center(el, x, y) {
	var p = el.parentNode, s = el.style;
	var l = ((p.offsetWidth - el.offsetWidth)/2) - sz(p,'borderLeftWidth');
	var t = ((p.offsetHeight - el.offsetHeight)/2) - sz(p,'borderTopWidth');
	if (x) s.left = l > 0 ? (l+'px') : '0';
	if (y) s.top  = t > 0 ? (t+'px') : '0';
};

function sz(el, p) {
	return parseInt($.css(el,p))||0;
};

})(jQuery);


var wysiwyg = new Array(); // useful to get the editor back.

/* -----------------------------------------------------------------------------
   -----------------------------------------------------------------------------*/

function wysiwygSetup(options){			
	$('#' + options.textarea_id).rte({
		element_id : options.textarea_id,
		width: options.width || 600,
		controls_rte: (options.light_editor ? rte_light_toolbar : rte_toolbar),
		controls_html: html_toolbar
	}, wysiwyg);
		
	if(options.picture_action_url){
		// add an image link to the wysiwyg menu bar
		var link_id = "link_image_" + options.textarea_id;
		var image_link = $('<a class="image" id="' + link_id + '" href="" title="image" rel="image">c</a>');
		var content = $('iframe#' + options.textarea_id);
		var ul_menu = content.siblings().children("ul");
		ul_menu.append('<li class="separator"/>');
		ul_menu.append(image_link);

		$("#" + link_id ).upload({
	       	name: 'file',
			enctype: 'multipart/form-data',
			params : {},
			action: options.picture_action_url,
			wysiwyg_id: options.textarea_id, //so that it knows which wysiwyg to update
			autoSubmit: false,
			onSelect: function() {
				for(var i=0; i<10000; i++) {}
				var file = this.filename();
				var ext = (/[.]/.exec(file)) ? /[^.]+$/.exec(file.toLowerCase()) : '';
				if(!(ext && /^(jpg|png|jpeg|gif)$/.test(ext))){
					alert("Not valid image");
					return;
				}
				$.blockUI({ message:'<img src="/wysiwyg/images/spinner.gif"/>'});
				this.submit();
			}
		});
	}	
}