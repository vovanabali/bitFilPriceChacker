module.exports.settings = {
    // Минимальный профит в процентах для покупки любых вещей
    profit: 45,
    min_item_price: 1,
    api_key: 'ed02741c-27c1-4d5b-9645-62a4290ef017',
    token: '524606074:AAEwGhdsM0YBgo17i3qXrcUPy9sq_SMHLd4',
    chat_id: -265674468
};



/**


 rows = document.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
 var dotaItemsInfo = {};
 for(let i = 0; i < rows.length; i++) {
	const row = rows[i];
	let columnts = row.getElementsByTagName('td');
	dotaItemsInfo[columnts[0].textContent] = {max_price: columnts[1].textContent.split('$')[0]}
}
 console.log(JSON.stringify(dotaItemsInfo))


 */