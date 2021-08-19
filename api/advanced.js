class ssImage{

    images = [];
	runs = [];
	processedCount = 0;

    constructor(){
		this.worker = document.getElementById("worker");
		this.preview = document.getElementById("preview");
		this.cpr = this.preview.getContext("2d");
		this.tess = document.getElementById("tesseract");
		this.cte = this.tess.getContext("2d");
		this.chara = document.getElementById("characters");
		this.chr = this.chara.getContext("2d");
		this.bossc = document.getElementById("bosse");
		this.cbo = this.bossc.getContext("2d");
	}

    loadToBuffer(filesQueue, fileNo = 0){
        if(fileNo == 0) this.images = [], this.runs = [], this.processedCount = 0;
        if(fileNo < filesQueue.length){
            reader.readAsDataURL(filesQueue[fileNo]), reader.onload = () => {
                var b = new Image;
                b.src = reader.result, b.setAttribute("id","pImg"), b.onload = () => {
                    var layer = {image:b,width:b.width,height:b.height},
                		can = document.createElement("canvas"),
                    	c = can.getContext("2d");
					can.width = b.width, can.height = b.height;
					c.translate(.5, .5), c.drawImage(b,0,0);
                    layer.canvas = can;
                    this.images.push(layer);
                    this.loadToBuffer(filesQueue, fileNo + 1);
                }
            }
        } else {
			document.getElementById("pb").setAttribute("max", this.images.length * 5);
            this.processImages();
        }
    }

	processImages(imageNo = 0){
		if(imageNo < this.images.length){
			this.displayImage(this.images[imageNo].image);
			this.detectBattleLogRecords(this.images[imageNo]);
			this.markArea(this.images[imageNo]);
			this.ocrAttempt(this.images[imageNo],imageNo);
		} else {
			this.printOutput();
		}
	}

	displayImage(image){
		document.querySelectorAll('[id^="pImg"]').forEach(function (e) { e.remove() });
		this.worker.insertBefore(image.cloneNode(false),this.preview);
		let newImg = document.getElementById("pImg"),
			w = image.width,
			h = image.height,
			sw = newImg.offsetWidth / w,
			sh = newImg.offsetHeight / h;
		this.preview.width = w, this.preview.height = h, this.preview.setAttribute("style", `transform:scale(${sw},${sh})`);
		this.cpr.clearRect(0, 0, w, h);
	}

	detectBattleLogRecords(img) {
		let c = img.canvas.getContext("2d"),
			midW = Math.floor(img.width / 2),
			midH = Math.floor(img.height / 2),
			dataV = c.getImageData(midW, 0, 1, img.height).data;

		img.range = {x:{a:0,b:0},y:{a:0,b:0},w:0,h:0};
		for(let y = midH; y < img.height; y++) {
			if(0 == img.range.y.a) {
				let yt = img.height - y;
				if (80 > dataV[4 * yt] + dataV[4 * yt + 1] + dataV[4 * yt + 2]) img.range.y.a = yt-5;
			}
			if(0 == img.range.y.b) {
				if (80 > dataV[4 * y] + dataV[4 * y + 1] + dataV[4 * y + 2]) img.range.y.b = y;
			}
			if(0 < img.range.y.a && 0 < img.range.y.b) break;
		}

		let dataH = c.getImageData(0, (midH + img.range.y.a)/2, img.width, 1).data;
		for(let x = midW; x < img.width; x++) {
			if(0 == img.range.x.a) {
				let xt = img.width - x;
				if (80 > dataH[4 * xt] + dataH[4 * xt + 1] + dataH[4 * xt + 2]) img.range.x.a = xt;
			}
			if(0 == img.range.x.b) {
				if (80 > dataH[4 * x] + dataH[4 * x + 1] + dataH[4 * x + 2]) img.range.x.b = x;
			}
			if(0 < img.range.x.a && 0 < img.range.x.b) break;
		}

		img.range.w = img.range.x.b - img.range.x.a;
		img.range.h = img.range.y.b - img.range.y.a;

		img.areas = [], img.runs= [];
		for(let i = 0; i < 5; i++){
			img.areas.push({x: img.range.x.a, y: img.range.y.a + (i-2) * img.range.h, w: img.range.w, h: img.range.h, squad:{left:0,bottom:0,width:0}});
		}
	}

	markArea(img) {
		for(let i = 0; i < 5; i++){
			this.cpr.fillStyle = i % 2 ? "rgba(255,0,0,.25)" : "rgba(0,255,0,.25)";
			this.cpr.fillRect(img.areas[i].x, img.areas[i].y, img.areas[i].w, img.areas[i].h);
		}
	}

	ocrAttempt(img,imageNo,attempt=0){
		if(attempt < 5){
			this.processedCount++;
			document.getElementById("pb").setAttribute("value", this.processedCount);
			document.getElementById("progress").setAttribute("desc2", `${Math.floor(this.processedCount/5)}.${this.processedCount%5}/${this.images.length}`);
			let areaData = img.areas[attempt];
			
			// finisherRec
			this.bossc.width = 100, this.bossc.height = areaData.h * .65;
			this.cbo.drawImage(img.image, areaData.x + areaData.w - this.bossc.width * 2, areaData.y + areaData.h * .35, this.bossc.width, this.bossc.height, 0, 0, this.bossc.width, this.bossc.height);
			this.toGrayAndContrast(75, this.cbo, this.bossc);

			// ocr text
			this.tess.width = img.range.w, this.tess.height = img.range.h + areaData.h * .65;
			this.cte.drawImage(img.image, areaData.x, areaData.y, areaData.w, areaData.h, 0, 0, areaData.w, areaData.h);
			this.cte.fillStyle = "black";
			this.cte.fillRect(0,  areaData.h * .35, 400, .65 *  areaData.h);
			this.cte.fillRect( areaData.w - 400,  areaData.h * .35, 400, .65 *  areaData.h);
			this.toGrayAndContrast(5);			
			
			// charRec
			this.chara.width = 400, this.chara.height = areaData.h * .65;
			this.chr.drawImage(img.image, areaData.x, areaData.y + areaData.h * .35, 400, this.chara.height, 0, 0, 400, this.chara.height);
			
			let dataH = this.chr.getImageData(50, 0, 1, this.chara.height).data;
			for(let y = this.chara.height - 10 ; y > 0; y--) { if (80 > dataH[4 * y] + dataH[4 * y + 1] + dataH[4 * y + 2]){ img.areas[attempt].squad.bottom = y; break; } }

			let dataV = this.chr.getImageData(0, img.areas[attempt].squad.bottom - 10, this.chara.width, 1).data, x2 = 0;
			this.chr.fillStyle = "red";
			let color = 0, colorCheck = 0, currentColor = 0;
			for(let x = 8; x < this.chara.width-3; x++) {
				if(color==0){
					color = dataV[4 * x] + dataV[4 * x + 1] + dataV[4 * x + 2];
					colorCheck = 3;
				} else {
					let xi = (colorCheck >= 3 ? x : x + 3);
					currentColor = dataV[4 * xi] + dataV[4 * xi + 1] + dataV[4 * xi + 2];
					if(currentColor > color - 5 && currentColor < color + 5 ){
						colorCheck++;
						if(colorCheck >= 3 && img.areas[attempt].squad.left > 0 && img.areas[attempt].squad.width == 0){
							img.areas[attempt].squad.width = x - img.areas[attempt].squad.left;
						}
					} else {
						colorCheck = 0;
						if(img.areas[attempt].squad.left == 0){
							img.areas[attempt].squad.left = x;
						} else if(img.areas[attempt].squad.width > 0){
							img.areas[attempt].squad.spacing = x - img.areas[attempt].squad.left - img.areas[attempt].squad.width;
							break;
						}
					}
				}
			}

			if(img.areas[attempt].squad.width < 50 && attempt > 0){
				img.areas[attempt].squad.width = img.areas[attempt-1].squad.width;
				img.areas[attempt].squad.spacing = img.areas[attempt-1].squad.spacing;
			}
					
			let save = false, charsArr = [];
			for(let x = 0; x < 4; x++) {
				let pColor = [],
					pColorC = {r:0,g:0,b:0},
					dataC = this.chr.getImageData(img.areas[attempt].squad.left + (img.areas[attempt].squad.width + img.areas[attempt].squad.spacing) * x, img.areas[attempt].squad.bottom - img.areas[attempt].squad.width, img.areas[attempt].squad.width, img.areas[attempt].squad.width).data;
				
				this.cpr.clearRect(img.areas[attempt].squad.left + (img.areas[attempt].squad.width + img.areas[attempt].squad.spacing) * x + areaData.x, areaData.y + areaData.h * .35 + img.areas[attempt].squad.bottom - img.areas[attempt].squad.width, img.areas[attempt].squad.width, img.areas[attempt].squad.width);

				for(let i = 0; i < img.areas[attempt].squad.width; i += charTable.probeStep){
					let pos = i % 2 ? 4 * (i + img.areas[attempt].squad.width * i) : 4 * (i + 1) * (img.areas[attempt].squad.width - 1);
					pColorC.r += dataC[pos];
					pColorC.g += dataC[pos + 1];
					pColorC.b += dataC[pos + 2];
					pColor.push(dataC[pos] + dataC[pos + 1] + dataC[pos + 2]);
				}

				if(!save){
					let similarity = 0, character = "", treshholds = [100,300,500,700,900,1100], possibleCharacters = [];
					for(let th in treshholds){
						for (const key in charTable.aza) {
							if(Math.abs(charTable.aza[key].r - pColorC.r) < treshholds[th] && Math.abs(charTable.aza[key].g - pColorC.g) < treshholds[th] && Math.abs(charTable.aza[key].b - pColorC.b) < treshholds[th]){
								possibleCharacters.push(key);
								//console.log(key + " | r " + Math.abs(charTable.aza[key].r - pColorC.r)+ " | g " + Math.abs(charTable.aza[key].g - pColorC.g)+ " | b " + Math.abs(charTable.aza[key].b - pColorC.b));
							}
						}
						if (possibleCharacters.length > 0) break;
					}
					

					switch(possibleCharacters.length){
						case 0: break;
						case 1: character = possibleCharacters[0]; break;
						default:
							possibleCharacters.forEach(key=>{
								similarity = pColor.length;
								charTable.aza[key].p.forEach((v,i)=>{
									if(character != "") return;
									if(Math.abs(pColor[i] - v) > 120){
										similarity--;
										if(similarity < pColor.length * 0.8) return;
									}
									if( i > pColor.length * 0.9 && similarity > pColor.length * 0.8) character = key;
								});
								if(character != "") return;
							});
					}
					charsArr.push(character);
					//console.log(attempt + "." + x + " | " + character);
				} else {
					pColorC.p = pColor;
					console.log(attempt + "." + x);
					console.log(pColorC);
				}
			}
			
			// textRec
			if(!save){
				var c = new Image;
				c.src = this.bossc.toDataURL(), c.onload = () => {
					Tesseract.recognize(c, "eng").then(({
						data: { text: b }
					}) => {
						c.src = this.tess.toDataURL(), c.onload = () => {
							Tesseract.recognize(c, "eng").then(({
								data: { text: a }
							}) => {
								this.textOperations(a,b,img,charsArr);
								this.ocrAttempt(img,imageNo,attempt + 1);
							})
						}
					})
				}
			} else {
				this.ocrAttempt(img,imageNo,attempt + 1);
			}
		} else {
			for(let c = img.runs.length - 1; 0 <= c; c--) this.runs.push(img.runs[c]);
			this.processImages(imageNo + 1);
		}
	}

	textOperations(a,s,img,chars) {
		//console.log(a);
		let c = {
				name: "",
				lv: "",
				boss: "",
				dmg: "",
				fin: s == "X\n" | "x\n"? 1 : 0,
				char: chars
			};
		a.split("\n").forEach(a => {
			let b = a.split(" ");
			if(2 < b.length) {
				let a = 0;
				b.forEach(b => {
					0 == a ? (a++, c.name = b in fixTable ? fixTable[b] : b) : 1 === a ? b.includes("Lv.") && (a++, c.lv = b.split(".")[1]) : 2 === a ? (a++, c.boss = b) : 3 === a ? c.boss += " " + b : void 0
				})
			} else 1 < b.length && (c.dmg = b[0].replaceAll(",", "").replaceAll("`", "").replaceAll("’", ""), img.runs.push({...c}))
		});
	}

	toGrayAndContrast(a = 1, can = this.cte, canvas = this.tess) {
		let b = can.getImageData(0, 0, canvas.width, canvas.height),
			c = b.data;
		for(var d, e = 0; e < c.length; e += 4) d = (c[e] + c[e + 1] + c[e + 2]) / 3, c[e] = c[e + 1] = c[e + 2] = 255 - 255 * ((d / 255 - .5) * a + .5);
		can.putImageData(b, 0, 0)
	}

	printOutput() {
		let a = this.runs.reduce((a, b) => a.some(a => JSON.stringify(b) === JSON.stringify(a)) ? a : [...a, b], []),
			b = "";
		//console.log(a);
		a.forEach(a => {
			b += a.name + "\t" + a.dmg + "\t" + a.boss + "\t" + a.lv + "\t" + a.fin + "\t" + a.char[0] + "\t" + a.char[1] + "\t" + a.char[2] + "\t" + a.char[3] + "\n"
		});
		document.getElementById("removeinfo").setAttribute("desc2","Removed " + (this.runs.length - a.length) + " duplicates");
		document.getElementById("progress").setAttribute("desc2", ``);
		document.getElementById("output").innerHTML = b;
		}
}

