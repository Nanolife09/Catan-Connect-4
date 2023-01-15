var resource_list = document.querySelectorAll(".resource_list > h1");
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

var resource = ["Wood", "Brick", "Sheep", "Ore", "Wheat"];
var color = ["green", "red", "lime", "gray", "yellow"];

var ability = {
	"robber": {
		cost: [1, 0, 0, 0, 1],
		description: "Select a tile that is not owned nor protected. You gain the resource of that tile and the tile will not produce any resource."
	},
	"knight": {
		cost: [0, 1, 1, 0, 2],
		description: "Select a tile that is not owned nor protected. When opponent's mark is placed on the protected tile, place neutral mark instead."
	},
	"dummy": {
		cost: [1, 1, 0, 0, 2],
		description: "Transform 1 opponent mark to a neutral mark."
	},
	"year_plenty": {
		cost: [0, 0, 2, 0, 1],
		description: "Obtain 5 resources of your choice."
	},
	"monopoly": {
		cost: [1, 1, 1, 0, 0],
		description: "Select a tile that is not owned nor protected. Choose a resource. The tile will now produce the resource that you have chosen. You obtain the resource that you have selected."
	},
	"vp": {
		cost: [0, 0, 0, 2, 0],
		description: "Add 1 victory point to your inventory."
	},
	"city": {
		cost: [0, 0, 0, 3, 2],
		description: "When you place your mark, you gain two resources."
	},
	"port": {
		cost: [1, 1, 0, 3, 0],
		description: "Trade cost is reduced by 1."
	}
}

var player_resource = [
	[0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0]
];

var player_ability = [
	[0, 0, 0, 0, 0, 0, 0, 0], 
	[0, 0, 0, 0, 0, 0, 0, 0]
];

var map = [];

var connect_4 = [];

var protection = [];

var board = {
	column: board_column,
	row: board_row,
	size: tile_size / 937 / 1920 * window.innerHeight * window.innerWidth,
	gap: tile_gap / 937 * window.innerHeight
};

var offset = {
	x: (window.innerWidth - (board.row * board.size + (board.row - 1) * board.gap)) / 2,
	y: (window.innerHeight - (board.column * board.size + (board.column - 1) * board.gap)) / 2
}

var turn = 0;
var pause = true;
var ability_bought = 0;
var ability_used = false;
var rob = false;
var dummy = false;
var knight = false;
var monopoly = false;
var coord = [];
var ignore = true;
var player_win = [false, false];
var coord_selected = [0, 0];
var hover_enable = false;
var traded = 0;

function create_map() {
	for (let tile_row = 0; tile_row < board.row; tile_row++) {
		var map_layer = [];
		var connect_4_layer = [];
		var protection_layer = [];
		for (let tile_col = 0; tile_col < board.column; tile_col++) {
			map_layer.push(resource[Math.floor(Math.random() * resource.length)]);
			connect_4_layer.push("");
			protection_layer.push("");
		}
		map.push(map_layer);
		connect_4.push(connect_4_layer);
		protection.push(protection_layer);
	}
}

function create_board() {
	if (map.length == 0) create_map();
	for (let tile_row = 0; tile_row < board.row; tile_row++) {
		for (let tile_col = 0; tile_col < board.column; tile_col++) {
			ctx.fillStyle = color[resource.indexOf(map[tile_row][tile_col])];
			ctx.fillRect(tile_row * (board.size + board.gap) + offset.x, tile_col * (board.size + board.gap) + offset.y, board.size, board.size);
		}
	}
}

