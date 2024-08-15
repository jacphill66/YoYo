function generateGrid(side_length, x_max, y_max){
	let grid = [];
	for(let i = 0; i < x_max; i++){
		grid.push([]);
		for(let j = 0; j < y_max; j++){
			let cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			cell.setAttribute('class', 'cell');
			cell.setAttribute('x', i*side_length);
			cell.setAttribute('y', j*side_length);
			cell.setAttribute('height', side_length);
			cell.setAttribute('width', side_length);
			cell.setAttribute('stroke', '#ddd');
			cell.setAttribute('fill', 'white');
			cell.setAttribute("data-visited", "f");
			svg_field.appendChild(cell);
			grid[i].push(cell);
		}
	}
	return grid;
}

function generateSquare(wait_time, x_pos, y_pos, color, side_length){
	let square = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
	square.setAttribute('id', squareID);
	// 0.1s all ease;
	if(wait_time > 0) square.setAttribute('transition', `${wait_time/1000}s all ease`);
	square.setAttribute('x', side_length*x_pos);
	square.setAttribute('y', side_length*y_pos);
	square.setAttribute('height', side_length);
	square.setAttribute('width', side_length);
	square.setAttribute('fill', color);
	square.setAttribute('stroke', 'black');
	svg_field.appendChild(square);
	return square;
}

//https://stackoverflow.com/questions/1484506/random-color-generator
function generateRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
	  color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
  }
  
/*
async function generateFood(grid, x_max, y_max, side_length, amount){
	let x = Math.floor(Math.random() * x_max);
	let y = Math.floor(Math.random() * y_max);
	//generateSquare(0, 3, 2, generateRandomColor(), side_length)
	for(let i = 0; i < amount; i++)	{
		grid[x][y] = generateSquare(0, x, y, generateRandomColor(), side_length)
		while(grid[x][y].getAttribute('fill') != 'white'){
			x = Math.floor(Math.random() * x_max);
			y = Math.floor(Math.random() * y_max);
		}
		await wait(10);
	}
}*/

function valid_move(action, x, y, x_max, y_max){
	if((x == 0) && action=='L') return false;
	if((x == x_max-1) && action=='R') return false;
	if((y == 0) && action=='U') return false;
	if((y == y_max-1) && action=='D') return false;
	return true;
}

function random_inversion(){
	return Math.random() > 0.5 ? 1 : -1;
}

function initializeValueTable(initial_value_code, x_max, y_max){
	let table = [];
	for(let i = 0; i < x_max; i++){
		table.push([]);
		for(let j = 0; j < y_max; j++){
			table[i].push(new Map());
			for(let k = 0; k < actions.length; k++){
				if(valid_move(actions[k], i, j, x_max, y_max)){
					if(initial_value_code == "A") table[i][j].set(actions[k], Math.random()*random_inversion());
					else if(initial_value_code == "B") table[i][j].set(actions[k], Math.random());
					else if(initial_value_code == "C") table[i][j].set(actions[k], 10);
					else if(initial_value_code == "D") table[i][j].set(actions[k], 100);
					else throw new Error("Invalid Code");
				}
			}
		}
	}
	return table;
}

function generateQuadGrid(grid, x_max, y_max){
	let quad_grid = [];
	for(let i = 0; i < x_max; i++){
		quad_grid.push([]);
		for(let j = 0; j < y_max; j++){
			quad_grid[i].push([])
			if(grid[i][j].getAttribute('fill')=='#f0f0f0') quad_grid[i][j] = 0;
			else if(grid[i][j].getAttribute('fill')=='#F44336') quad_grid[i][j] = 1;
			else if(grid[i][j].getAttribute('fill')=='#3b3b3b') quad_grid[i][j] = 2;
			else if(grid[i][j].getAttribute('fill')=='#4CAF50') quad_grid[i][j] = 3;
			else throw new Error("Invalid Grid Color");
		}
	}
	return quad_grid;
}

function initializeRewardTable(quad_grid, x_max, y_max){
	let rewards = [];
	for(let i = 0; i < x_max; i++){
		rewards.push([]);
		for(let j = 0; j < y_max; j++){
			rewards[i].push([])
			if(quad_grid[i][j] == 0) rewards[i][j] = -100;//black
			else if(quad_grid[i][j] == 1) rewards[i][j] = 50;//red
			else if(quad_grid[i][j] == 2) rewards[i][j] = -1;//white
			else if(quad_grid[i][j] == 3) rewards[i][j] = -1;//green
			else throw new Error("Invalid Grid Color");
		}
	}
	return rewards;
}

