//Made by _programmeKid

//Variables
var discord = require("discord.js");
var fs = require("fs");
var express = require("express");
var readline = require("readline");
var ytdl = require("ytdl-core");
var settings = require("./settings.json");
var request = require("request");
var client = new discord.Client();
var memery = new discord.WebhookClient("505886033725095976","JuPcxKvDddmyQhLZd8231vvDVJ9F6DxC6JwaFg3xXGMHhGDnBoeIQg01ajgMDsLLjtai");
var prefix = settings.prefix;
var token = settings.token;
var currentdispatcher = undefined;
var queue = [];
var selected = undefined;
var playing = false;
var loopqueue = false;
var app = express();
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});


//Classes
class Database{
	constructor(){

	}
	getval(key){
		let db = require("./database.json");
		return db[key];
	}
	setval(key,val){
		let db = require("./database.json");
		db[key] = val;
		fs.writeFile("./database.json",JSON.stringify(db),(err) => {
			if(err) throw err;
		});
	}
	clear(){
		fs.writeFile("./database.json","{}",(err) => {
			if(err) throw err;
		});
	}
}

class System{
	constructor(){
		this.prefix = ";:";
	}
	exec(str){
		let prefix = this.prefix;
		let cmdarray = str.split(" ");
		let cmd = cmdarray[0];
		let args = cmdarray.slice(1);
		let retval = "";

		try{
			if(cmd == prefix + "DATABASE"){
				let db = new Database();

				if(args[0] == "GET"){
					retval = db.getval(args[1]);
				} else if(args[0] == "SET"){
					let newval = undefined;
					let key = args[1];
					let type = args[2];

					if(type == "int"){
						newval = parseInt(args[3]);
					} else if(type == "string"){
						newval = args.slice(3).join(" ");
					} else if(type == "json"){
						newval = JSON.parse(args.slice(3).join(" "));
					}

					db.setval(key,newval);

					retval = "set " + key + " to " + newval + ".";
				} else if(args[0] == "CLEAR"){
					db.clear();
					retval = "Database cleared!";
				} else if(args[0] == "UPDATE"){
					let guild = client.guilds.find("id","469985171966525440");
					let members = guild.members.array();
					for(let i in members){
						let member = members[i];
						if(!db.getval("id-" + member.user.id)){
							db.setval("id-" + member.user.id,{name: member.user.username, tc: 10, wc: 0, cc: 0, nbc: 0, bc: 0});
						}
					}
					retval = "Database updated";
				}

			} else if(cmd == prefix + "KILL"){
				process.exit(0);
			} else{
				retval = "Error: Unknown command!";
			}
		} catch(e){
			console.log(e);
		}

		return retval;
	}
}

class Shop{
	constructor(shoptype){
		this.items = [
			new ShopItem(1,{
				name: "Semi-Known~",
				desc: "We kinda know you at this point but still...",
				price: 200,
				pricetype: "tc"
			}),
			new ShopItem(2,{
				name: "Known~",
				desc: "We know you now but we don't notice you.",
				price: 400,
				pricetype: "tc"
			}),
			new ShopItem(3,{
				name: "Respected~",
				desc: "We respect you enough to give you this role.",
				price: 600,
				pricetype: "tc"
			}),
			new ShopItem(4,{
				name: "Devoted~",
				desc: "You would give your life for the Toxic Cult.",
				price: 1000,
				pricetype: "tc"
			})
		];
	}
	buy(member,item){
		let buyable = this.items[item-1];
		if(!buyable){
			return "Unknown item"
		} else{
			let success = buyable.buy(member);
			if(typeof success == "string"){
				return success;
			} else{
				return buyable;
			}
		}
	}
	embed(){
		let embed = {};
		embed.title = "Shop:";
		embed.fields = [];
		for(let i = 0; i < this.items.length; i++){
			embed.fields.push({
				name: (i+1) + ") " + this.items[i].name,
				value: "Description: " + this.items[i].desc + "\nPrice: " + this.items[i].price + " " + this.items[i].pricetype
			});
		}
		embed.footer = {text: "Do !buy <itemnumber> to buy an item"};
		return embed
	}
}

class ShopItem{
	constructor(item,info){
		this.itemid = item;
		this.name = info.name;
		this.desc = info.desc;
		this.price = info.price;
		this.pricetype = info.pricetype;
	}
	buy(member){
		if(this.pricetype == "tc"){
			if(getTc(member) < this.price) return "Not enough TC";
			
			if(this.itemid == 1){
				member.addRole("472523550809653259");
				takeTc(member,this.price);
			} else if(this.itemid == 2){
				member.addRole("472523448229560342");
				takeTc(member,this.price);
			} else if(this.itemid == 3){
				member.addRole("472523739423178752");
				takeTc(member,this.price);
			} else if(this.itemid == 4){
				member.addRole("472523876669194241");
				takeTc(member,this.price);
			}
		}

		return this;
	}
}