function draw_mark(x, y) {
	ctx.beginPath();
	ctx.arc(offset.x + x * board.size + board.size / 2 + x * board.gap, 
		offset.y + y * board.size + board.size / 2 + y * board.gap, 
		board.size / 2 * 0.9, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
}

function add_mark(x, y) {
	coord = [Math.floor((x - offset.x) / (board.size + board.gap)), Math.floor((y - offset.y) / (board.size + board.gap))];
	var alley = (turn % 2 == 0) ? "cyan" : "pink";
	var opponent = (turn % 2 == 0) ? "pink" : "cyan";
	if (coord[0] < 0 || coord[0] >= board.row || coord[1] >= 0) return;
	for (let tile_col = board.column - 1; tile_col >= 0; tile_col--) {
		if (connect_4[coord[0]][tile_col] != "") continue;
		else {
			if (protection[coord[0]][tile_col] == opponent) {
				connect_4[coord[0]][tile_col] = "dummy";
			}
			else {
				connect_4[coord[0]][tile_col] = alley;
				obtain_resources(coord[0], tile_col);
				connected_4 (coord[0], tile_col);
			}
			turn++;
			document.querySelector("#turn").innerHTML = (turn % 2 == 0) ? "Cyan's turn" : "Pink's turn";
			ability_bought = 0;
			ability_used = false;
			ignore = false;
			traded = 0;
			document.querySelector("[data = trade]").innerHTML = "- Trade (0 / 3) -";
			document.querySelector("[data = dev_card]").innerHTML = "- Buy Development Card (0 / 2) -";
			break;
		}
	}
	if (!ignore) {
		document.querySelector("#instruction").innerHTML = "Click Here To Drop Your Mark.";
	}
	update_ability();
	update_resource();
	display_board();
	winner();
	ignore = true;
}

function display_board() {
	for (let tile_row = 0; tile_row < board.row; tile_row++) {
		for (let tile_col = 0; tile_col < board.column; tile_col++) {
			ctx.fillStyle = color[resource.indexOf(map[tile_row][tile_col])];
			if (map[tile_row][tile_col] == "rob") ctx.fillStyle = "black";
			ctx.fillRect(tile_row * (board.size + board.gap) + offset.x, tile_col * (board.size + board.gap) + offset.y, board.size, board.size);
			if (protection[tile_row][tile_col] != "") {
				ctx.fillStyle = "black";
				ctx.fillRect(tile_row * (board.size + board.gap) + offset.x + 4 * board.gap, tile_col * (board.size + board.gap) + offset.y + 4 * board.gap, board.size - 8 * board.gap, board.size - 8 * board.gap);
				ctx.fillStyle = protection[tile_row][tile_col];
				ctx.fillRect(tile_row * (board.size + board.gap) + offset.x + 5 * board.gap, tile_col * (board.size + board.gap) + offset.y + 5 * board.gap, board.size - 10 * board.gap, board.size - 10 * board.gap);
			}
			if (connect_4[tile_row][tile_col] == "") continue;
			if (connect_4[tile_row][tile_col] == "dummy") ctx.fillStyle = "#7C513B";
			else ctx.fillStyle = connect_4[tile_row][tile_col];
			draw_mark(tile_row, tile_col);
		}
	}
}

function connected_4(x, y) {
	var check_vertical = check_horizontal = check_positive_diagnal = check_negative_diagnal = 0;
	if (connect_4[x][y] == "" || connect_4[x][y] == "dummy") return;
	var color = connect_4[x][y];
	var index = (color == "cyan") ? 0 : 1;
	// vertical
	for (let trial = 0; trial < 4; trial++) {
		if (y - trial < 0) break;
		for (let check = 0; check < 4; check++) {
			if (y - trial + check >= board.column) break;
			if (connect_4[x][y - trial + check] == color) check_vertical++;
		}
		if (check_vertical == 4) player_win[index] = true;
		check_vertical = 0;
	}
	// horiontal
	for (let trial = 0; trial < 4; trial++) {
		if (x - trial < 0) break;
		for (let check = 0; check < 4; check++) {
			if (x - trial + check >= board.row) break;
			if (connect_4[x - trial + check][y] == color) check_horizontal++;
		}
		if (check_horizontal == 4) player_win[index] = true;
		check_horizontal = 0;
	}
	// positive diagnal
	for (let trial = 0; trial < 4; trial++) {
		if (y - trial < 0 || x + trial >= board.row) break;
		for (let check = 0; check < 4; check++) {
			if (y - trial + check >= board.column || x + trial - check < 0) break;
			if (connect_4[x + trial - check][y - trial + check] == color) check_positive_diagnal++;
		}
		if (check_positive_diagnal == 4) player_win[index] = true;
		check_positive_diagnal = 0;
	}
	// negative diagnal
	for (let trial = 0; trial < 4; trial++) {
		if (y - trial < 0 || x - trial < 0) break;
		for (let check = 0; check < 4; check++) {
			if (y - trial + check >= board.column || x - trial + check >= board.row) break;
			if (connect_4[x - trial + check][y - trial + check] == color) check_negative_diagnal++;
		}
		if (check_negative_diagnal == 4) player_win[index] = true;
		check_negative_diagnal = 0;
	}
}

function obtain_resources(x, y) {
	var index = resource.indexOf(map[x][y]);
	player_resource[turn % 2][index] += (1 + player_ability[turn % 2][6] + (turn == 1));
}

function open_tab(tab) {
	if (rob || knight || pause) return;
	document.querySelector(tab).style.display = "flex";
	update_resource();
	pause = true;
}

function close_tab(close) {
	close.parentElement.style.display = "none";
	pause = false;
}

function trade() {
	var trade_item = document.querySelectorAll(".resource > input");
	var total_trade_to = 0;
	var total_trade_for = 0;
	for(let resources = 0; resources < resource.length; resources++) {
		if (parseInt(trade_item[resources].value) % (2 - player_ability[turn % 2][7]) != 0 || player_resource[turn % 2][resources] < parseInt(trade_item[resources].value)) {
			alert(`Your trade didn't went through.\n- Insufficient Material\n- Trade:For ratio is not ${2 - player_ability[turn % 2][7]}:1\n- Trade Material Must Be Even.`);
			return; 
		}
		total_trade_to += parseInt(trade_item[resources].value);
		total_trade_for += parseInt(trade_item[resources + resource.length].value);
	}
	if (total_trade_to != (2 - player_ability[turn % 2][7]) * total_trade_for || traded + total_trade_for > 3) {
		alert(`Your trade didn't went through.\n- Insufficient Material\n- Trade:For ratio is not ${2 - player_ability[turn % 2][7]}:1\n- Trade Material Must Be Even.\n- Attempt To Trade For More Than 3 Reasources This Turn`);
		return;
	}
	for(let give = 0; give < resource.length; give++) {
		player_resource[turn % 2][give] -= parseInt(trade_item[give].value);
		player_resource[turn % 2][give] += parseInt(trade_item[give + resource.length].value);
		trade_item[give].value = 0;
		trade_item[give + resource.length].value = 0;
	}
	traded += total_trade_for;
	document.querySelector("[data = trade]").innerHTML = `- Trade (${traded} / 3) -`;
	update_resource();
	alert("Trade Success");
}

function only_integer(input) {
	input.value = Math.abs(Math.floor(input.value));
}

function update_resource() {
	resource_list.forEach((item, i) => {
		var index = Math.floor(i / 5);
		if (index == 0 || index == 6) item.innerHTML = `${resource[i % resource.length]}: ${player_resource[0][i % 5]}`
		else if (index == 1 || index == 7) item.innerHTML = `${resource[i % resource.length]}: ${player_resource[1][i % 5]}`
		else item.innerHTML = `${resource[i % resource.length]}: ${player_resource[turn % 2][i % 5]}`
	});
	var color = (turn % 2 == 0) ? "cyan" : "pink";
	var prev_color = (turn % 2 == 0) ? "pink" : "cyan";
	document.querySelectorAll("[data = free]").forEach(div => {
		div.classList.remove(prev_color);
		div.classList.add(color);
	});
}

function update_ability() {
	for (let x = 0; x < 2; x++) {
		for (let i = 0; i < 8; i++) {
			document.querySelectorAll(".ability > .item")[(i + 8 * x)].innerHTML = player_ability[x][i];
		}
	}
}

function shop_item_selected(item) {
	document.querySelector(".shop_item_selected").classList.remove("shop_item_selected");
	item.classList.add("shop_item_selected");
}

function hide_price() {
	document.querySelector("#cost").style.display = "none";
}

function show_price(item) {
	document.querySelectorAll("#cost > div").forEach((resources, index) => {
		var display = (ability[item.getAttribute("data")].cost[index] == 0) ? "none" : "flex";
		resources.innerHTML = ability[item.getAttribute("data")].cost[index];
		resources.style.display = display;
	});
	document.querySelector("#cost").style.display = "flex";
}

function buy_ability() {
	if (ability_used || ability_bought == 2) {
		alert("You cannot buy development card this turn.\n- You played a development card in this turn.\n- You already bought two development cards in this turn.");
		return;
	}
	var selected_ability = document.querySelector(".shop_item_selected").getAttribute("data");
	for (let resources = 0; resources < resource.length; resources++) {
		if (player_resource[turn % 2][resources] < ability[selected_ability].cost[resources] || 
			selected_ability == "city" && player_ability[turn % 2][6] == 1 || 
			selected_ability == "port" && player_ability[turn % 2][7] == 1) {
			alert("Buying did not proceed.\n- Insufficient Material.\n- City And Port Can Be Bought Once During The Game");
			return;
		}
	}
	for (let resources = 0; resources < resource.length; resources++) {
		player_resource[turn % 2][resources] -= parseInt(ability[selected_ability].cost[resources]);
	}
	var index = 0;
	for (var action in ability) {
		if (selected_ability == action) break;
		index++;
	}
	player_ability[turn % 2][index]++;
	victory_point();
	ability_bought++;
	update_resource();
	update_ability();
	document.querySelector("[data = dev_card]").innerHTML = `- Buy Development Card (${ability_bought} / 2) -`;
	alert("Bought Successfully");
}

function robber() {
	if (knight || pause || dummy) return;
	if (rob) {
		rob = false;
		ignore = false;
		return;
	}
	if (player_ability[turn % 2][0] == 0 || ability_bought != 0 || ability_used) {
		rob = false;
		alert("You Cannot Use This Development Card.\n- Unowned Development Card\n- Bought Development Card This Turn.\n- Already Used Development Card This Turn.");
		return;
	}
	rob = true;
	document.querySelector("#instruction").innerHTML = "Select The Tile You Want To Steal..";
}

function robbing(x, y)  {
	coord = [Math.floor((x - offset.x) / (board.size + board.gap)), Math.floor((y - offset.y) / (board.size + board.gap))];
	if (coord[0] < 0 || coord[1] < 0 || coord[0] >= board.row || coord[1] >= board.column || map[coord[0]][coord[1]] == "rob") return;
	if (protection[coord[0]][coord[1]] != "" || connect_4[coord[0]][coord[1]] != "") {
		alert("You cannot rob a tile that is protected or owned by any mark");
		return;
	}
	player_ability[turn % 2][0]--;
	player_resource[turn % 2][resource.indexOf(map[coord[0]][coord[1]])]++;
	map[coord[0]][coord[1]] = "rob";
	ctx.fillStyle = "black";
	ctx.fillRect(coord[0] * (board.size + board.gap) + offset.x, coord[1] * (board.size + board.gap) + offset.y, board.size, board.size);
	ctx.fillStyle = connect_4[coord[0]][coord[1]];
	draw_mark(coord[0], coord[1]);
	rob = false;
	document.querySelector("#instruction").innerHTML = "Click Here To Drop Your Mark.";
	ability_used = true;
	ignore = false;
	update_resource();
	update_ability();
	window.setTimeout(() => hover_enable = true, 1000);
	document.querySelector("[data = dev_card]").innerHTML = `- Buy Development Card (Used) -`;
}

function use_knight() {
	if (pause || dummy || rob) return;
	if (knight) {
		knight = false;
		ignore = false;
		document.querySelector("#instruction").innerHTML = "Click Here To Drop Your Mark.";
		return;
	}
	if (player_ability[turn % 2][1] == 0 || ability_bought != 0 || ability_used) {
		alert("You Cannot Use This Development Card.\n- Unowned Development Card\n- Bought Development Card This Turn.\n- Already Used Development Card This Turn.");
		return;
	}
	knight = true;
	document.querySelector("#instruction").innerHTML = "Select unowned tile to protect.";
}

function protect_tile(x, y) {
	coord_selected = [Math.floor((x - offset.x) / (board.size + board.gap)), Math.floor((y - offset.y) / (board.size + board.gap))];
	if (coord_selected[0] < 0 || coord_selected[1] < 0 || coord_selected[0] >= board.row || coord_selected[1] >= board.column) return;
	var alley = (turn % 2 == 0) ? "cyan" : "pink";
	if (connect_4[coord_selected[0]][coord_selected[1]] != "" || protection[coord_selected[0]][coord_selected[1]] != "") {
		alert("This tile is owned or protected by player.");
		return;
	}
	protection[coord_selected[0]][coord_selected[1]] = alley;
	knight = false;
	ability_used = true;
	player_ability[turn % 2][1]--;
	update_ability();
	update_resource();
	display_board();
	document.querySelector("#instruction").innerHTML = "Click Here To Drop Your Mark.";
	console.log(protection);
	document.querySelector("[data = dev_card]").innerHTML = `- Buy Development Card (Used) -`;
}

function create_dummy() {
	if (knight || pause || rob) return;
	if (dummy) {
		dummy = false;
		ignore = false;
		document.querySelector("#instruction").innerHTML = "Click Here To Drop Your Mark.";
		return;
	}
	if (ability_bought != 0 || ability_used || player_ability[turn % 2][2] == 0) {
		alert("You Cannot Use This Development Card.\n- Unowned Development Card\n- Bought Development Card This Turn.\n- Already Used Development Card This Turn.");
		return;
	}
	dummy = true;
	document.querySelector("#instruction").innerHTML = "Select Oppoent's Mark to transform into dummy";
}

function transform_dummy(mouseX, mouseY) {
	var x = Math.floor((mouseX - offset.x) / (board.gap + board.size));
	var y = Math.floor((mouseY - offset.y) / (board.gap + board.size));
	var enemy = (1 - (turn % 2)) ? "pink" : "cyan";
	if (x < 0 || x >= board.row || y < 0) return;
	if (connect_4[x][y] != enemy) {
		alert("Select opponent's mark to transform into dummy.");
		return;
	}
	connect_4[x][y] = "dummy";
	dummy = false;
	ability_used = true;
	player_ability[turn % 2][2]--;
	document.querySelector("#instruction").innerHTML = "Click Here To Drop Your Mark.";
	display_board();
	update_ability();
	document.querySelector("[data = dev_card]").innerHTML = `- Buy Development Card (Used) -`;
}

function year_of_plenty() {
	if (knight || pause || dummy || rob) return;
	if (ability_used || ability_bought != 0 || player_ability[turn % 2][3] == 0) {
		alert("You Cannot Use This Development Card.\n- Unowned Development Card\n- Bought Development Card This Turn.\n- Already Used Development Card This Turn.");
		return;
	}
	document.querySelector("[data = year_of_plenty]").innerHTML = `Select ${year_plenty_resource} resources to obtain...`;
	document.querySelector("#year_of_plenty").style.display = "flex";
	pause = true;
}

function collect_year_of_plenty() {
	var items_collected = document.querySelectorAll("#year_of_plenty_list > .resource > input");
	var total = 0;
	items_collected.forEach(item => total += parseInt(item.value));
	if (total != year_plenty_resource) {
		alert(`Add in the number so that the resources add up to ${year_plenty_resource}.`);
		return;
	}
	pause = false;
	ability_used = true;
	player_ability[turn % 2][3]--;
	document.querySelector("#year_of_plenty").style.display = "none";
	items_collected.forEach((item, index) => {
		player_resource[turn % 2][index] += parseInt(item.value);
		item.value = 0;
	});
	update_resource();
	update_ability();
	document.querySelector("[data = dev_card]").innerHTML = `- Buy Development Card (Used) -`;
}

function use_monopoly(item) {
	if (monopoly) {
		monopoly = false;
		document.querySelector("#instruction").innerHTML = "Click Here To Drop Your Mark.";
		return;
	}
	if (knight || pause || dummy || rob) return;
	if (player_ability[turn % 2][4] == 0 || ability_bought != 0 || ability_used) {
		alert("You Cannot Use This Development Card.\n- Unowned Development Card\n- Bought Development Card This Turn.\n- Already Used Development Card This Turn.");
		return;
	}
	document.querySelector("#instruction").innerHTML = "Select the tile you want to change the resource type.";
	monopoly = true;
}

function monopoly_tile_selected(x, y) {
	coord_selected = [Math.floor((x - offset.x) / (board.size + board.gap)), Math.floor((y - offset.y) / (board.size + board.gap))];
	if (coord_selected[0] < 0 || coord_selected[1] < 0 || coord_selected[0] >= board.row || coord_selected[1] >= board.column) return;
	if (connect_4[coord_selected[0]][coord_selected[1]] != "" || protection[coord_selected[0]][coord_selected[1]] != "") {
		alert("This tile is owned or protected by player.");
		return;
	}
	document.querySelector("#Monopoly").style.display = "flex";
	pause = true;
}

function monopoly_selected(item) {
	document.querySelector("#Monopoly").style.display = "none";
	map[coord_selected[0]][coord_selected[1]] = item.getAttribute("data");
	player_resource[turn % 2][resource.indexOf(item.getAttribute("data"))]++;
	pause = false;
	monopoly = false;
	ability_used = true;
	player_ability[turn % 2][4]--;
	update_resource();
	update_ability();
	display_board();
	document.querySelector("[data = dev_card]").innerHTML = `- Buy Development Card (Used) -`;
}

function victory_point() {
	if (player_ability[turn % 2][5] == 10) {
		player_win[turn % 2]++;
		winner();
	}
}

function winner() {
	// check empty tile
	var empty_tile = false;
	for (let tile_row = 0; tile_row < board.row; tile_row++) {
		if (empty_tile) break;
		for (let tile_col = 0; tile_col < board.column; tile_col++) {
			if (connect_4[tile_row][tile_col] == "") {
				empty_tile = true;
				break;
			}
		}
	}
	if (!player_win[0] && !player_win[1] && empty_tile) return;
	pause = true;
	var winner = "Draw. No Winner...";
	var color = "lightgray";
	if (!empty_tile) {
		player_win[0] = player_ability[0][5];
		player_win[1] = player_ability[1][5];
	}
	if (player_win[0] != player_win[1]) {
		winner = (player_win[0] > player_win[1]) ? "CYAN WIN!!!" : "PINK WIN!!!";
		color = (player_win[0] > player_win[1]) ? "cyan" : "pink";
	}
	document.querySelectorAll("#option > button").forEach(button => button.style.backgroundColor = color);
	document.querySelector("#win").style.display = "flex";
	document.querySelector("#win > h1").innerHTML = winner;
}

function return_to_board() {
	document.querySelector("#win").style.display = "none";
}

function play_again() {
	document.querySelector("#win").style.display = "none";
	player_resource = [
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0]
	];
	player_ability = [
		[0, 0, 0, 0, 0, 0, 0, 0], 
		[0, 0, 0, 0, 0, 0, 0, 0]
	];
	map = [];
	connect_4 = [];
	turn = 0;
	pause = false;
	ability_bought = 0;
	ability_used = false;
	rob = false;
	dummy = false;
	knight = false;
	coord = [];
	ignore = true;
	player_win = [0, 0];
	protection = [];
	traded = 0;
	update_resource();
	update_ability();
	create_board();
	document.querySelector("#turn").innerHTML = "Cyan's turn";
}

