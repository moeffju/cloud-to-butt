function handle_german(node) 
{
  var handled = {};

  findAndReplaceDOMText(/([pP])rivate\sClouds\b|([pP])rivate\sCloud\b|([vV])on\sClouds\b|([iI])n\sder\s([„"'])?Wolke([“"'])?|([eE]in|[dD])er\s([„"'])Wolke([“"'])?|([eE]ine)\s([„"'])Wolke([“"'])?|([dD])ie\s([„"'])Wolke([“"'])?|(?:(\u00fcber|gegen|in|f\u00fcr)\s)?(?:(d)(er|ie)\s)?(C)loud(s?)/gi,
      node, function(partMatch, idx, fullMatch) {
    // THIS IS SUPER DIRTY :D
    var fullMatchOld = fullMatch;
    fullMatch = fullMatch.replace(/([pP])rivate\sClouds\b/, '$1rivate Ärsche');
    fullMatch = fullMatch.replace(/([pP])rivate\sCloud\b/, '$1rivater Arsch');
    fullMatch = fullMatch.replace(/([vV])on\sClouds\b/, '$1on Ärschen');
    fullMatch = fullMatch.replace(/([iI])n\sder\s([„"'])?Wolke([“"'])?/, '$1m $2Arsch$3');
    fullMatch = fullMatch.replace(/([eE]in|[dD])er\s([„"'])Wolke([“"'])?/, '$1em $2Arsch$3');
    fullMatch = fullMatch.replace(/([eE]ine)\s([„"'])Wolke([“"'])?/, '$1 $2Arsch$3');
    fullMatch = fullMatch.replace(/([dD])ie\s([„"'])Wolke([“"'])?/, '$1em $2Arsch$3');
    fullMatch = fullMatch.replace(/(?:(\u00fcber|gegen|in|f\u00fcr)\s)?(?:(d)(er|ie)\s)?(C)loud(s?)/gi, function(match, case1, cap1, case2, cap2, cplural, offset, string) {
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
    if (fullMatchOld.match(/[iI]n\sd(er|ie)/)) { partParts.pop(); }
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

function handle_english(node) 
{
  var handled = {};

  findAndReplaceDOMText(/([pP])rivate [cC]louds\b|([pP])rivate [cC]loud\b|[tT]he [cC]loud|[cC]loud/gi, node, function(partMatch, idx, fullMatch) {
    var fullMatchOld = fullMatch;
    fullMatch = fullMatch.replace(/([pP])rivate ([cC])loud(s)?\b/, function(match, cap1, cap2, cplural, offset, string) {
      return (cap1 == 'P' ? 'Private ' : 'private ') + (cap2 == 'C' ? 'Butt' : 'butt') + (cplural == 's' ? 's' : '');
    });
    fullMatch = fullMatch.replace(/([tT])he ([cC])loud/gi, function(match, cap1, cap2, offset, string) {
      var r = '';
      r += (cap1 == 'T' ? 'My ' : 'my ');
      r += (cap2 == 'C' ? 'Butt' : 'butt');
      return r;
    });
    fullMatch = fullMatch.replace(/([cC])loud/gi, function(match, cap1, offset, string) {
      return (cap1 == 'C' ? 'Butt' : 'butt');
    });
    var fullParts = fullMatch.trim().split(/\s+/);
    var partParts = partMatch.trim().split(/\s+/);
    var reconstructed = [];
    if (handled[idx] == undefined) {
      handled[idx] = 0;
    }
    for (var i = handled[idx]; i < handled[idx] + partParts.length; i++) {
      reconstructed.push(fullParts[i]);
    }
    handled[idx] = i;

    return document.createTextNode(reconstructed.join(' ') + (partMatch.charAt(partMatch.length-1) == ' ' ? ' ' : ''));
  });
}

var language_mapping = {
  'German': handle_german,
  'English': handle_english
}

var lang = detectLanguage(document.body.textContent);
console.log('cloud-to-butt-extended: Document language is: ' + lang);
if (language_mapping[lang] != undefined) {
  language_mapping[lang](document.body);
}
else {
  console.log('cloud-to-butt-extended: No function to handle ' + lang + ' :(');
}