//Functions
function random(min,max){
	return Math.floor(Math.random() * (max-min+1)) + min;
}

function isAdmin(member){
	let returnval = false;
	if(member.roles.find("id","481964920426987531") || member.roles.find("id","481975313794859043") || member.id == "473977899599396865"){
		returnval = true;
	}
	return returnval;
}

function getTc(member){
	let db = new Database();
	return db.getval("id-" + member.id).tc;
}

function giveTc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.tc += amount;
	db.setval("id-" + member.id,userinfo);
}

function takeTc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.tc -= amount;
	if(userinfo.tc > 0){
		db.setval("id-" + member.id,userinfo);
	}
}

function getWc(member){
	let db = new Database();
	return db.getval("id-" + member.id).wc;
}

function giveWc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.wc += amount;
	db.setval("id-" + member.id,userinfo);
}

function takeWc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.wc -= amount;
	if(userinfo.wc > 0){
		db.setval("id-" + member.id,userinfo);
	}
}

function getCc(member){
	let db = new Database();
	return db.getval("id-" + member.id).cc;
}

function giveCc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.cc += amount;
	db.setval("id-" + member.id,userinfo);
}

function takeCc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.cc -= amount;
	if(userinfo.cc > 0){
		db.setval("id-" + member.id,userinfo);
	}
}

function getnbc(amount){
	let db = new Database();
	return db.getval("id-" + member.id).nbc;
}

function givenbc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.nbc += amount;
	db.setval("id-" + member.id,userinfo);
}

function takenbc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.nbc -= amount;
	if(userinfo.nbc > 0){
		db.setval("id-" + member.id,userinfo);
	}
}

function getBc(amount){
	let db = new Database();
	return db.getval("id-" + member.id).b;
}

function giveBc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.bc += amount;
	db.setval("id-" + member.id,userinfo);
}

function takeBc(member,amount){
	let db = new Database();
	let userinfo = db.getval("id-" + member.id);
	userinfo.bc -= amount;
	if(userinfo.bc > 0){
		db.setval("id-" + member.id,userinfo);
	}
}

function convert(member,from,to,amount){
	let db = new Database();

	if(to == "tc"){
		if(from == "wc"){
			let tc = amount * 4;
			let wc = getWc(member) - amount;

			if(wc > 0){
				let userinfo = db.getval("id-" + member.id);
				userinfo.tc = tc;
				userinfo.wc = wc;
				db.setval("id-" + member.id,userinfo);
			}
		} else if(from == "cc"){
			let tc = amount * 2;
			let cc = getCc(member) - amount;

			if(cc > 0){
				let userinfo = db.getval("id-" + member.id);
				userinfo.tc = tc;
				userinfo.cc = cc;
				db.setval("id-" + member.id,userinfo);
			}
		} else if(from == "nbc"){
			let tc = amount * 6;
			let nbc = getWc(member) - amount;

			if(nbc > 0){
				let userinfo = db.getval("id-" + member.id);
				userinfo.tc = tc;
				userinfo.nbc = nbc;
				db.setval("id-" + member.id,userinfo);
			}
		}
	}
}

function getMeme(){
	return new Promise((resolve,reject) => {
		request("https://www.reddit.com/r/dankmemes/new.json?sort=new",(err,res,body) => {
			let json = JSON.parse(body);
			let posts = json.data.children;
			let post = posts[random(0,posts.length)];
			while(post == undefined){
				post = posts[random(0,posts.length)];
			}
			resolve({
				text: post.data.title,
				image: post.data.url
			});
		});
	});
}

function DBupdate(){
	let system = new System();
	system.exec(";:DATABASE UPDATE");
}

//Events
client.on("ready",() => {
	let activities = [
		["Toxic ramble","LISTENING"],
		["Para & Toxic lewd people","WATCHING"],
		["with Toxic's server","PLAYING"],
		["you out your window","WATCHING"],
		["Life of Boris","WATCHING"],
		["Toxic singing","LISTENING"]
	];
	let activity = 0;
	console.log("Logged in!");
	client.user.setActivity(activities[activity][0],{type: activities[activity][1]});
	setInterval(function(){
		if(activity < activities.length){
			activity++
		} else{
			activity = 0;
		}
		client.user.setActivity(activities[activity][0],{type: activities[activity][1]});
	},1000*60*5);
	setInterval(function(){
		getMeme()
			.then(meme => {
				memery.send(meme.text,{
					files: [
						meme.image
					]
				});
			})
			.catch(console.log);
	},1000*60);
});

