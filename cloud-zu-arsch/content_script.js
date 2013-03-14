
/**
 * findAndReplaceDOMText v 0.2
 * @author James Padolsey http://james.padolsey.com
 * @license http://unlicense.org/UNLICENSE
 *
 * Matches the text of a DOM node against a regular expression
 * and replaces each match (or node-separated portions of the match)
 * in the specified element.
 *
 * Example: Wrap 'test' in <em>:
 *   <p id="target">This is a test</p>
 *   <script>
 *     findAndReplaceDOMText(
 *       /test/,
 *       document.getElementById('target'),
 *       'em'
 *     );
 *   </script>
 */

  /** 
   * findAndReplaceDOMText
   * 
   * Locates matches and replaces with replacementNode
   *
   * @param {RegExp} regex The regular expression to match
   * @param {Node} node Element or Text node to search within
   * @param {String|Element|Function} replacementNode A NodeName,
   *  Node to clone, or a function which returns a node to use
   *  as the replacement node.
   * @param {Number} captureGroup A number specifiying which capture
   *  group to use in the match. (optional)
   */
  function findAndReplaceDOMText(regex, node, replacementNode, captureGroup) {

    var m, matches = [], text = _getText(node);
    var replaceFn = _genReplacer(replacementNode);

    if (!text) { return; }

    if (regex.global) {
      while (m = regex.exec(text)) {
        matches.push(_getMatchIndexes(m, captureGroup));
      }
    } else {
      m = text.match(regex);
      matches.push(_getMatchIndexes(m, captureGroup));
    }

    if (matches.length) {
      _stepThroughMatches(node, matches, replaceFn);
    }
  }

  /**
   * Gets the start and end indexes of a match
   */
  function _getMatchIndexes(m, captureGroup) {

    captureGroup = captureGroup || 0;
 
    if (!m[0]) throw 'findAndReplaceDOMText cannot handle zero-length matches';
 
    var index = m.index;

    if (captureGroup > 0) {
      var cg = m[captureGroup];
      if (!cg) throw 'Invalid capture group';
      index += m[0].indexOf(cg);
      m[0] = cg;
    } 

    return [ index, index + m[0].length, [ m[0] ] ];
  };

  /**
   * Gets aggregate text of a node without resorting
   * to broken innerText/textContent
   */
  function _getText(node) {

    if (node.nodeType === 3) {
      return node.data;
    }

    var txt = '';

    if (node = node.firstChild) do {
      txt += _getText(node);
    } while (node = node.nextSibling);

    return txt;

  }

  /** 
   * Steps through the target node, looking for matches, and
   * calling replaceFn when a match is found.
   */
  function _stepThroughMatches(node, matches, replaceFn) {

    var after, before,
        startNode,
        endNode,
        startNodeIndex,
        endNodeIndex,
        innerNodes = [],
        atIndex = 0,
        curNode = node,
        matchLocation = matches.shift(),
        matchIndex = 0;

    out: while (true) {

      if (curNode.nodeType === 3) {
        if (!endNode && curNode.length + atIndex >= matchLocation[1]) {
          // We've found the ending
          endNode = curNode;
          endNodeIndex = matchLocation[1] - atIndex;
        } else if (startNode) {
          // Intersecting node
          innerNodes.push(curNode);
        }
        if (!startNode && curNode.length + atIndex > matchLocation[0]) {
          // We've found the match start
          startNode = curNode;
          startNodeIndex = matchLocation[0] - atIndex;
        }
        atIndex += curNode.length;
      }

      if (startNode && endNode) {
        curNode = replaceFn({
          startNode: startNode,
          startNodeIndex: startNodeIndex,
          endNode: endNode,
          endNodeIndex: endNodeIndex,
          innerNodes: innerNodes,
          match: matchLocation[2],
          matchIndex: matchIndex
        });
        // replaceFn has to return the node that replaced the endNode
        // and then we step back so we can continue from the end of the 
        // match:
        atIndex -= (endNode.length - endNodeIndex);
        startNode = null;
        endNode = null;
        innerNodes = [];
        matchLocation = matches.shift();
        matchIndex++;
        if (!matchLocation) {
          break; // no more matches
        }
      } else if (curNode.firstChild || curNode.nextSibling) {
        // Move down or forward:
        curNode = curNode.firstChild || curNode.nextSibling;
        continue;
      }

      // Move forward or up:
      while (true) {
        if (curNode.nextSibling) {
          curNode = curNode.nextSibling;
          break;
        } else if (curNode.parentNode !== node) {
          curNode = curNode.parentNode;
        } else {
          break out;
        }
      }

    }

  }

  var reverts;
  /**
   * Reverts the last findAndReplaceDOMText process
   */
  findAndReplaceDOMText.revert = function revert() {
    for (var i = 0, l = reverts.length; i < l; ++i) {
      reverts[i]();
    }
    reverts = [];
  };

  /** 
   * Generates the actual replaceFn which splits up text nodes
   * and inserts the replacement element.
   */
  function _genReplacer(nodeName) {

    reverts = [];

    var makeReplacementNode;

    if (typeof nodeName != 'function') {
      var stencilNode = nodeName.nodeType ? nodeName : document.createElement(nodeName);
      makeReplacementNode = function(fill) {
        var clone = document.createElement('div'),
            el;
        clone.innerHTML = stencilNode.outerHTML || new XMLSerializer().serializeToString(stencilNode);
        el = clone.firstChild;
        if (fill) {
          el.appendChild(document.createTextNode(fill));
        }
        return el;
      };
    } else {
      makeReplacementNode = nodeName;
    }

    return function replace(range) {

      var startNode = range.startNode,
          endNode = range.endNode,
          matchIndex = range.matchIndex;

      if (startNode === endNode) {
        var node = startNode;
        if (range.startNodeIndex > 0) {
          // Add `before` text node (before the match)
          var before = document.createTextNode(node.data.substring(0, range.startNodeIndex));
          node.parentNode.insertBefore(before, node);
        }

        // Create the replacement node:
        var el = makeReplacementNode(range.match[0], matchIndex, range.match[0]);
        node.parentNode.insertBefore(el, node);
        if (range.endNodeIndex < node.length) {
          // Add `after` text node (after the match)
          var after = document.createTextNode(node.data.substring(range.endNodeIndex));
          node.parentNode.insertBefore(after, node);
        }
        node.parentNode.removeChild(node);
        reverts.push(function() {
          var pnode = el.parentNode;
          pnode.insertBefore(el.firstChild, el);
          pnode.removeChild(el);
          pnode.normalize();
        });
        return el;
      } else {
        // Replace startNode -> [innerNodes...] -> endNode (in that order)
        var before = document.createTextNode(startNode.data.substring(0, range.startNodeIndex));
        var after = document.createTextNode(endNode.data.substring(range.endNodeIndex));
        var elA = makeReplacementNode(startNode.data.substring(range.startNodeIndex), matchIndex, range.match[0]);
        var innerEls = [];
        for (var i = 0, l = range.innerNodes.length; i < l; ++i) {
          var innerNode = range.innerNodes[i];
          var innerEl = makeReplacementNode(innerNode.data, matchIndex, range.match[0]);
          innerNode.parentNode.replaceChild(innerEl, innerNode);
          innerEls.push(innerEl);
        }
        var elB = makeReplacementNode(endNode.data.substring(0, range.endNodeIndex), matchIndex, range.match[0]);
        startNode.parentNode.insertBefore(before, startNode);
        startNode.parentNode.insertBefore(elA, startNode);
        startNode.parentNode.removeChild(startNode);
        endNode.parentNode.insertBefore(elB, endNode);
        endNode.parentNode.insertBefore(after, endNode);
        endNode.parentNode.removeChild(endNode);
        reverts.push(function() {
          innerEls.unshift(elA);
          innerEls.push(elB);
          for (var i = 0, l = innerEls.length; i < l; ++i) {
            var el = innerEls[i];
            var pnode = el.parentNode;
            pnode.insertBefore(el.firstChild, el);
            pnode.removeChild(el);
            pnode.normalize();
          }
        });
        return elB;
      }
    };

  }

