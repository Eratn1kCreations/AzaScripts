class ssImage{

    images = [];
	runs = [];
	processedCount = 0;

    constructor(){
		this.worker = document.getElementById("worker");
		this.preview = document.getElementById("preview");
		this.cpr = this.preview.getContext("2d");
		this.cpr.translate(.5, .5);
		this.tess = document.createElement("canvas");
		this.cte = this.tess.getContext("2d");
		this.cte.translate(.5, .5);
		this.chara = document.createElement("canvas");
		this.chr = this.chara.getContext("2d");
		this.chr.translate(.5, .5);
		this.bossc = document.createElement("canvas");
		this.cbo = this.bossc.getContext("2d");
		this.cbo.translate(.5, .5);
		this.charaR = document.createElement("canvas");
		this.chrR = this.charaR.getContext("2d");
		this.chrR.translate(.5, .5);
		this.progress = document.getElementById("progress");
		this.progressBar = document.getElementById("pb");
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
			this.progressBar.setAttribute("max", this.images.length * 5);
            this.processImages();
        }
    }

	processImages(imageNo = 0){
		if(imageNo < this.images.length){
			this.displayImage(this.images[imageNo].image);
			this.detectBattleLogRecords(this.images[imageNo]);
			this.markArea(this.images[imageNo]);
			this.ocrImage(this.images[imageNo], imageNo);
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

	canvasRescale(){
		let newImg = document.getElementById("pImg");
		if(newImg != null | undefined){
			let sw = newImg.offsetWidth / this.images[0].width,
			sh = newImg.offsetHeight / this.images[0].height;
			this.preview.setAttribute("style", `transform:scale(${sw},${sh})`);
		}
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

		img.areas = [], img.runsText = [], img.runsChars = [], img.runsFins = [], img.areaGen = {left:0,width:0,spacing:0,w:img.range.w,h:img.range.h};
		for(let i = 0; i < 5; i++){
			img.areas.push({x: img.range.x.a, y: img.range.y.a + (i-2) * img.range.h, top: 0});
		}
	}

	markArea(img) {
		for(let i = 0; i < 5; i++){
			this.cpr.fillStyle = i % 2 ? "rgba(255,0,0,.25)" : "rgba(0,255,0,.25)";
			this.cpr.fillRect(img.areas[i].x, img.areas[i].y, img.areaGen.w, img.areaGen.h);
		}
	}

	ocrImage(img, imageNo, attempt = 0){
		if(attempt<5){
			this.ocrText(img,attempt).then((r1)=>{
				this.processedCount += 0.5;
				this.progressBar.setAttribute("value", this.processedCount);
				// this.ocrHeroes(img,attempt).then((r2)=>{
				// 	this.processedCount += 0.3;
				// 	this.progressBar.setAttribute("value", this.processedCount);
					this.ocrBosses(img,attempt).then((r3)=>{
						this.processedCount += 0.5;
						this.progressBar.setAttribute("value", this.processedCount);
						this.progress.setAttribute("desc2", `${imageNo + 1}.${attempt + 1} / ${this.images.length} `);
						this.ocrImage(img, imageNo, attempt + 1);
					})
				// })
			})
		} else {
			for(let i = 4; i >= 0; i--){
				let run = {...img.runsText[i]};
				run.fin = img.runsFins[i]; 
				run.char = img.runsChars[i]; 
				this.runs.push(run);
			}
			console.log(this.runs);
			this.processImages(imageNo + 1);
		}
	}

	ocrHeroes(img, attempt){
		return new Promise((resolve, reject) =>
			{
				let genData = img.areaGen, areaData = img.areas[attempt];
				this.chara.width = 400, this.chara.height = genData.h * .65;
				this.chr.drawImage(img.image, areaData.x, areaData.y + genData.h * .35, 400, this.chara.height, 0, 0, 400, this.chara.height);

				// detect left in the first one
				if(!attempt){ 
					this.charaR.width = 150; this.charaR.height = 18;
					this.chrR.drawImage(this.chara, 0, 8, this.charaR.width, this.charaR.height, 0, 0, this.charaR.width, this.charaR.height);
					this.chrR.fillStyle = `black`;
					this.chrR.fillFlood(4, 4, 49);

					let dataV = this.chrR.getImageData(0,0,this.charaR.width,this.charaR.height).data, step = 0;
					for(let x = 5; x < this.charaR.width; x++){
						let colorSum = 0;
						for(let y = this.charaR.height-1; y > this.charaR.height / 2 ; y--){
							let pixelPos = 4 * (x + y * this.charaR.width);
							colorSum += dataV[pixelPos] + dataV[pixelPos + 1] + dataV[pixelPos + 2];
						}

						if(step == 0 && colorSum >= 500){
							img.areaGen.left = x;
							step++;
							x += 5;
						} else if(step == 1 && colorSum < 100){
							img.areaGen.width = x - img.areaGen.left;
							step++;
							x += 5;
						} else if(step == 2 && colorSum >= 500){
							img.areaGen.spacing = x - img.areaGen.left - img.areaGen.width;
							break;
						}
					}
				}

				// detect top
				let dataH = this.chr.getImageData(60, 0, 1, this.chara.height / 4).data;
				for(let y = 5; y < this.chara.height / 4; y++) { if (80 > dataH[4 * y] + dataH[4 * y + 1] + dataH[4 * y + 2]){ img.areas[attempt].top = y; break; } }

				// heroes detection
				let charArr = [];
				for(let x = 0; x < 4; x++) {
					let areaSize = img.areaGen.width, areaOffset = 4;
					this.charaR.width = this.charaR.height = 48;
					this.chrR.drawImage(this.chara, img.areaGen.left + (areaSize + img.areaGen.spacing) * x + areaOffset, img.areas[attempt].top + areaOffset, areaSize - areaOffset*2, areaSize - areaOffset*2, 0, 0, 48, 48);
					this.cpr.clearRect(img.areaGen.left + (areaSize + img.areaGen.spacing) * x + areaData.x, areaData.y + genData.h * .35 + img.areas[attempt].top, areaSize, areaSize);
						
					let charName = character.search(this.charaR);
					charArr.push(charName);
					//console.log((attempt+1) + "." + (x+1), charName);
				}
				img.runsChars.push(charArr);
				resolve("ocrHeroes done");
			}
		);
	}

	ocrBosses(img, attempt){
		return new Promise((resolve, reject) =>
		{
			this.ocrBosses2(img, attempt);
			resolve("ocrBosses done");
			// let genData = img.areaGen, areaData = img.areas[attempt], b = new Image;
			// this.bossc.width = 100, this.bossc.height = genData.h * .65;
			// this.cbo.drawImage(img.image, areaData.x + genData.w - this.bossc.width * 2, areaData.y + genData.h * .35, this.bossc.width, this.bossc.height, 0, 0, this.bossc.width, this.bossc.height);
			// this.cpr.clearRect(areaData.x + genData.w - this.bossc.width * 2, areaData.y + genData.h * .35, this.bossc.width, this.bossc.height);
			// this.toGrayAndContrast(75, this.cbo, this.bossc);
			// b.src = this.bossc.toDataURL(), b.onload = () => {
			// 	Tesseract.recognize(b, "eng").then(({
			// 		data: { text: r }
			// 	}) => {
			// 		//console.log(r)
			// 		img.runsFins.push(r == "X\n" | "x\n"? 1 : 0);
			// 		this.cpr.clearRect(areaData.x, areaData.y, genData.w, genData.h);
			// 		resolve("ocrBosses done");
			// 	}).catch( e => {
			// 		reject(Error(e))
			// 	})
			// }
		});
	}

	ocrBosses2(img, attempt){
		let genData = img.areaGen, areaData = img.areas[attempt],
			close = 0, col = this.rgb2hsv(49,85,107);

		this.bossc.width = 1, this.bossc.height = genData.h * .65 - 20;
		this.cbo.drawImage(img.image, areaData.x + genData.w - 10, areaData.y + genData.h * .35 + 10, 5, this.bossc.height, 0, 0, 5, this.bossc.height);
		
		let dataH = this.cbo.getImageData(0, 0, 1, this.bossc.height).data;
		for(let x = 0; x < this.bossc.height; x++)
			if( this.hsvDist(col,this.rgb2hsv(dataH[4*x],dataH[4*x+1],dataH[4*x+2])) < 0.1 )
				close++;
		
		img.runsFins.push( close > 10 ? 0 : 1 );
		this.cpr.clearRect(areaData.x, areaData.y, genData.w, genData.h);
	}

	rgb2hsv(r,g,b) {
		let v=Math.max(r,g,b), c=v-Math.min(r,g,b);
		let h= c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); 
		return [60*(h<0?h+6:h), v&&c/v, v];
	}

	hsvDist(a,b) {
		let dh = Math.min(Math.abs(b[0]-a[0]), 360-Math.abs(b[0]-a[0])) / 180.0,
			ds = Math.abs(b[1]-a[1]),
			dv = Math.abs(b[2]-a[2]) / 255.0;
		return Math.sqrt(dh*dh+ds*ds+dv*dv);
	}

	ocrText(img, attempt){
		return new Promise((resolve, reject) =>
			{
				let genData = img.areaGen, areaData = img.areas[attempt], c = new Image;
				this.tess.width = img.range.w, this.tess.height = img.range.h, this.cte.fillStyle = "black";
				this.cte.drawImage(img.image, areaData.x, areaData.y, genData.w, genData.h, 0, 0, genData.w, genData.h);
				this.cte.fillRect(0,  genData.h * .35, 400, genData.h * .65);
				this.cte.fillRect( genData.w - 400,  genData.h * .35, 400,  genData.h * .65);
				
				this.toGrayAndContrast(5);

				c.src = this.tess.toDataURL(), c.onload = () => {
					Tesseract.recognize(c, "eng").then(({
						data: { text: r }
					}) => {
						let c = { name: "", lv: "", boss: "", dmg: 0, fin: 0, char:[]};
						r.split("\n").forEach(a => {
							let b = a.split(" ");
							if(b.length > 2){
								let i = 0;
								b.forEach(s => {
									if( i == 0){
										c.name = s in fixTable ? fixTable[s] : s, i++;
									} else if( i == 1 && s.includes("Lv.")){
										c.lv = s.split(".")[1],i++;
									} else if( i == 2){
										c.boss = s, i++;
									} else if( i == 3){
										c.boss += " " + s;
									}
								})
							} else if(b.length > 1){
								c.dmg = b[0].replace(/[^0-9]/g, '');
								img.runsText.push({...c});
							}
						});
						resolve("ocrText done");
					}).catch( e => {
						reject(Error(e))
					})
				}
			}
		);
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
		a.forEach(a => {
			b += `${a.name}\t${a.dmg}\t${a.boss}\t${a.lv}\t${a.fin}\n`// + "\t" + a.char[0] + "\t" + a.char[1] + "\t" + a.char[2] + "\t" + a.char[3] + "\n"
		});
		document.getElementById("removeinfo").setAttribute("desc2","Removed " + (this.runs.length - a.length) + " duplicates");
		document.getElementById("progress").setAttribute("desc2", `Done`);
		document.getElementById("output").innerHTML = b;
	}
}

const reader = new FileReader(), ssImg = new ssImage();//, character = new Characters();

document.querySelector("input").addEventListener("drop", a => {
	a.preventDefault(), ssImg.loadToBuffer(a.dataTransfer.files);
});
window.addEventListener('resize', function(event) {
	ssImg.canvasRescale()
}, true);

function processClick(){ ssImg.loadToBuffer(document.querySelector("input").files); }