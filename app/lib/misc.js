import d3 from "d3";

export const margin = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };

export const width = 2400 - margin.left - margin.right;
export const height = 800 - margin.top - margin.bottom;


export function generateData(setLen, dataLen) {
  var setChar = "ABCDEFGHIJKLMN",
      charFn = i => setChar[i],
      generator = 0;

  return d3.range(dataLen).map(() => {
    var l = Math.floor((Math.random() * setLen / 3) + 1),
      set = [],
      c,
      j;
    for (j = -1; ++j < l;) {
      c = charFn(Math.floor((Math.random() * setLen)));
      if (set.indexOf(c) == -1) {
        set.push(c);
      }
    }
    return {
      set: set,
      r: 8,
      id: "node_" + generator++
    };
  });
}

export function makeEdges(stack) {
  var edges = [];
  var c = stack.length;
  while(stack.length > 1) {
    var target = stack.pop();
    var source = stack[stack.length - 1];
    var edge  = {
      id: source.id + "-" + target.id,
      counter: c--,
      source: stack[stack.length - 1],
      target: target,
      type: target.linkedBy.type,
      value: target.linkedBy.value
    };
    /* console.log("EDGE", edge) */
    edges.push(edge);
  }

  return edges;
}

export function getDepth(obj) {
    var depth = 0;
    if (obj.children) {
        obj.children.forEach(function (d) {
            var tmpDepth = getDepth(d);
            if (tmpDepth > depth) {
                depth = tmpDepth;
            }
        });
    }
    return 1 + depth;
}

export var relationColors = {
  "Authorship": "rgb(93, 199, 76)",
  "Keyword": "rgb(223, 199, 31)",
  "Task": "rgb(234, 118, 47)"
};


export var sourceColors = {
  "Digital": "Blue",
  "Physical": "#000000"
};

export const facets = ["Keyword", "Authorship", "Task"];

export var DOC_URL = "https://cdn4.iconfinder.com/data/icons/flat-icon-set/128/"
              + "flat_icons-graficheria.it-11.png";
export var EMAIL_URL = "https://cdn0.iconfinder.com/data/icons/social-icons-20/200"
                + "/mail-icon-128.png";

export var CALENDAR_URL = "https://cdn1.iconfinder.com/data/icons/education-colored-"
                   +"icons-vol-3/128/145-128.png";

export var NOTE_URL = "evernoteIcon.png";


function dw_getScrollOffsets() {
    var doc = document, w = window;
    var x, y, docEl;

    if ( typeof w.pageYOffset === "number" ) {
        x = w.pageXOffset;
        y = w.pageYOffset;
    } else {
        docEl = (doc.compatMode && doc.compatMode === "CSS1Compat")?
                doc.documentElement: doc.body;
        x = docEl.scrollLeft;
        y = docEl.scrollTop;
    }
    return {x:x, y:y};
}

export function xy(el) {
    var sOff = dw_getScrollOffsets(), left = 0, top = 0, props;

    if ( el.getBoundingClientRect ) {
        props = el.getBoundingClientRect();
        left = props.left + sOff.x;
        top = props.top + sOff.y;
    } else { // for older browsers
        do {
            left += el.offsetLeft;
            top += el.offsetTop;
        } while ( (el = el.offsetParent) );
    }
    return { x: Math.round(left), y: Math.round(top) };
}

export function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