handleText(document.body);
function handleText(textNode) 
{
  var handled = {};

  findAndReplaceDOMText(/([pP])rivate Clouds\b|([pP])rivate Cloud\b|([vV])on Clouds\b|([iI])n der ([„"'])?Wolke([“"'])?|([eE]in|[dD])er ([„"'])Wolke([“"'])?|([eE]ine) ([„"'])Wolke([“"'])?|([dD])ie ([„"'])Wolke([“"'])?|(?:(\u00fcber|gegen|in|f\u00fcr) )?(?:(d)(er|ie) )?(C)loud(s?)/gi,
      textNode, function(partMatch, idx, fullMatch) {
    // THIS IS SUPER DIRTY :D
    var fullMatchOld = fullMatch;
    fullMatch = fullMatch.replace(/([pP])rivate Clouds\b/, '$1rivate Ärsche');
    fullMatch = fullMatch.replace(/([pP])rivate Cloud\b/, '$1rivater Arsch');
    fullMatch = fullMatch.replace(/([vV])on Clouds\b/, '$1on Ärschen');
    fullMatch = fullMatch.replace(/([iI])n der ([„"'])?Wolke([“"'])?/, '$1m $2Arsch$3');
    fullMatch = fullMatch.replace(/([eE]in|[dD])er ([„"'])Wolke([“"'])?/, '$1em $2Arsch$3');
    fullMatch = fullMatch.replace(/([eE]ine) ([„"'])Wolke([“"'])?/, '$1 $2Arsch$3');
    fullMatch = fullMatch.replace(/([dD])ie ([„"'])Wolke([“"'])?/, '$1em $2Arsch$3');
    fullMatch = fullMatch.replace(/(?:(\u00fcber|gegen|in|f\u00fcr) )?(?:(d)(er|ie) )?(C)loud(s?)/gi, function(match, case1, cap1, case2, cap2, cplural, offset, string) {
      var r = '';
      if (cap1 != undefined) {
        if (case1 == undefined) {
          r += (cap1 == 'D' ? 'M' : 'm');
          r += (case2 == 'er' ? 'einem ' : 'ein ');
        }
        else {
          var is_upper = (case1.charAt(0).toUpperCase() == case1.charAt(0));
          r += (is_upper ? case1.charAt(0).toUpperCase() + case1.slice(1) : case1) + ' ';
          r += (cap1 == 'D' ? 'M' : 'm');
          r += (case2 == 'er' ? 'einem ' : 'einen ');
        }
      }
      if (cplural == 's') {
        r += (cap2 == 'C' ? 'Ä' : 'ä');
        r += 'rsche';
      }
      else {
        r += (cap2 == 'C' ? 'A' : 'a');
        r += 'rsch';
      }
      return r;
    });
    var fullParts = fullMatch.trim().split(/\s+/);
    var partParts = partMatch.trim().split(/\s+/);
    if (fullMatch.match(/[iI]n d(er|ie)/)) { partParts.pop(); }
    var reconstructed = [];
    if (handled[idx] == undefined) {
      handled[idx] = 0;
    }
    for (var i = handled[idx]; i < handled[idx] + partParts.length; i++) {
      reconstructed.push(fullParts[i]);
    }
    handled[idx] = i;
    // console.log([idx, 'part='+partMatch, 'old='+fullMatchOld, 'new='+fullMatch, 'fullParts='+JSON.stringify(fullParts), 'partParts='+JSON.stringify(partParts), 'rec='+JSON.stringify(reconstructed), 'handled='+handled[idx], 'result='+reconstructed.join(' ')].join(' '));

    return document.createTextNode(reconstructed.join(' ') + (partMatch.charAt(partMatch.length-1) == ' ' ? ' ' : ''));
  });
}


