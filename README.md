jquery.spellcheck
=================

Spellcheck dialog for contenteditables

Checks every word in a configurable container and allows the user to select from a list of suggestions, go to the next/previous misspelled word and ignore or add the selected word.
requires:
utils.getTextNodesIn returning all text-nodes for the given DOMElement
utils.tr for translating ui-elements
utils.actionButton for translating buttons
rangy for selecting the misspelled words
XRegExp for splitting words
jquery.selectBox for changing the language

usage
=====

```javascript
  spellcheck_display.spellcheck({
    'check_elements': editables
  , 'count_words': true
  , 'check_on_input': true
  , 'selected_dictionary': default_dictionary
  , 'checkWord': function(word){return spellcheck.check(word);}
  , 'learnWord': function(word){/* not supported by bjspell->implement your own return wke.learnSpellcheckWord(word);*/}
  , 'ignoreWord': function(word){/* not supported by bjspell->implement your own return wke.ignoreSpellcheckWord(word);*/}
  , 'getGuesses': function(word){return spellcheck.suggest(word);}
  , 'setDictionary': function(language){spellcheck = new BJSpell(language);}
  , 'getDictionaries': function(){return ['en_US','de_DE'];}
  });
```

To take advantage of 'good' libraries you may implement a browser-hunspell bridge. I did this with QtWebkit

demo
====

open the demo.html in the demo directory

its a rude extraction from the original code stripped to the required dependencies using the BJSpell code for in-browser checking