const reader = new FileReader, ssImg = new ssImage;

document.querySelector("input").addEventListener("drop", a => {
	a.preventDefault(), ssImg.loadToBuffer(a.dataTransfer.files);
});

function processClick(){ ssImg.loadToBuffer(document.querySelector("input").files); }

/*

const conB = document.getElementById("baseImage"),
	conL = document.getElementById("drawLayer"),
	conT = document.getElementById("tesseractLayer"),
	cB = conB.getContext("2d"),
	cL = conL.getContext("2d"),
	cT = conT.getContext("2d");
cB.translate(.5, .5), cL.translate(.5, .5), cT.translate(.5, .5);
const reader = new FileReader;
var filesQueue = [],
	attemptsList = [];
document.querySelector("input").addEventListener("drop", a => {
	a.preventDefault(), filesQueue = a.dataTransfer.files, afterClick()
});

  	function processClick(){
    	filesQueue = document.querySelector("input").files, afterClick()
  	}

function afterClick(){
    	attemptsList = [], document.getElementById("removeinfo").innerHTML = "", document.getElementById("output").innerHTML = "", document.getElementById("pb").setAttribute("value", 0), document.getElementById("pb").setAttribute("max", filesQueue.length), document.getElementById("progress").setAttribute("desc2", `0/${filesQueue.length}`), processFiles(0)
  	}

function processFiles(a) {
	reader.readAsDataURL(filesQueue[a]), reader.onload = () => {
		var b = new Image;
		b.src = reader.result, b.onload = () => {
			conB.width = conL.width = b.width, conB.height = conL.height = b.height;
			var c = b.width,
				d = b.height,
				wh = (window.innerHeight > 0) ? window.innerHeight : screen.height,
				ww = (window.innerWidth > 0) ? window.innerWidth : screen.width,
				sh = d > wh*.4 ? wh*.4/d : d,
				sw = c*sh > ww? ww/c : sh,
				sh = c*sh > ww? sw : sh,
				hm = ((wh*.4 - d*sh)/(wh*.4))*50;
			cB.drawImage(b, 0, 0), cL.clearRect(0, 0, b.width, b.height), detectBattleLogArea(c, d, a + 1), document.querySelectorAll("canvas").forEach(e => e.setAttribute("style", `transform:scale(${sw},${sh}) translate(-50%, ${hm}%)`))
        }
	}
}

function detectBattleLogArea(a, b, c) {
	let d = Math.floor(b / 2),
		e = Math.floor(a / 2),
		f = [0, 0];
	var g = cB.getImageData(0, d, a, 1).data;
	for(let d = e; d < a; d++) {
		if(0 == f[0]) {
			let a = e - d % e;
			80 > g[4 * a] + g[4 * a + 1] + g[4 * a + 2] && (f[0] = a)
		}
		if(0 == f[1] && 80 > g[4 * d] + g[4 * d + 1] + g[4 * d + 2] && (f[1] = d), 0 < f[0] && 0 < f[1]) break
	}
	let h = [0, 0];
	g = cB.getImageData(e, 0, 1, b).data;
	for(let e = d; e < b; e++) {
		if(0 == h[0]) {
			let a = d - e % d;
			80 > g[4 * a] + g[4 * a + 1] + g[4 * a + 2] && (h[0] = a)
		}
		if(0 == h[1] && 80 > g[4 * e] + g[4 * e + 1] + g[4 * e + 2] && (h[1] = e), 0 < h[0] && 0 < h[1]) break
	}
	let i = {
		x: f[0],
		y: h[0] - 2,
		w: f[1] - f[0],
		h: h[1] - h[0] + 4
	};
	ocrData(i, c)
}

function ocrData(a, b) {
	conT.width = a.w, conT.height = 5 * a.h, cT.drawImage(conB, a.x, a.y - 2 * a.h, a.w, 5 * a.h, 0, 0, a.w, 5 * a.h), cT.fillStyle = "black";
	for(let c = 0; 5 > c; c++) markArea(a, c), cT.fillRect(0, a.h * (c + .35), 400, .65 * a.h), cT.fillRect(a.w - 400, a.h * (c + .35), 400, .65 * a.h);
	toGrayAndContrast(5);
	var c = new Image;
	c.src = conT.toDataURL(), c.onload = () => {
		Tesseract.recognize(c, "eng",{ logger: m => console.log(m) }).then(({
			data: {
				text: a
			}
		}) => {
			textOperations(a, b)
		})
	}
}

function toGrayAndContrast(a = 1) {
	let b = cT.getImageData(0, 0, conT.width, conT.height),
		c = b.data;
	for(var d, e = 0; e < c.length; e += 4) d = (c[e] + c[e + 1] + c[e + 2]) / 3, c[e] = c[e + 1] = c[e + 2] = 255 - 255 * ((d / 255 - .5) * a + .5);
	cT.putImageData(b, 0, 0)
}

function markArea(a, b) {
	cL.fillStyle = b % 2 ? "rgba(255,0,0,.25)" : "rgba(0,255,0,.25)", cL.fillRect(a.x, a.y + (b - 2) * a.h, a.w, a.h), cL.fillStyle = "rgba(0,0,0,.55)", cL.fillRect(a.x, a.y + a.h * (b - 2 + .35), 400, .65 * a.h), cL.fillRect(a.x + a.w - 400, a.y + a.h * (b - 2 + .35), 400, .65 * a.h)
}

function textOperations(a, b) {
	let c = {
			name: "",
			lv: "",
			boss: "",
			dmg: ""
		},
		d = [];
	a.split("\n").forEach(a => {
		let b = a.split(" ");
		if(2 < b.length) {
			let a = 0;
			b.forEach(b => {
				0 == a ? (a++, c.name = b in fixTable ? fixTable[b] : b) : 1 === a ? b.includes("Lv.") && (a++, c.lv = b.split(".")[1]) : 2 === a ? (a++, c.boss = b) : 3 === a ? c.boss += " " + b : void 0
			})
		} else 1 < b.length && (c.dmg = b[0].replaceAll(",", ""), d.push({...c
		}), c = {
			name: "",
			lv: "",
			boss: "",
			dmg: ""
		})
	});
	if(d.length < 5) alert(`There was problem with reading the file!\n Filename: ${filesQueue[b-1].name}`);
	for(let c = d.length - 1; 0 <= c; c--) attemptsList.push(d[c]);
	document.getElementById("progress").setAttribute("desc2", `${b}/${filesQueue.length}`), document.getElementById("pb").setAttribute("value", b), b < filesQueue.length ? processFiles(b) : printOutput()
}

function printOutput() {
	let a = attemptsList.reduce((a, b) => a.some(a => JSON.stringify(b) === JSON.stringify(a)) ? a : [...a, b], []),
		b = "";
	a.forEach(a => {
		b += a.name + "\t" + a.dmg + "\t" + a.boss + "\t" + a.lv + "\n"
	}), document.getElementById("removeinfo").setAttribute("desc2","Removed " + (attemptsList.length - a.length) + " duplicates"), document.getElementById("output").innerHTML = b
}*/