function passive_announcement() {
	if (rob || knight || pause || dummy) return;
	alert("This Development Card Is Used Passively.\nIf You Have Any.");
}

function menu_selected(item) {
	document.querySelector("#menu").style.display = "none";
	document.querySelector(item).style.display = "flex";
}

function play() {
	document.querySelector("#menu_container").style.display = "none";
	create_map();
	document.querySelector("#game").style.display = "flex";
	hover_enable = true;
	pause = false;
}

function main_menu(item) {
	item.parentElement.style.display = "none";
	document.querySelector("#menu").style.display = "flex";
}

function mouse_hover(mouseX, mouseY) {
	if (pause || !hover_enable) return;
	var x = Math.floor((mouseX - offset.x) / (board.gap + board.size));
	var y = Math.floor((mouseY - offset.y) / (board.gap + board.size));
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (x >= 0 && x < board.row) {
		if (y < 0  && !rob && !knight && !dummy) {
			ctx.fillStyle = (turn % 2 == 0) ? "cyan" : "pink";
			ctx.fillRect(x * (board.size + board.gap) - board.gap + offset.x, 0, board.size + 2 * board.gap, canvas.height);
		}
		else {
			if ((rob || knight || dummy || monopoly) && y >= 0 && y < board.column) {
				if (rob) ctx.fillStyle = "black";
				else if (knight) ctx.fillStyle = "orange";
				else if (dummy) ctx.fillStyle = "#7C513B";
				else if (monopoly) ctx.fillStyle = "blue";
				ctx.fillRect(x * (board.size + board.gap) - board.gap + offset.x, y * (board.size + board.gap) - board.gap + offset.y, board.size + 2 * board.gap, board.size + 2 * board.gap);
			}
		}
	}
	display_board();
}

