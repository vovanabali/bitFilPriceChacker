// first, install the pusher-client library via "npm install pusher-client@1.1.0"

const Pusher = require('pusher-client');
const bitskins = require('./service/bitskins');

const pusher = new Pusher('c0eef4118084f8164bec65e6253bf195', {
    encrypted: true,
    wsPort: 443,
    wssPort: 443,
    host: 'notifier.bitskins.com'
});

pusher.connection.bind('connected', function () {
    console.log(" -- connected to websocket");
});

pusher.connection.bind('disconnected', function () {
    console.log(" -- disconnected from websocket");
});

const events_channel = pusher.subscribe('inventory_changes'); // use the relevant channel, see docs below

events_channel.bind('listed', function (data) {
    if (parseInt(data.app_id) === 730) {
        bitskins.buyItemsByInfo(data);
        setTimeout(bitskins.buyChangetItems, 1, data);
    }
    if (parseInt(data.app_id) === 570) {
        bitskins.buyDotaItem(data);
    }
});

const updatePriceItemListener = pusher.subscribe('inventory_changes');

updatePriceItemListener.bind('price_changed', (data) => {
    setTimeout(bitskins.buyChangetItems, 1, data);
    if (parseInt(data.app_id) === 570) {
       setTimeout(bitskins.buyDotaItem, 1, data);
    }
});

const extraInfoListener = pusher.subscribe('inventory_changes');

extraInfoListener.bind('extra_info', (data) => {
    setTimeout(bitskins.buyMyItems, 1, data);
    setTimeout(bitskins.buyMyStickers, 1, data);
    setTimeout(bitskins.buyPatternsItems, 1, data);
});




