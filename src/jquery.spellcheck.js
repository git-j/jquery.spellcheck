
/* \brief Spellcheck Dialog
          Checks every word in a configurable container and allows the user to select from a list of suggestions, go to the next/previous misspelled word and ignore or add the selected word.
          requires:
          utils.getTextNodesIn returning all text-nodes for the given DOMElement
          utils.tr for translating ui-elements
          utils.actionButton for translating buttons
          rangy for selecting the misspelled words
          XRegExp for splitting words
          jquery.selectBox for changing the language
*/
$(function($, undefined){
  $.widget('refeus.spellcheck', {
      view_template: function ( /*JSObject*/ obj ){
        // JST like view template generated from ODE
        // when you change here, please consider to write html (myname.ejs), compile it (somehow) to jst and commit both
        if ( typeof obj ==='undefined' ){
          obj = {};
        }
        var __t, __p = '';
        with ( obj ) {
          __p+= '<span class="btn btn-defaut btn-close pull-right">&times;</span>\n<h1>\n<span class="title">'
             + ((__t = ( utils.tr('spellcheck') )) === null ? '': __t) + '</span>\n<span class="spell-results">(<span class="misspelled-count"></span><span class="misspelled-separator">&nbsp;/&nbsp;</span><span class="word-count"></span>)</span>\n</h1>\n<div class="dialog">\n  <div class="row">\n    <div class="col-6">\n      <h2>'
             + ((__t = ( utils.tr('misspelled') )) === null ? '': __t) + '</h2>\n      <div class="misspelled-word"><span class="label"></span></div>\n    </div>\n    <div class="col-6 suggestions">\n      <h2>'
             + ((__t = ( utils.tr('suggestions') )) === null ? '': __t) + '</h2>\n      <div class="guess-list">\n        <ul></ul>\n      </div>\n      <div class="dictionary-select">\n        <select></select>\n      </div>\n    </div>\n  </div>\n  <div class="actions row fixed-bottom">\n    <button type="button" class="btn reset">Reset</button>\n    <button type="button" class="btn learn">Learn</button>\n    <button type="button" class="btn ignore">Ignore</button>\n    <button type="button" class="btn btn-primary next-word">NextWord</button>\n    <span class="pull-right">\n      <input type="text" class="replacement-text"></input>\n      <button type="button" class="btn replace">Replace</button>\n      <button type="button" class="btn replace-all">ReplaceAll</button>\n    </span>\n  </div>\n</div>';
        }
        return __p;
      }
    , options: {
          /* Always Scroll Body
           * instead of scrolling a container of the given editable(s), scroll the page
           * type: Boolean
           */
          'always_scroll_body': false
          /* Check Word
           * Callback that checks the given word for correct spelling. Return true when the word is spelled correctly, false otherwise
           * type: JSFunction
           */
        , 'checkWord': function(/*STRING*/word){ return false; }
          /* Check Element
           * Element that is (continously) checked for spelling misstakes
           * type: JQDOMObject
           */
        , 'check_elements': $('body')
          /* Check on Input
           * Check the entire check_element whenever a input is triggered
           * type: Boolean
           */
        , 'check_on_input': false
          /* Count Words
           * Count number of words
           * type: Boolean
           */
        , 'count_words': false
          /* Get Dictionaries
           * Get a List of Dictionaries that may be used for checking the text.
           * type: JSFunction
           */
        , 'getDictionaries': function(){ return []; }
          /* GetSpellcheck Guesses
           * Callback that returns a JSON array with guesses
           * type: JSFunction
           */
        , 'getGuesses': function(/*STRING*/word){ return []; }
          /* Ignore word in current Session
           * Callback that stores the given word into a session-only store to avoid highlighting the given word again
           * type: JSFunction
           */
        , 'ignoreWord': function(/*STRING*/word){  }
          /* Learn Word
           * Callback that stores the given word into a persistents store to avoid highlighting the given word again
           * type: JSFunction
           */
        , 'learnWord': function(/*STRING*/word){  }
          /* Minimized Startup
           * Display the dialog when the plugin is displayed (false) or initialize in minimized mode (true,default)
           * type: Boolean
           */
        , 'minimized': true
          /* Recheck Timeout
           * number of miliseconds that a recheck of the document should occur at max
           * type: INT
           */
        , 'recheck_timeout': 1000
          /* Selected Dictionary
           * Option that controls the initial selection of the Dictionary
           * type: String
           */
        , 'selected_dictionary': 'en_US'
          /* Set Dictionary
           * Set the Dictionary Language (from the list of available Dictionaries)
           * type: JSFunction
           */
        , 'setDictionary': function(/*STRING*/language){}
      }
      /* \brief no title current_check_element
       *         no description
       */
    , 'current_check_element': null // JQDOMObject
      /* \brief no title current_word
       *         no description
       */
    , 'current_word': '' // String
      /* \brief no title current_word_selection
       *         no description
       */
    , 'current_word_selection': null // RangySerializedSelection
      /* \brief no title misspelled_count_element
       *         no description
       */
    , 'misspelled_count_element': null // JQDOMObject
      /* \brief no title search_word_offset
       *         no description
       */
    , 'search_word_offset': 0 // INT
      /* \brief no title word_count_element
       *         no description
       */
    , 'word_count_element': null // JQDOMObject
      /* \brief no title word_split_regexp
       *         no description
       */
    , 'word_split_regexp': null // RegExp
      /* \brief no title changed_timer
       *         no description
       */
    , 'changed_timer': null // setTimeout id
    /* \brief Constructor
              Initilalize the plugin with the given options and trigger initial check of the editable(s)
    */
    , _create: function(){
        //SELF
        var self = this;
        //INIT
        self.$el = $(self.element);
        self.original_html = self.$el.html();
        self.$el.empty();
        self.$el.html(self.view_template(self));
        self.$el.addClass('spellcheck');
        //CODE
        self.word_split_regexp = new RegExp('\\W');
        if ( typeof XRegExp === 'function' ){
          self.word_split_regexp = new XRegExp('\\P{L}');
        }
        self.word_count_element = $('.word-count',self.$el);
        self.misspelled_count_element = $('.misspelled-count',self.$el);
        self._bindActions();
        self._bindEvents();
        if ( !self.options.check_on_input ){
          $('.header .misspelled-count',self.$el).addClass('hidden');
          $('.header .misspelled-separator',self.$el).addClass('hidden');
        }
        if ( self.options.check_on_input
          && !self.options.count_words
          ){
          $('.header .misspelled-separator',self.$el).addClass('hidden');
        }
        self._setupDictionaries();
        self._textChanged();
        if ( self.options.minimized ){
          self.hide();
        } else {
          self.show();
        }
      }
    /* \brief no title ~spellcheck
              no description
    */
    , _destroy: function(){
        //SELF
        var self = this;
        //CODE
        self.$el.html(self.original_html);
      }
    /* \brief Bind action buttons
              Bind the private member functions with actions given in the template
    */
    , _bindActions: function(){
        //SELF
        var self = this;
        //CODE
        $('.actions button',self.$el).each(function(index,item){
          var button = $(item);
          var action_name = button.text();
          utils.actionIconButton(button,action_name,$.proxy(self['_' + action_name.toLowerCase() + 'Action'],self));
        });
        $('.btn-close',self.$el).bind('click',$.proxy(self.hide,self));
        $('h1',self.$el).bind('click',$.proxy(self.toggle,self));
        $('h1',self.$el).css({'cursor':'pointer'});
      }
    /* \brief Bind Events
              Bind events to elements that were generated by the widget
    */
    , _bindEvents: function(){
        //SELF
        var self = this;
        //CODE
        if ( self.options.check_elements.length
          && ( self.options.check_on_input
            || self.options.count_words
            )
          ){
          self.options.check_elements.unbind('keyup',$.proxy(self._textChanged,self));
          self.options.check_elements.bind('keyup',$.proxy(self._textChanged,self));
        }
        $('.dictionary-select select').bind('change',$.proxy(self._dictionaryChanged,self));
      }
    /* \brief Check
              Enhanced check word that takes context into account.
              tries to check a misspelled word for correctness with appended '.' (eg Dr. Prof.), with prepended colon (eg '-transfer') combined with the following word (if any) (eg it's, ain't)
    */
    , _checkWord: function(/* String */word, /* JSONObject */js_data){
        //SELF
        var self = this;
        //CODE
        if ( self.options.checkWord(word) ){
          return true;
        }
        if ( self.options.checkWord(word + '.') ){
          return true;
        }
        if ( self.options.checkWord('-' + word) ){
          return true;
        }
        if ( js_data.index < js_data.words.length - 1){
          if ( self.options.checkWord(word + "'" + js_data.words[js_data.index + 1]) ){
            return true;
          }
          if ( self.options.checkWord(word + decodeURIComponent('%E2%80%99') + js_data.words[js_data.index + 1]) ){
            return true;
          }
        }
        //END
        return false;
      }
    /* \brief Corrected Event
              update the display without recount after the current selection has been replaced.
              This optimisation is not run, when replaceallAction is excuted
    */
    , _corrected: function(){
        //SELF
        var self = this;
        //START
        var misspelled_count = 0;
        //CODE
        misspelled_count = parseInt(self.misspelled_count_element.text(),10);
        if ( misspelled_count <= 0
          || isNaN(misspelled_count)
          ){
          misspelled_count = 0;
        } else {
          misspelled_count--;
        }
        self.misspelled_count_element.text(misspelled_count);
        self._displayError( misspelled_count !== 0 );
      }
    /* \brief Dictionary Changed
              The dictionary has been changed by the user. set the selection and restart checking the document
    */
    , _dictionaryChanged: function(/* DOMEvent */dom_event){
        //SELF
        var self = this;
        //START
        var selected_value = '';
        //CODE
        selected_value = $('.dictionary-select select').val();
        if ( selected_value === '' ){
          selected_value = 'en_US';
        }
        self.options.setDictionary(selected_value);
        self.options.selected_dictionary = selected_value;
        self.$el.trigger('dictionary_changed',[selected_value]);
        self._resetAction();
      }
    /* \brief no title _displayEnd
              no description
    */
    , _displayEnd: function(){
        //SELF
        var self = this;
        //CODE
        self.hide();
      }
    /* \brief Display Error
              Update the spellcheck display when errors occur.  set the 'success' class to the widget, when no errors have occured and remove elements that are useless in that case
    */
    , _displayError: function(/* Boolean */has_error){
        //SELF
        var self = this;
        //CODE
        if ( has_error ){
          $('button.replace-all, button.replace, input.replacement-text, button.next-word, button.ignore, button.learn, .row:first-child',self.$el).removeClass('hidden');
          self.$el.removeClass('success');
        } else {
          self.hide();
          $('button.replace-all, button.replace, input.replacement-text, button.next-word, button.ignore, button.learn, .row:first-child',self.$el).addClass('hidden');
          self.$el.addClass('success');
        }
      }
    /* \brief Get and Display Guesses
              get spellcheck guesses for the current selection.
              This function expects a single word to be selected and will update the guess-list with suggestions.
              When the user selects a guess, the selection is replaced with the user's selection. When the user changes the cursor before changing the selection
    */
    , _displayGuesses: function(){
        //SELF
        var self = this;
        //START
        var guesses = [];
        var suggestions = $('.suggestions',self.$el);
        var guess_list = $('.guess-list ul',self.$el);
        var misspelled_word = $('.misspelled-word .label',self.$el);
        var selection = rangy.getSelection();
        var word = selection.toString();
        //CODE
        if ( word.trim() === ''
          || !self.current_check_element
          ){
          return;
        }
        suggestions.addClass('hidden');
        guesses = self.options.getGuesses(word);
        misspelled_word.text(word);
        self.current_word_selection = rangy.serializeSelection(selection,true,self.current_check_element);
        self.current_word = word;
        guess_list.empty();
        $.each(guesses,function(index,guess){
          var guess_list_item = $('<li>');
          var guess_button = $('<button type="button">');
          guess_button.text(guess);
          guess_list_item.append(guess_button);
          guess_list.append(guess_list_item);
        });
        if ( guesses.length ){
          $('li',guess_list).bind('click',$.proxy(self._selectCorrectionAction,self));
          $('li',guess_list).bind('dblclick',$.proxy(self._selectCommitCorrectionAction,self));
          self._selectCorrectionAction({target:$('li:first',guess_list)[0]});
          suggestions.removeClass('hidden');
        } else {
          self._selectCorrectionAction({target:document.createTextNode(word)});
        }
      }
    /* \brief Ignore current word in current session
              Adds the current word to the session-ignore-list.Recount document errors as multiple occurences may be obsolete after ignoring.
    */
    , _ignoreAction: function(/* DOMEvent */dom_event){
        //SELF
        var self = this;
        //CODE
        self.options.ignoreWord(self.current_word);
        self.resumeSearch();
        self._textChanged();
      }
    /* \brief Learn the current word
              Store the selected word in the personal dictionary. Recount document errors as multiple occurences may be obsolete after learning.
    */
    , _learnAction: function(/* DOMEvent */dom_event){
        //SELF
        var self = this;
        //CODE
        self.options.learnWord(self.current_word);
        self.resumeSearch();
        self._textChanged();
      }
    /* \brief Advance to next misspelled word
              no description
    */
    , _nextwordAction: function(/* DOMEvent */dom_event){
        //SELF
        var self = this;
        //CODE
        self.search_word_offset+= 1;
        self.resumeSearch();
      }
    /* \brief Replace selected occurence
              Replaces only the selected occurence with the selected/edited occurence
    */
    , _replaceAction: function(){
        //SELF
        var self = this;
        //CODE
        if ( !self.current_check_element ){
          console.error('invalid check element');
          self._resetAction();
          return;
        }
        var selected_replacement_text = $('.replacement-text',self.$el).val();
        if ( self.current_word_selection
          && rangy.deserializeSelection(self.current_word_selection,self.current_check_element)
          ){
          selection = rangy.getSelection();
          if ( selection.rangeCount ){
            range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(selected_replacement_text));
            self.options.check_elements.addClass('isModified');
            self.options.check_elements.trigger('modified');
            self.resumeSearch();
            self._corrected();
          } else {
            console.error('invalid selection range count');
            self._resetAction();
          }
        } else {
          console.error('invalid stored selection');
          self._resetAction();
        }
      }
    /* \brief Replace All Occurences
              Replace all occurences (in all editables) with the selected/edited replacement
    */
    , _replaceallAction: function(){
        //SELF
        var self = this;
        //START
        var changes = [];
        var changed_editables = {};
        var completed_changes = false;
        //CODE
        if ( !self.current_check_element ){
          console.error('invalid check element');
          self._resetAction();
          return;
        }
        var selected_replacement_text = $('.replacement-text',self.$el).val();
        if ( self.current_word === selected_replacement_text ){
          return;
        }
        selection = rangy.getSelection();
        //loop over text
        while ( !completed_changes ){
          completed_changes = true; // assume occurence is not found
          $.each(self.options.check_elements,function(index,check_element){
            var text_nodes = utils.getTextNodesIn(check_element);
            $.each(text_nodes,function(index,item){
              item_words = item.data.split(self.word_split_regexp);
              var node_pos = 0;
              $.each(item_words,function(index,item_word){
                if ( item_word !== self.current_word ){
                  node_pos+= item_word.length + 1; // +self.word_split_regexp
                  return true; // continue
                }
                range = rangy.createRange();
                range.setStart(item,node_pos);
                range.setEnd(item,node_pos + item_word.length);
                range.deleteContents();
                range.insertNode(document.createTextNode(selected_replacement_text));
                $(check_element).addClass('isModified');
                var check_element_id = $(check_element).attr('id');
                var check_element_parent = $(check_element).parent();
                while ( check_element_parent.length ){
                  check_element_id+= check_element_parent.attr('id');
                  check_element_parent = check_element_parent.parent();
                }
                if ( check_element_id !== '' ){
                  changed_editables[check_element_id] = $(check_element);
                }
                node_pos+= item_word.length + 1; // +self.word_split_regexp
                completed_changes = false; // break parent loops
                return false; // break;
              });
              return completed_changes; // break / continue
            });
            return completed_changes; // break / continue
          });
        }
        $.each(changed_editables,function(key,item){
          item.trigger('modified');
        });
        self._resetAction();
      }
    /* \brief Reset Action
              Resets the spellcheck to recheck from the document beginning. Words that have been skipped will be highlighted again
    */
    , _resetAction: function(){
        //SELF
        var self = this;
        //CODE
        self.search_word_offset = 0;
        self.current_word_selection = null;
        self.current_check_element = null;
        self._textChanged();
        self.resumeSearch();
      }
    /* \brief Select and Commit the Correction
              Selects the guess and commits the selection to replace the single occurence
    */
    , _selectCommitCorrectionAction: function(/* DOMEvent */dom_event){
        //SELF
        var self = this;
        //CODE
        self._selectCorrectionAction(dom_event);
        self._replaceAction(dom_event);
      }
    /* \brief Select Correction
              Select a correction from the given guesslist
    */
    , _selectCorrectionAction: function(/* DOMEvent */dom_event){
        //SELF
        var self = this;
        //START
        var selected_value = '';
        //CODE
        if ( typeof dom_event === 'object'
          && typeof dom_event.target === 'object'
          ){
          selected_value = $(dom_event.target).text();
        }
        $('.replacement-text',self.$el).val(selected_value);
      }
    /* \brief no title _setupDictionaries
              no description
    */
    , _setupDictionaries: function(){
        //SELF
        var self = this;
        //START
        var dictionaries = self.options.getDictionaries();
        var language_select = $('.dictionary-select select',self.$el);
        //CODE
        language_select.empty();
        $.each(dictionaries,function(index,dictionary){
          var language_option = $('<option>');
          language_option.attr('value',dictionary);
          language_option.text(dictionary);
          if ( dictionary.indexOf(self.options.selected_dictionary) === 0 ){
            language_option.attr('selected','selected');
            self.options.setDictionary(dictionary);
          }
          language_select.append(language_option);
        });
      }
    /* \brief Text Changed event
              When the editable(s) change, recheck the document to update the misspelled/wordcount
    */
    , _textChanged: function(/* DOMEvent */dom_event){
        //SELF
        var self = this;
        //START
        var word_count = 0;
        var misspelled_count = 0;
        //CODE
        if ( typeof dom_event === 'object'
          && typeof dom_event.keyCode === 'number'
          && ( dom_event.keyCode === 13  //\n
            || dom_event.keyCode === 9   //\t
            || dom_event.keyCode === 16  // shift
            || dom_event.keyCode === 17  // ctrl
            || dom_event.keyCode === 18  // alt
            || dom_event.keyCode === 91  // winleft
            || dom_event.keyCode === 92  // winright
            || dom_event.keyCode === 33  // page-up
            || dom_event.keyCode === 34  // page-down
            || dom_event.keyCode === 37  // left
            || dom_event.keyCode === 38  // up
            || dom_event.keyCode === 39  // right
            || dom_event.keyCode === 40  // down
            )
          ){
          // skip movement
          return;
        }
        if ( self.word_count_element.text() === ''
          || self.misspelled_count_element.text() === ''
          ){
          // initial load - waiting for first timeout
          $('.spell-results',self.$el).addClass('hidden');
        }
        if ( !self.options.check_elements.length ){
          console.error('invalid check element');
          self.$el.addClass('hidden');
          return;
        }
        self.$el.removeClass('hidden');
        if ( self.changed_timer ){
          window.clearTimeout(self.changed_timer);
        }
        self.changed_timer = window.setTimeout(function(){
          // recount words, recount misspelled
          console.time('recount words');
          $.each(self.options.check_elements,function(index,check_element){
            text_nodes = utils.getTextNodesIn(check_element);
            $.each(text_nodes,function(index,item){
              item_words = item.data.split(self.word_split_regexp);
              $.each(item_words,function(index,item_word){
                if ( item_word.trim() === '' ){
                  return; // continue;
                }
                if ( self.options.check_on_input
                  && !self._checkWord(item_word,{index:index,words:item_words})
                  ){
                  misspelled_count++;
                }
                word_count++;
              });
            });
          });
          console.timeEnd('recount words');
          self.word_count_element.text(word_count);
          self.misspelled_count_element.text(misspelled_count);
          self._displayError( misspelled_count !== 0 );
          if ( $('.spell-results',self.$el).hasClass('hidden') ){
            $('.spell-results',self.$el).removeClass('hidden');
            $('.spell-results',self.$el).fadeIn();
          }
        },self.options.recheck_timeout);
      }
    /* \brief Hide the Spellcheck dialog
              Minimize the Dialog to
    */
    , hide: function(){
        //SELF
        var self = this;
        //CODE
        $('.btn-close',self.$el).addClass('hidden');
        $('.dialog',self.$el).addClass('hidden');
        self.$el.addClass('minimized');
        self.$el.trigger('minimized');
        var language_select = $('.dictionary-select select',self.$el);
        if ( typeof language_select.selectBox === 'function' ){
          language_select.selectBox('destroy');
        }
      }
    /* \brief Resume Search
              Search the next occurence of a misspelled word and highlight it with displaying guesses.
              honors the search_word_offset
    */
    , resumeSearch: function(){
        //SELF
        var self = this;
        //START
        var word_index = 0;
        var range;
        var continue_search = true;
        //CODE
        if ( !self.options.check_elements.length ){
          return;
        }
        $.each(self.options.check_elements,function(index,check_element){
          var text_nodes = utils.getTextNodesIn(check_element);
          self.current_check_element = check_element;
          
          $.each(text_nodes,function(index,item){
            item_words = item.data.split(self.word_split_regexp);
            var node_pos = 0;
            $.each(item_words,function(index,item_word){
              if ( item_word.trim() === '' ){
                node_pos+= item_word.length + 1; // +self.word_split_regexp
                return true; // continue
              }
              word_index++;
              if ( word_index < self.search_word_offset ){
                node_pos+= item_word.length + 1; // +self.word_split_regexp
                return true; // continue
              }
              if ( !self._checkWord(item_word,{index:index,words:item_words}) ){
                range = rangy.createRange();
                range.setStart(item,node_pos);
                range.setEnd(item,node_pos + item_word.length);
                node_pos+= item_word.length + 1; // +self.word_split_regexp
                rangy.getSelection().setSingleRange(range);
                var scroll_element = $(check_element);
                if ( !self.options.always_scroll_body ){
                  while ( scroll_element.height() >= scroll_element.parent().height() ){
                    scroll_element = scroll_element.parent();
                  }
                } else {
                  scroll_element = $(check_element).closest('body');
                }
                var scroll_top = range.nativeRange.getBoundingClientRect().top + scroll_element.scrollTop() - 80;
                if ( typeof scroll_element.scrollTo === 'function' ){
                  scroll_element.scrollTo({top:scroll_top,left:0},300);
                } else {
                  scroll_element.scrollTop(scroll_top);
                }
                self._displayGuesses();
                self.search_word_offset = word_index;
                continue_search = false;
                return continue_search; // break;
              }
              node_pos+= item_word.length + 1; // +self.word_split_regexp
              return continue_search; // continue or break;
            });
            return continue_search; // continue or break;
          });
          return continue_search;
        });
        if ( continue_search ){
          // no misspelled word was found
          self._displayEnd();
          self.search_word_offset = 0;
        }
      }
    /* \brief Show the Spellcheck dialog
              Show the Spellcheck dialog and resume search for misspelled words
    */
    , show: function(){
        //SELF
        var self = this;
        //START
        var language_select = $('.dictionary-select select',self.$el);
        //CODE
        $('.btn-close',self.$el).removeClass('hidden');
        $('.dialog',self.$el).removeClass('hidden');
        self.$el.removeClass('minimized');
        self.$el.trigger('displayed');
        $('.suggestions ul, .misspelled-word .label',self.$el).empty();
        if ( $('option',language_select).length === 0 ){
          language_select.addClass('hidden');
        } else {
          if ( typeof language_select.selectBox === 'function' ){
            language_select.selectBox();
          }
        }
        self.resumeSearch();
      }
    /* \brief Show/Hide the Spellcheck dialog
              no description
    */
    , toggle: function(){
        //SELF
        var self = this;
        //CODE
        if ( self.$el.hasClass('minimized') ){
          self.show();
        } else {
          self.hide();
        }
      }
  }); // widget
}(jQuery)); // jq