function move_left(x, y){
	return ['L', x-1, y]
}

function move_right(x, y){
	return ['R', x+1, y]
}

function move_down(x, y){
	return ['D', x, y+1]
}

function move_up(x, y){
	return ['U', x, y-1]
}

function random_action(x, y, x_max, y_max){
	while(true){
		let choice = Math.random();
		if(valid_move('L', x, y, x_max, y_max) && choice <= 0.25) return move_left(x, y);
		else if(valid_move('R', x, y, x_max, y_max) && choice > 0.25 && choice <= 0.5) return move_right(x, y);
		else if(valid_move('U', x, y, x_max, y_max) && choice > 0.5 && choice <= 0.75) return move_up(x, y);
		else if(valid_move('D', x, y, x_max, y_max)) return move_down(x, y);
	}	
}

function max_QValueAction(QValueTable, x, y){
	let possibleMoves = QValueTable[x][y];
	let action = Array.from(possibleMoves.keys())[0];
	let max = possibleMoves.get(action);
	possibleMoves.forEach((value, key) => { if(value > max){ max = value; action = key;}});
	return [action, max];
}

function apply_policy(QValueTable, epsilon, x, y, x_max, y_max){
	let [action, max] = max_QValueAction(QValueTable, x, y);
	if(Math.random() < epsilon)	return [max].concat(random_action(x, y, x_max, y_max));
	if(action == 'L') return [max, action, x-1, y];
	else if(action == 'R') return [max, action, x+1, y];
	else if(action == 'U') return [max, action, x, y-1];
	return [max, action, x, y+1];
}

function munch(grid, x, y, pos_list){
	let color = grid[x][y].getAttribute('fill');
	if(color != 'white') {
		pos_list.push([color, x, y])
		grid[x][y].setAttribute('fill', 'white');
		grid[x][y].setAttribute('stroke', '#ddd');
	}
}

function moveAgent(agent, x, y, side_length){
	agent.setAttribute('x', x*side_length);
	agent.setAttribute('y', y*side_length);
}

async function delayedMove(agent, wait_time, x, y, side_length){
	moveAgent(agent, x, y, side_length);
	//if(mode_flag && grid[x][y].getAttribute('fill') != 'white') munch(grid, x, y, pos_list);
	await wait(wait_time);
}

/*
function reset_food_grid(grid, pos_list){
	for(let i = 0; i < pos_list.length; i++){
		let t = pos_list[i]
		grid[t[1]][t[2]].setAttribute('fill', t[0])
		grid[t[1]][t[2]].setAttribute('stroke', 'black')
	}
}*/
/*
async function highlightSolution(agent, wait_time, x, y, side_length, grid, qVals, epsilon, x_max, y_max){
	await delayedMove(agent, wait_time, x, y, side_length, grid, qVals);
	for(let i = 0; i < 100; i++){
		let [m, a, new_x, new_y] = apply_policy(qVals, epsilon, x, y, x_max, y_max)
		await delayedMove(agent, wait_time, new_x, new_y, side_length);	
		x = new_x;
		y = new_y;
		if(grid[x][y].getAttribute('fill') == '#F44336') return;
	}
}*/

async function QLearning(grid, initial_value_code, alpha, gamma, epsilon, side_length, x_max, y_max, color){
	let speed_input = document.getElementById('speed');
	let wait_time = 101-speed_input.value;
	speed_input.addEventListener("input", (event) => { 
		wait_time = 101-event.target.value;
		if(wait_time > 0) agent.setAttribute('transition', `${wait_time/1000}s all ease`);
	});
	//let wait_time = 10;
	let quad_grid = generateQuadGrid(grid, x_max, y_max);
	let reward_table = initializeRewardTable(quad_grid, x_max, y_max);
	let start_pos = find_start(grid);
	let agent = generateSquare(wait_time, start_pos[0], start_pos[1], color, side_length);
	let QValueTable = initializeValueTable(initial_value_code, x_max, y_max);
	var current_state = [agent.getAttribute('x'), agent.getAttribute('y')];
	for(let i = 0; i < episodes; i++){
		var [x, y] = start_pos;
		let moves = 0;
		let pos_list = [];
		let actions = [];
		if (wait_time > 0) await delayedMove(agent, wait_time, x, y, side_length, grid, pos_list);
		do{
			current_state = [x, y];
			let [m, a, new_x, new_y] = apply_policy(QValueTable, epsilon, current_state[0], current_state[1], x_max, y_max)
			if (wait_time > 0) await delayedMove(agent, wait_time, new_x, new_y, side_length, grid, pos_list);
			let reward = reward_table[new_x][new_y];
			let entry = QValueTable[current_state[0]][current_state[1]];
			entry.set(a, entry.get(a)+alpha*(reward+gamma*m-entry.get(a)));
			x = new_x;
			y = new_y;
			moves += 1;
			actions.push(a)
		}while(grid[x][y].getAttribute('fill') != '#F44336');
		//while(grid[x][y].getAttribute('fill') != '#F44336');
		//grid[x][y].getAttribute('fill') != '#f0f0f0' && grid[x][y].getAttribute('fill') != '#F44336'
		/*if(grid[x][y].getAttribute('fill') == '#F44336'){
			console.log(actions)
			return;
		}*/
	}	
	highlightSolution(agent, wait_time, start_pos[0], start_pos[1], side_length, grid, QValueTable, epsilon, x_max, y_max);
}