client.on("guildMemberAdd",member => {
	DBupdate();
	let channel = member.guild.channels.find("name","general");
	if(!channel) return;
	channel.send("Welcome to the Toxic Cult, **" + member.user.username + "**. Do " + '"!help"' + " for a list of commands.");
	member.addRole();
});

client.on("guildMemberRemove",member => {
	let channel = member.guild.channels.find("name","general");
	if(!channel) return;
	channel.send("Bye, **" + member.user.username + "**. We will miss you :sob:.");
});

client.on("message",msg => {
	if(msg.content.charAt(0) == prefix){
		if(msg.author.bot) return;

		let cmdarray = msg.content.split(" ");
		let cmd = cmdarray[0].toLowerCase();
		let args = cmdarray.slice(1);

		try{
			if(cmd == prefix + "say"){
				if(isAdmin(msg.member)){
					msg.channel.send(args.join(" "));
					msg.delete();
				}
			} else if(cmd == prefix + "kick"){
				if(isAdmin(msg.member)){
					let member = msg.mentions.members.first();
					if(member){
						if(member.kickable){
							member.kick();
						}
					}
				}
			} else if(cmd == prefix + "ban"){
				if(isAdmin(msg.member)){
					let member = msg.mentions.members.first();
					if(member){
						if(member.bannable){
							member.ban();
						}
					}
				}
			} else if(cmd == prefix + "help"){
				let adminhelp = {
					title: "Commands:",
					fields: [
						{
							name: "!say <message>",
							value: "Says something with the bot"
						},
						{
							name: "!kick <user>",
							value: "Kicks user from the server"
						},
						{
							name: "!ban <user>",
							value: "Bans user from the server"
						},
						{
							name: "!help <page>",
							value: "You know what !help does"
						},
						{
							name: "!music (play|pause|stop|queue|loopqueue|skip) <youtube url>",
							value: "Plays music in your current voice channel"
						},
						{
							name: "!tc",
							value: "Shows how many toxic coins you have"
						},
						{
							name: "!givecoins <user> <amount>",
							value: "Gives a user toxic coins"
						},
						{
							name: "!takecoins <user> <amount>",
							value: "Gives a user toxic coins"
						},
						{
							name: "!shop",
							value: "DM's you a list of buyable items"
						},
						{
							name: "!buy <itemname>",
							value: "Buys am item from the shop"
						},
						{
							name: "!version",
							value: "Shows bot version"
						}
					],
					footer: {
						text: "page 1/1"
					}
				}
				let normalhelp = {
					title: "Commands:",
					fields: [
						{
							name: "!music (play|pause|stop|queue|loopqueue|skip) <youtube url>",
							value: "Plays music in your current voice channel"
						},
						{
							name: "!tc",
							value: "Shows how many toxic coins you have"
						},
						{
							name: "!shop",
							value: "DM's you a list of buyable items"
						},
						{
							name: "!buy <itemname>",
							value: "Buys am item from the shop"
						},
						{
							name: "!version",
							value: "Shows bot version"
						}
					],
					footer: {
						text: "page 1/1"
					}
				}

				if(isAdmin(msg.member)){
					msg.channel.send({embed: adminhelp});
				} else{
					msg.channel.send({embed: normalhelp});
				}
			} else if(cmd == prefix + "tc"){
				DBupdate();
				msg.channel.send("You have `" + getTc(msg.member) + "` Toxic Coins");
			} else if(cmd == prefix + "shop"){
				let shop = new Shop("tc");
				msg.author.send({embed: shop.embed()});
				msg.channel.send("DM'd you a list of buyable items");
			} else if(cmd == prefix + "buy"){
				let item = parseInt(args[0]);
				let shop = new Shop();
				let bought = shop.buy(msg.member,item);
				if(typeof bought == "string"){
					msg.channel.send(bought);
				} else{
					msg.channel.send("Bought " + bought.name + " for " + bought.price + " " + bought.pricetype + ".");
				}
			} else if(cmd == prefix + "music"){
				let channel;
				if(args[0] == "play"){
					if(msg.member.voiceChannel){
						msg.member.voiceChannel.join()
							.then(con => {
								channel = msg.member.voiceChannel;
								if(!currentdispatcher){
									if(!args[1]){
										msg.channel.send("Please provide a YouTube link");
									} else{
										msg.channel.send("Successfully connected!");
										let streamOptions = {seek: 0, volume: 1};
										queue.push({song: args[1],requestedby: msg.author.username});
										for(let i = 0; i < queue.length; i++){
											playing = true;
											console.log(queue.length);
											let stream = ytdl(queue[i].song,streamOptions);
											currentdispatcher = con.playStream(stream,streamOptions);
											msg.channel.send("Playing " + queue[i].song + " (requested by " + queue[i].requestedby + ")");
											currentdispatcher.on("end",r => {
												console.log(queue.length);
												if(i == queue.length){
													if(!loopqueue){
														channel.leave();
														playing = false;
													} else{
														i = 0;
													}
												}
												currentdispatcher = undefined;
											});
											console.log(queue.length);
										}
									}
								} else{
									if(!args[1]){
										currentdispatcher.resume();
										msg.channel.send("Resuming...");
									} else{
										queue.push({song: args[1],requestedby: msg.author.username});
										msg.channel.send("Added " + args[1] + "to queue");
									}
								}
							})
							.catch(console.log);
					} else{
						msg.channel.send("You must be in a voice channel to use this command");
					}
				} else if(args[0] == "pause"){
					if(currentdispatcher){
						if(playing){
							currentdispatcher.pause();
							msg.channel.send("Paused song!");
						} else{
							msg.channel.send("Music already paused...");
						}
					} else{
						msg.channel.send("No music playing...");
					}
				} else if(args[0] == "stop"){
					if(currentdispatcher){
						currentdispatcher.end();
						channel.leave();
						msg.channel.send("Stopped playing!");
						queue = [];
					}
				} else if(args[0] == "queue"){
					let page;
					if(!args[1]){
						page = 1;
					} else{
						page = parseInt(args[1]);
					}
					if(queue){
						let embed = {};
						embed.title = "Queue";
						embed.fields = [];
						let startpos = page * 5;
						if(queue > startpos){
							for(let i = startpos - 1; i < startpos + 5; i++){
								let queueitem = queue[i];
								let field = {
									name: queueitem.song,
									value: "Requested by: " + queueitem.requestedby
								}
								embed.field.push(field);
							}
							msg.channel.send({embed: embed});
						} else{
							msg.channel.send("Invalid queue page");
						}
					}
				} else if(args[0] == "loopqueue"){
					if(loopqueue == true){
						loopqueue = false;
						msg.channel.send("Queue loop disabled");
					} else{
						loopqueue = true;
						msg.channel.send("Queue loop enabled");
					}
				}
			} else if(cmd == prefix + "addcoins"){
				if(isAdmin(msg.member)){
					giveTc(msg.mentions.members.first(),parseInt(args[1]));
				}
			} else if(cmd == prefix + "takecoins"){
				if(isAdmin(msg.member)){
					takeTc(msg.mentions.members.first(),parseInt(args[1]));
				}
			} else if(cmd == prefix + "kill"){
				msg.channel.send("Offline!");
				process.kill(process.pid);
			} else if(cmd == prefix + "activity"){
				if(isAdmin(msg.member)){
					let json = JSON.parse(args.join(" "));
					client.user.setActivity(json.content,{type: json.type});
					msg.channel.send("Set play status as: " + json.content);
				}
			} else if(cmd == prefix + "execute"){
				eval(args.join(" "));
			} else if(cmd == prefix + "version"){
				msg.channel.send("v0.9.6 Beta (WIP)");
			} else if(cmd == prefix + "ping"){
				msg.channel.send("Pong!")
					.then(pong => {
						let pingtime = pong.createdTimestamp - msg.createdTimestamp;
						pong.edit("Pong! `" + pingtime + "ms`");
					})
					.catch(console.log);
			} else if(cmd == prefix + "meme"){
				getMeme()
					.then(meme => {
						msg.channel.send(meme.text,{
							files: [
								meme.image
							]
						});
					})
					.catch(console.log);
			} else{
				msg.channel.send("Error: unknown command");
			}
		} catch(e){
			console.log("Error occured! ",e);
		}
	}
});

rl.on("line",(input) => {
	let sys = new System();
	let output = sys.exec(input);
	console.log(output);
});

//Express routes
app.use(express.static(__dirname + "/client"));

app.get("/",(req,res) => {
	res.sendFile(path.join(__dirname + "/client/index.html"));
});

app.post("/activity",(req,res) => {
	client.user.setActivity(req.body.game,{type: req.body.type});
	res.send("Successfully set activity to " + req.body.type + " " + req.body.game + ".");
});

app.listen(process.env.PORT || 3000);

//Login
client.login(token);