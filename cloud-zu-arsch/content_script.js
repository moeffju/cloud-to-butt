walk(document.body);

function walk(node) 
{
  // I stole this function from here:
  // http://is.gd/mwZp7E
  
  var child, next;

  switch ( node.nodeType )  
  {
    case 1:  // Element
    case 9:  // Document
    case 11: // Document fragment
      child = node.firstChild;
      while ( child ) 
      {
        next = child.nextSibling;
        walk(child);
        child = next;
      }
      break;

    case 3: // Text node
      handleText(node);
      break;
  }
}

function handleText(textNode) 
{
  var v = textNode.nodeValue;

  v = v.replace(/(?:(\u00fcber|gegen|in|f\u00fcr) )?(?:(d)(er|ie) )?(C)louds?/gi, function(match, case1, cap1, case2, cap2, offset, string) {
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
    r += (cap2 == 'C' ? 'A' : 'a');
    r += 'rsch';
    return r;
  });
  
  textNode.nodeValue = v;
}


