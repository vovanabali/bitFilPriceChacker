const axios = require('axios');
const dataService = require('./data-service');
const _ = require('lodash');
const settings = require('../conf/conf').settings;
const totp = require('notp').totp;
const base32 = require('thirty-two');
const TelegramBot = require('node-telegram-bot-api');
dataService.run();

const bot = new TelegramBot(settings.token, {polling: false});

let allSkins = [];
let extraItemsInfoForBuy = [];

setInterval(()=> {
    console.log('Clear all skins info: ' + allSkins.length);
    allSkins = [];
    console.log('Clear extra skins info: ' + extraItemsInfoForBuy.length);
    extraItemsInfoForBuy = [];
}, 600000);

const buySkin = (skin) => {
    axios.get('https://bitskins.com/api/v1/buy_item/', {
        params: {
            api_key: settings.api_key,
            code: totp.gen(base32.decode('IWBNVTKIWLWMMQX6')),
            item_ids: skin.item_id,
            prices: skin['price'],
            app_id: skin.app_id,
            auto_trade: true,
            allow_trade_delayed_purchases: true
        }
    })
        .then(() => {
            bot.sendMessage(settings.chat_id, JSON.stringify(skin));
        })
        .catch(error => {
                console.log('Buy error: ', error.response.data.data['error_message']);
                console.log('Item for view item on BitSkins: https://bskn.co/view_item?app_id=730&item_id='+skin.item_id)
            }
        );
};

module.exports.buyDotaItem = (dotaItem) => {
    const myItem = dataService.getDotaItemForBuy(dotaItem.market_hash_name);
    if (!myItem) return;
    if (!!dotaItem['price'] && myItem.max_price >= parseFloat(dotaItem['price'])) {
        console.log('Найден скин для доки 2: наменование: ' + dotaItem.market_hash_name + ' его цена: ' + dotaItem['price'] + '$;');
        buySkin(dotaItem);
    }
};


module.exports.buyMyItems = (extraInfo) => {
    const items = _.filter(allSkins, (item) => {return _.eq(item['asset_id'], extraInfo['asset_id']);});
    if (!items || items.length === 0) return;
    const item = items[items.length - 1];
    if (!!item) {
        const itemForBuy = dataService.getBuyItemByName(item['market_hash_name']);
        if (!itemForBuy || itemForBuy['float'] < extraInfo['wear_value']) {
            return;
        }
        if (parseFloat(item['price']) <= itemForBuy['max_price'] && itemForBuy['max_price'] >= settings.min_item_price) {
            console.log(`Покупаем скин ${item['market_hash_name']} bitskinsPrice: ${parseFloat(item['price'])}$`);
            buySkin(item);
        } else if (parseFloat(item['price']) < itemForBuy['max_price'] && itemForBuy['max_price'] >= settings.min_item_price) {
            console.log('Find item but max price incorrect: {name' + item['market_hash_name'] + '; it_price: ' + item['price'])
        }
    }
};


module.exports.buyItemsByInfo = (item) => {
    let itemToBuy = _.find(extraItemsInfoForBuy, obj => _.eq(obj['asset_id'], item['asset_id']));
    if (!!itemToBuy) {
        let itemMaxPrice = dataService.getItemPriceByName(item['market_hash_name']);
        if (itemMaxPrice >= parseFloat(item['price']) && itemMaxPrice >= settings.min_item_price) {
            setTimeout(buySkin, 1, item);
            console.log(itemToBuy.infoForPrint);
        } else if (itemMaxPrice < parseFloat(item['price']) && itemMaxPrice >= settings.min_item_price) {
            console.log('Find item but max price incorrect: {name' + item['market_hash_name'] + '; it_price: ' + item['price'])
        }

    } else {
        allSkins.push(item);
    }
};

module.exports.buyChangetItems = (item) => {
    const buyItemMaxPrice = dataService.getItemPriceByName(item['market_hash_name']);
    const patternItem = dataService.getBuyPatternItemByName(item['market_hash_name']);
    const patternItemMaxPrice = !!patternItem ? patternItem['max_price'] : Number.MAX_SAFE_INTEGER * -1;
    const stickerItemPrice = dataService.getStickerItemSuggestPrice(item['market_hash_name']);

    if (buyItemMaxPrice >= parseFloat(item['price']) && parseFloat(item['price']) >= settings.min_item_price) {
        setTimeout(getItemInformation, 1, 730, item['market_hash_name'], parseFloat(item['price']), itemType.float);
    }

    if (patternItemMaxPrice >= parseFloat(item['price'])) {
        setTimeout(getItemInformation, 1, 730, item['market_hash_name'], parseFloat(item['price']), itemType.pattern);
    }

    if (!!stickerItemPrice && stickerItemPrice > 0) {
        setTimeout(getItemInformation, 1, 730, item['market_hash_name'], parseFloat(item['price']), itemType.sticker);
    }
};


