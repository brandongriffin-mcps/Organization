import * as d3 from 'd3';

/**
 * A helper function that wraps long SVG text into multiple lines
 * by breaking the content up into tspan elements
 * @param text A d3 selection of the text elements that should be wrapped
 * @param width The maximum width of a label. (This may be exceeded if an individual word is longer than this width.)
 * @param dyAdjust Add this many ems to the y position of each label. A value of .35 seems to work well. (Using the SVG dominant-baseline attribute is probably better but I don't think it works in IE11.)
 * @param lineHeightEms The vertical distance in ems from the top of one line to the top of the next line.
 * @param lineHeightSquishFactor If this equals 1, it does nothing. If it is less than 1, it squishes the lines together a bit more if a label has three or more lines of text.
 * @param splitOnHyphen Allow a word to be split just after a hyphen?
 * @param centerVertically Center-align the text vertically?
 * @see https://observablehq.com/@jtrim-ons/svg-text-wrapping
 */
export function wrap(
  text: d3.Selection<SVGTextElement, any, any, any>,
  width: number,
  dyAdjust: number,
  lineHeightEms: number = 1.05,
  lineHeightSquishFactor: number = 1,
  splitOnHyphen: boolean = true,
  centerVertically: boolean = true
) {
  text.each(function () {
    var text = d3.select(this),
      x = text.attr("x"),
      y = text.attr("y");

    var words: string[] = [];
    text
      .text()
      .split(/\s+/)
      .forEach(function (w) {
        if (splitOnHyphen) {
          var subWords = w.split("-");
          for (var i = 0; i < subWords.length - 1; i++)
            words.push(subWords[i] + "-");
          words.push(subWords[subWords.length - 1] + " ");
        } else {
          words.push(w + " ");
        }
      });

    text.text(null); // Empty the text element

    // `tspan` is the tspan element that is currently being added to
    var tspan = text.append("tspan");

    var line = ""; // The current value of the line
    var prevLine = ""; // The value of the line before the last word (or sub-word) was added
    var nWordsInLine = 0; // Number of words in the line
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      prevLine = line;
      line = line + word;
      ++nWordsInLine;
      tspan.text(line.trim());
      if (tspan.node()!.getComputedTextLength() > width && nWordsInLine > 1) {
        // The tspan is too long, and it contains more than one word.
        // Remove the last word and add it to a new tspan.
        tspan.text(prevLine.trim());
        prevLine = "";
        line = word;
        nWordsInLine = 1;
        tspan = text.append("tspan").text(word.trim());
      }
    }

    var tspans = text.selectAll("tspan");

    var h = lineHeightEms;
    // Reduce the line height a bit if there are more than 2 lines.
    if (tspans.size() > 2)
      for (var i = 0; i < tspans.size(); i++) h *= lineHeightSquishFactor;

    tspans.each(function (d, i) {
      // Calculate the y offset (dy) for each tspan so that the vertical centre
      // of the tspans roughly aligns with the text element's y position.
      var dy = i * h + dyAdjust;
      if (centerVertically) dy -= ((tspans.size() - 1) * h) / 2;
      d3.select(this)
        .attr("y", y)
        .attr("x", x)
        .attr("dy", dy + "em");
    });
  });
}