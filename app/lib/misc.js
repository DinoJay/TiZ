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

export function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makePanels(width, height, margin, uiWidth, padX, padY) {
  function makePanel(panel) {
    panel.width = panel.right - panel.left;
    panel.height = panel.bottom - panel.top;
    panel.cx = panel.left + panel.width / 2;
    panel.cy = panel.top + panel.height / 2;

    return panel;
  }

  var offset = margin.left + uiWidth;
  var upperUI = makePanel({
    left:  margin.left,
    top: margin.top,
    right: offset - padX,
    bottom: height / 3 - padY
  });
  var centerUI = makePanel({
    left:  margin.left,
    top: height / 3 ,
    right: offset - padX,
    bottom: height * 2/3 - padY
  });
  var lowerUI = makePanel({
    left:  margin.left,
    top: height * 2/3,
    right: offset - padX,
    bottom: height - margin.bottom
  });


  const upperPanel = makePanel({
    left: offset,
    top: margin.top,
    right: width - margin.right,
    bottom: height / 3 - padY
  });
  const centerPanel = makePanel({
    left: offset,
    right: width - margin.right,
    top: height / 3,
    bottom: height * 2/3 - padY
  });
  const lowerPanel = makePanel({
    left: offset,
    top: height * 2/3,
    right: width - margin.right,
    bottom: height - margin.bottom
  });

  return {
    top: upperPanel,
    center: centerPanel,
    bottom: lowerPanel,

    topUI: upperUI,
    centerUI: centerUI,
    bottomUI: lowerUI
  };
}

export function makeStyle(ui, color) {
  return {
    top:        ui.top,
    left:       ui.left,
    width:      ui.width,
    height:     ui.height,
    position:   "absolute",
    backgroundColor: color,
    opacity:    0.2
  };
}