function help(div) {
	document.querySelector("#how_to_play > .close").style.display = "none";
	document.querySelector("#help_instruction").style.display = "none";
	document.querySelector("#help_option_container").style.display = "none";
	document.querySelector(div).style.display = "flex";
}

function return_menu(div) {
	for (let i = 0; i < 3; i++) {
		document.querySelectorAll("#how_to_play > *")[i].style.display = "grid";
	}
	div.parentElement.style.display = "none";
}

function show_img() {
	document.querySelector("#sample").style.display = "block";
}

function hide_img() {
	document.querySelector("#sample").style.display = "none";
}

function open_shop_help() {
	document.querySelector("#shop").style.display = "none";
	document.querySelector("#shop_help").style.display = "flex";
}

function close_shop_help() {
	document.querySelector("#shop").style.display = "flex";
	document.querySelector("#shop_help").style.display = "none";
}

function open_shop_info() {
	document.querySelector("#shop_help").style.display = "none";
	document.querySelector("#shop_help_info").style.display = "flex";
	document.querySelector(".ability_type").innerHTML = document.querySelector(".shop_help_selected > h1").innerHTML;
	document.querySelector("#ability_selected > div > div").classList.remove(document.querySelector("#ability_selected > div > div").classList[1]);
	document.querySelector("#ability_selected > div > div").classList.add(document.querySelector(".shop_help_selected").getAttribute("data"));
	document.querySelector(".ability_info").innerHTML = ability[document.querySelector(".shop_help_selected").getAttribute("data")].description;
}

