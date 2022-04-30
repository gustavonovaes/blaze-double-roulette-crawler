const isSameRouletteColors = (a, b) => {
  return a.map(x => x.color).join("") === b.map(x => x.color).join("");
};

module.exports = isSameRouletteColors;