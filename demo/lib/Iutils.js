/** \brief Utilities Implementation
    provides functionality that is commonly useful
  */
function Iutils(){
}
/** \brief Create Action Button
    Creates a Action Button using jqueryUI
    sets the language-dependent attributes and binds a click handler
    @jq_dom_object could be a container where the button will be appended to or a button wich attributes will be set/changed
  */
Iutils.prototype.actionButton = function (   /*JQueryDOMObject*/ jq_dom_object , /*STRING*/ name , /*JSFunction*/ click_callback){
  //INIT
  var self = this;
  //START
  var button;
  var append = true;
  if ( jq_dom_object.is('button') ){
    button = jq_dom_object;
    append = false;
  } else {
    button = $('<button/>');
  }
  var title = utils.tr_action_title(name);
  //CODE
  //if ( typeof button.button === 'function' ){
  //  button.button({
  //     icons: { primary: 'ui-icon-' + name + '-p' }
  //  });
  //} else { 
  //  button.addClass('action_button');
  //  console.warn('jquery-ui not loaded, basic buttons used');
  //}
  button.addClass('action_button');
  if ( title.indexOf('class="untranslated"')> 0 ){
    title = utils.tr(name);
  }
  if ( title.indexOf('class="untranslated"')> 0 ){
    button.html(title);
  } else {
    button.text(title);
  }
  button.attr('title',utils.tr_action_tooltip(name));
  button.attr('rel',name);

  if ( typeof click_callback === 'function' ){
    //if action buttons should be trigger something else,
    //do it in the click_callback not by binding multiple handler
    //so here we unbind all clickhandler
    button.unbind('click');
    button.bind('click',click_callback);
  }
  if ( append ){
    jq_dom_object.append(button);
  }
  //TERM
  return $(button);
};


/** \brief Create Action Button
    Creates a Action Button using jqueryUI using only the icon of the button
    sets the language-dependent attributes and binds a click handler
  */
Iutils.prototype.actionIconButton = function (   /*JQueryDOMObject*/ jq_dom_object , /*STRING*/ name , /*JSFunction*/ click_callback){
  //INIT
  var self = this;
  //START
  var button;
  var append = true;
  if ( jq_dom_object.is('button') ){
    button = jq_dom_object;
    append = false;
  } else {
    button = $('<button/>');
  }
  //CODE
  if ( typeof button.button === 'function' ){
    button.button({
       icons: { primary: 'ui-icon-' + name + '-p' }
     , text: false
     , label: utils.tr_action_title(name)
    });
  } else {
    console.warn('jquery-ui not loaded, basic buttons used');
  }
  button.attr('title',utils.tr_action_tooltip(name));
  button.attr('rel',name);
  if ( typeof click_callback === 'function' ){
    button.bind('click',click_callback);
  }
  if ( append ){
    jq_dom_object.append(button);
  }
  //TERM
  return $(button);
};

/** \brief no title
    no description
  */
Iutils.prototype.getTextNodesIn = function (   /*DOMNode*/ dom_node , /*Boolean*/ include_whitespace_nodes){
  //INIT
  var self = this;
  //START
  var node = dom_node;
  var text_nodes = [], whitespace = /^\s*$/;
  var get_text_nodes_fn = function(node) {
    if ( node.nodeType == 3 ) {
      if (include_whitespace_nodes || !whitespace.test(node.nodeValue)) {
        text_nodes.push(node);
      }
    } else {
      for ( var i = 0, len = node.childNodes.length; i < len; ++i ) {
        get_text_nodes_fn(node.childNodes[i]);
      }
    }
  };
  //CODE
  get_text_nodes_fn(dom_node);
  //TERM
  return text_nodes;
};


/** \brief Translate String
    Returns the given string translated in the currently active language
  */
Iutils.prototype.tr = function (   /*STRING*/ string){
  //INIT
  var self = this;
  //CODE
  return string;
};

/** \brief no title
    no description
  */
Iutils.prototype.tr_action_title = function (   /*STRING*/ string){
  //INIT
  var self = this;
  //CODE
  return string;
};

/** \brief Translate Action Tooltip
    returns the tooltip defined for the action identified by string
  */
Iutils.prototype.tr_action_tooltip = function (   /*STRING*/ string){
  //INIT
  var self = this;
  //CODE
  return string;
};
var utils = new Iutils();
var exports = exports || {};
// Firefox
exports.utils = utils;