async function Sarsa(grid, initial_value_code, alpha, gamma, epsilon, side_length, x_max, y_max, color){
	console.log("sarsa")
	let speed_input = document.getElementById('speed');
	let wait_time = 100-speed_input.value;

	speed_input.addEventListener("input", (event) => { 
		wait_time = 100-event.target.value;
		if(wait_time > 0) agent.setAttribute('transition', `${wait_time/1000}s all ease`);
	});

	let quad_grid = generateQuadGrid(grid, x_max, y_max);//change this
	let reward_table = initializeRewardTable(quad_grid, x_max, y_max);//change this
	let start_pos = find_start(grid);

	let agent = generateSquare(wait_time, start_pos[0], start_pos[1], color, side_length);
	let QValueTable = initializeValueTable(initial_value_code, x_max, y_max);

	for(let i = 0; i < episodes; i++){
		var [start_x, start_y] = start_pos;
		let moves = 0;
		let pos_list = [];
		let actions = [];
		if (wait_time > 0) await delayedMove(agent, wait_time, start_x, start_y, side_length, grid, mode_flag, pos_list);
		let [m, a, new_x, new_y] = apply_policy(QValueTable, epsilon, start_x, start_y, x_max, y_max)
		let [old_x, old_y] = start_pos;
		do{
			//apply_policy returns the new state
			if (wait_time > 0) await delayedMove(agent, wait_time, new_x, new_y, side_length, grid, mode_flag, pos_list);
			let reward = reward_table[new_x][new_y];
			let [new_m, new_a, new_new_x, new_new_y] = apply_policy(QValueTable, epsilon, new_x, new_y, x_max, y_max)
			let entry = QValueTable[old_x][old_y];
			entry.set(a, entry.get(a)+alpha*(reward+gamma*m-entry.get(a)));
			actions.push(a)
			test = (mode_flag && moves < 10) || (!mode_flag && (grid[new_x][new_y].getAttribute('fill') != 'black' && grid[new_x][new_y].getAttribute('fill') != 'red'));
			old_x = new_x;
			old_y = new_y;
			a = new_a;
			new_x = new_new_x;
			new_y = new_new_y;
			m = new_m;
			moves += 1;
		}while(test);
		if(!mode_flag && grid[old_x][old_y].getAttribute('fill') == 'red'){
			console.log(actions)
			return;
		}
		if(mode_flag) reset_food_grid(grid, pos_list)
	}	
}


function randomAdjacentCell(cell, grid, side_length, x_max, y_max){
	let adjacent_cells = [];
	let x = cell.getAttribute('x')/side_length;
	let y = cell.getAttribute('y')/side_length;
	if(x-2 >= 0 && grid[x-2][y].getAttribute("data-visited") == "f"){
		adjacent_cells.push([grid[x-2][y], grid[x-1][y]]);
	}
	if(x+2 < x_max && grid[x+2][y].getAttribute("data-visited") == "f"){
		adjacent_cells.push([grid[x+2][y], grid[x+1][y]]);
	}
	if(y-2 >= 0 && grid[x][y-2].getAttribute("data-visited") == "f"){
		adjacent_cells.push([grid[x][y-2], grid[x][y-1]]);
	}
	if(y+2 < y_max && grid[x][y+2].getAttribute("data-visited") == "f"){
		adjacent_cells.push([grid[x][y+2], grid[x][y+1]]);
	}

	if(adjacent_cells.length > 0){
		let i = Math.floor(Math.random()*adjacent_cells.length);
		adjacent_cells[i][1].setAttribute('fill', '#3b3b3b');
		//adjacent_cells[i][1].setAttribute('stroke', 'white');
		return adjacent_cells[i][0];
	}
	return null;
}

