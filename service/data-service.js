const _ = require('lodash');
const fs = require('fs');

let buyItems = {};

let buyStickers = [];

let patternsIndexItems = {};

let dotaItems = {};

let stickersItems = {};

module.exports.getItemPriceByName = (itemName) => {
   const item = this.buyItems[itemName];
   return !!item ? item['maxPrice'] : Number.MAX_SAFE_INTEGER * -1;
};

module.exports.getBuyItemByName = (itemName) => {
    return this.buyItems[itemName];
};

module.exports.getDotaItemForBuy = (itemName) => {
    return this.dotaItems[itemName];
};

module.exports.getBuyPatternItemByName = (itemName) => {
    return this.patternsIndexItems[itemName];
};

module.exports.getStickerItemSuggestPrice = (itemName) => {
    const stickerItem = this.stickersItems[itemName];
    if (!!stickerItem) {
        return parseFloat(stickerItem['suggest_price']);
    }
    return Number.MAX_SAFE_INTEGER * -1;
};

module.exports.getStickerPriceByName = (stickerName) => {
    const findItems = _.filter(this.buyStickers, (item) => {
        return _.eq(item.name, stickerName);
    });
    if (!!findItems && findItems.length !== 0) {
        return findItems[0];
    }
    return null;
};

module.exports.run = function () {
    const buyItems = fs.readFileSync('./conf/buyItems.json', 'utf8');
    this.buyItems = JSON.parse(buyItems);
    console.log('Дэф скинов загружено: ' + Object.keys(this.buyItems).length);

    const stikers = fs.readFileSync('./conf/stikers.json', 'utf8');
    this.buyStickers = JSON.parse(stikers);
    console.log('Стикеров для покупки загружены: ' + Object.keys(this.buyStickers).length);

    const patternsIndexItems = fs.readFileSync('./conf/buyPatternIndexItems.json', 'utf8');
    this.patternsIndexItems = JSON.parse(patternsIndexItems);
    console.log('Прдметы с паттернами для покупки загружены: ' + Object.keys(this.patternsIndexItems).length);

    const dotaItemsString = fs.readFileSync('./conf/dotaItems.json', 'utf8');
    this.dotaItems = JSON.parse(dotaItemsString);
    console.log('Загружено скинов для Дока 2: ' + + Object.keys(this.dotaItems).length)

    const stickersItemsString = fs.readFileSync('./conf/stickersItems.json', 'utf8');
    this.stickersItems = JSON.parse(stickersItemsString);
    console.log('Загружено предметов для стикеров: ' + + Object.keys(this.stickersItems).length)


};

module.exports.buyItems = buyItems;
module.exports.buyStickers = buyStickers;
module.exports.patternsIndexItems = patternsIndexItems;