function close_shop_info() {
	document.querySelector("#shop_help").style.display = "flex";
	document.querySelector("#shop_help_info").style.display = "none";
}

function ability_help_selected(item) {
	document.querySelector(".shop_help_selected").classList.remove("shop_help_selected");
	item.classList.add("shop_help_selected");
}

window.addEventListener("click", event => {
	if  (pause) return;
	if (!knight && !rob && !dummy && !monopoly) {
		add_mark(event.clientX, event.clientY);
		mouse_hover(event.clientX, event.clientY);
	}
	if (rob) robbing(event.clientX, event.clientY);
	if (knight) protect_tile(event.clientX, event.clientY);
	if (dummy) transform_dummy(event.clientX, event.clientY);
	if (monopoly) monopoly_tile_selected(event.clientX, event.clientY);
});

window.onmousemove = (event) => {
	if (pause) return;
	mouse_hover(event.clientX, event.clientY);
}

window.addEventListener("resize", event => {
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	board = {
		column: 7,
		row: 13,
		size: 90 / 937 / 1920 *canvas.height * canvas.width,
		gap: 5 / 937 * canvas.height
	};
	offset = {
		x: (window.innerWidth - (board.row * board.size + (board.row - 1) * board.gap)) / 2,
		y: (window.innerHeight - (board.column * board.size + (board.column - 1) * board.gap)) / 2
	}
	display_board();	
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
    confirm(9);
});

/*	Rules
	- Connect 4
		- Cyan goes first, pink goes second
		- connect 4 of your marks horizontally, vertically, or diagnally to win
	- Catan
		- When pink places the mark on its first turn, it gains two resources.
		- You can buy 2 development cards or use 1 development card in your turn.
		- Trade
			- Offer 2 same resources for 1 any resource
			- maximum 3 trades per turn
		- Development Card
			- Robber: Select a tile that is not owned or protected. You gain the resource of that tile and the tile will not produce any resource.
			- Knight: Select a tile that is not owned or protected. When opponent's mark is placed on the protected tile, place neutral mark instead.
			- Dummy: Convert 1 opponent mark to a neutral mark.
			- Year of plenty: Obtain 5 resources of your choice
			- Monopoly: Select a tile that is not owned or protected. Choose a resource. The tile will now produce the resource that you have chosen.
			- Port: Trade cost is reduced by 1.
			- City: When you place your mark, gain two resources.
			- Victory Point: add 1 victory point to your inventory. 
				- buy 10 victory points to win
				- when the board is completely filled, the player with more victory points win
*/

/*
	wish-list 
	- mark drop animation
	- sound effect
	- cancel dev card indicator
	- better gui
*/