async function generateMazeRecursivley(cell, grid, animatize, side_length, x_max, y_max){
	let c = randomAdjacentCell(cell, grid, side_length, x_max, y_max);
	while(c != null){
		//await wait(waitTime);
		if(animatize) await wait(10);
		c.setAttribute('fill', '#3b3b3b');
		c.setAttribute('data-visited', 't');
		await generateMazeRecursivley(c, grid, animatize, side_length, x_max, y_max);
		c = randomAdjacentCell(cell, grid, side_length, x_max, y_max);
	}
}

function find_start(grid, mode_flag){
	if(mode_flag) return [0, 0];
	if(grid[0][0].getAttribute("fill") != "#f0f0f0") return [0, 0];
	else if(grid[0][1].getAttribute("fill") != "#f0f0f0") return [0, 1];
	else if(grid[1][0].getAttribute("fill") != "#f0f0f0") return [1, 0];
	else return [1, 1];
}

function find_end(grid, x_max, y_max, mode_flag){
	if(mode_flag) return [x-1, y-1];
	let x = x_max;
	let y = y_max;
	if(grid[x-1][y-1].getAttribute("fill") != "#f0f0f0") return [x-1, y-1];
	else if(grid[x-1][y-2].getAttribute("fill") != "#f0f0f0") return [x-1, y-2];
	else if(grid[x-2][y-1].getAttribute("fill") != "#f0f0f0") return [x-2, y-1];
	else return [x-2, y-2];
}

async function generateMaze(grid, animatize, side_length, x_max, y_max){
	let randomX = Math.floor(Math.random()*x_max);
	let randomY = Math.floor(Math.random()*y_max);
	let cells = document.getElementsByClassName('cell');
	for(let j = 0; j < cells.length; j++){
		cells[j].setAttribute('stroke', 'black');
		cells[j].setAttribute('fill', '#f0f0f0');
	}	
	await generateMazeRecursivley(grid[randomX][randomY], grid, animatize, side_length, x_max, y_max);
	let start_pos = find_start(grid);
	let end_pos = find_end(grid, x_max, y_max);
	grid[start_pos[0]][start_pos[1]].setAttribute("fill", "#4CAF50");
	grid[end_pos[0]][end_pos[1]].setAttribute("fill", "#F44336");
}

function clear_svg(svg){
	while (svg.firstChild) {
		svg.removeChild(svg.firstChild);
	}
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

//Animation Constants
const color = "blue";//Random for random colors
const svgID = "viewbox";
const squareID = "square";
const svg_field = document.getElementById(svgID);
const actions = ['L', 'R', 'D', 'U'];

let episodes = 100;
var wait_time = 10;

var success_count = 0;

function determineSideLength(size){
	switch(parseInt(size)){
		case 5: return 10;
		case 4: return 20;
		case 3: return 25;
		case 2: return 50;
		case 1: return 100;
		case 0: return 125;
	}
}

async function main(){

	let run = document.getElementById('go-button');
	let sizeSilder = document.getElementById('slider-label-2');
	let side_length = determineSideLength(sizeSilder.value);
	console.log(side_length);
	let x_max = 1000/side_length;
	let y_max = 500/side_length;
	sizeSilder.oninput = function() {
		side_length = determineSideLength(this.value);
		x_max = 1000/side_length;
		y_max = 500/side_length;
		console.log(side_length);
    };
	
	let initial_value_code = "A";
	let alpha = 0.1;//learning rate
	let gamma = 0.9;//discount rate
	let epsilon = 0.01;//greedy-epsilon policy function

	let amount = 10;

	let maze = true;
	let sarsa = false;
	let q_learning = true;

	let grid = null;
	let color = "blue";
	color = "#FF9800";
	run.addEventListener("click", async function(event){
		clear_svg(svg_field); 
		grid = generateGrid(side_length, x_max, y_max);
		await generateMaze(grid, true, side_length, x_max, y_max); 
		await QLearning(grid, initial_value_code, alpha, gamma, epsilon, side_length, x_max, y_max, color)
		//clear_svg(svg_field); 
	});
}
main();