module.exports.buyMyStickers = (extraInfo) => {
    if (!!extraInfo['sticker_info'] && extraInfo['sticker_info'].length > 0) {
        const isBuyItem = !!_.find(dataService.buyStickers, (myItem) => {
            return !!_.find(extraInfo['sticker_info'], (sticker) => {
                return _.eq(sticker.name, myItem.name) && sticker['wear_value'] <= myItem['wear_value']
            });
        });
        if (!isBuyItem) return;

        const items = _.filter(allSkins, (item) => {
            return _.eq(item['asset_id'], extraInfo['asset_id']);
        });
        if (!items || items.length === 0) {
            extraItemsInfoForBuy.push(extraInfo);
            return;
        }
        const item = items[items.length - 1];
        if (!!item) {
            const itemSuggestPrice = dataService.getStickerItemSuggestPrice(item['market_hash_name']);
            const stickersPrices = _.map(stickers, (st) => {
                const constMySticker = dataService.getStickerPriceByName(st['name']);
                if (!constMySticker || parseFloat(constMySticker['wear_value']) >= parseFloat(st['wear_value'])) return 0;
                const stickerPrice = parseFloat(constMySticker['max_sticker_price']);
                return stickerPrice > 0 ? stickerPrice : 0;
            });
            const stickersTotalPrice = _.sum(stickersPrices);
            const maxPrice = stickersTotalPrice + itemSuggestPrice;
            if (parseFloat(item['price']) >= settings.min_item_price && parseFloat(item['price']) <= maxPrice) {
                setTimeout(buySkin, 1, item);
                console.log('Покукаем скин с выгодными стикерами)): ' + _.toString(_.map(extraInfo['sticker_info'], (o) => o.name)));
            } else if (parseFloat(item['price']) >= settings.min_item_price && parseFloat(item['price']) > maxPrice) {
                const stickers = _.toString(_.map(extraInfo['sticker_info'], (sticker) => sticker.name));
                console.log('Find item with need stickers but max price incorrect: {name' + item['market_hash_name'] + '; it_price: ' + item['price'] + '; Stickers: ' + stickers);
            }
        }
    }
};

module.exports.buyPatternsItems = (extraInfo) => {
    if (!!extraInfo['extra_info']) {
        let items = _.filter(allSkins, (item) => { return _.eq(item['asset_id'], extraInfo['asset_id']); });

        if (!items || items.length === 0) return;
        const item = items[items.length - 1];
        const myBuyItem = dataService.getBuyPatternItemByName(item['market_hash_name']);
        if (!myBuyItem || myBuyItem['pattern_index'].indexOf(extraInfo['extra_info']['paintseed']) === -1 || item['price'] > myBuyItem['max_price']) {
            return;
        }
        setTimeout(buySkin, 1, item);
        console.log(' ______________________________________________________________________\n\n');
        console.log('Покупаем скин с выгодным паттерном: ' + JSON.stringify(item) + ', его паттерн: ' + extraInfo['extra_info']['paintseed']);
        console.log('\n\n ____________________________________________________________________');
    }
};

const getItemInformation = (appId, itemName, price, type) => {
    console.log("Найден в changed: " + itemName);
    console.log(appId, itemName, price, type);
    axios.get('https://bitskins.com/api/v1/get_inventory_on_sale/', {
        params: {
            api_key: settings.api_key,
            code: totp.gen(base32.decode('IWBNVTKIWLWMMQX6')),
            app_id: appId,
            market_hash_name: itemName,
            min_price: price,
            max_price: price,
            sort_by: 'created_at'
        }
    }).then((response) => {
        const items = response.data.data.items;
        if (!items || items.length === 0) return;
        _.forEach(items, (fullItemInfo) => {
            checkItemByFullItemInfo(fullItemInfo, type);
        });
    }).catch(error => {
        console.log(error);
        console.log('Ну ебана рот опять какаето хуйня( Сука почему как всегда всё ламаеться, дайте нормально накопить. Я блять вообщето машину себе хочу + я ещё жинат, Сука опять Славу надо ждать наделю чтобы пофиксил ну бля суууууука. Кста вот ошибка кину Славе чтобы мозги ему поебать с этой хуйнёй, хоть раслаблюсь немного)))) О и точечьки .... точки топ ... обожаю их' + error.response);
    });
};

const checkItemByFullItemInfo = (fullItemInfo, type) => {
    let isBuyItem = false;
    switch (type) {
        case itemType.float: {
            const myBuyFloatItem = dataService.getBuyItemByName(fullItemInfo['market_hash_name']);
            if (fullItemInfo['float_value'] != null && myBuyFloatItem['float'] >= fullItemInfo['float_value']) {
                isBuyItem = true;
            }
        } break;
        case  itemType.pattern: {
            const myBuyPatternItem = dataService.getBuyPatternItemByName(fullItemInfo['market_hash_name']);
            if (!!fullItemInfo['pattern_info'] && myBuyPatternItem['pattern_index'].indexOf(fullItemInfo['pattern_info']['paintseed']) > -1) {
                isBuyItem = true;
            }
        } break;
        case itemType.sticker: {
            const stickers = fullItemInfo['stickers'];
            if (!stickers || stickers.length === 0) return;
            const itemSuggestPrice = parseFloat(dataService.getStickerItemSuggestPrice(fullItemInfo['market_hash_name']));
            const stickersPrices = _.map(stickers, (st) => {
                const constMySticker = dataService.getStickerPriceByName(st['name']);
                if (!constMySticker || parseFloat(constMySticker['wear_value']) < parseFloat(st['wear_value'])) return 0;
                const stickerPrice = parseFloat(constMySticker['max_sticker_price']);
                return !!stickerPrice ? stickerPrice : 0;
            });
            const stickersTotalPrice = _.sum(stickersPrices);
            if ( (stickersTotalPrice + itemSuggestPrice) >=  parseFloat(fullItemInfo['price'])) {
                isBuyItem = true;
            }
        } break;
        default: break;
    }
    if (isBuyItem) {
        console.log('Покупаем ' + type + ' в changed: ' + fullItemInfo['market_hash_name']);
        buySkin(fullItemInfo);
    }
};

const itemType = {
    float: "FLOAT",
    pattern: "PATTERN",
    sticker: "STICKER"
};
