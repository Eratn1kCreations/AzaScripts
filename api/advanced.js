class ssImage{

    images = [];
	runs = [];
	processedCount = 0;

    constructor(){
		this.worker = document.getElementById("worker");
		this.preview = document.getElementById("preview");
		this.cpr = this.preview.getContext("2d");
		this.tess = document.createElement("canvas");
		this.cte = this.tess.getContext("2d");
		this.chara = document.createElement("canvas");
		this.chr = this.chara.getContext("2d");
		this.bossc = document.createElement("canvas");
		this.cbo = this.bossc.getContext("2d");
		this.charaR = document.createElement("canvas");
		this.chrR = this.charaR.getContext("2d");
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

		img.areas = [], img.runs = [], img.areaGen = {left:0,width:0,spacing:0,w:img.range.w,h:img.range.h};
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

	ocrAttempt(img,imageNo,attempt=0){
		if(attempt < 5){
			this.processedCount++;
			document.getElementById("pb").setAttribute("value", this.processedCount);
			document.getElementById("progress").setAttribute("desc2", `${Math.floor(this.processedCount/5)}.${this.processedCount%5}/${this.images.length}`);
			let areaData = img.areas[attempt],  genData = img.areaGen;
			
			// finisherRec
			this.bossc.width = 100, this.bossc.height = genData.h * .65;
			this.cbo.drawImage(img.image, areaData.x + genData.w - this.bossc.width * 2, areaData.y + genData.h * .35, this.bossc.width, this.bossc.height, 0, 0, this.bossc.width, this.bossc.height);
			this.toGrayAndContrast(75, this.cbo, this.bossc);

			// ocr text
			this.tess.width = img.range.w, this.tess.height = img.range.h + genData.h * .65;
			this.cte.drawImage(img.image, areaData.x, areaData.y, genData.w, genData.h, 0, 0, genData.w, genData.h);
			this.cte.fillStyle = "black";
			this.cte.fillRect(0,  genData.h * .35, 400, .65 *  genData.h);
			this.cte.fillRect( genData.w - 400,  genData.h * .35, 400, .65 *  genData.h);
			this.toGrayAndContrast(5);			
			
			// charRec
			this.chara.width = 400, this.chara.height = genData.h * .65;
			this.chr.drawImage(img.image, areaData.x, areaData.y + genData.h * .35, 400, this.chara.height, 0, 0, 400, this.chara.height);
			
			let dataH = this.chr.getImageData(50, 0, 1, this.chara.height).data;
			for(let y = 10 ; y < this.chara.height; y++) { if (80 > dataH[4 * y] + dataH[4 * y + 1] + dataH[4 * y + 2]){ img.areas[attempt].top = y; break; } }

			if(attempt == 0){
				let dataV = this.chr.getImageData(0, img.areas[attempt].top + 10, this.chara.width, 1).data;
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
							if(colorCheck >= 3 && img.areaGen.left > 0 && img.areaGen.width == 0){
								img.areaGen.width = x - img.areaGen.left;
							}
						} else {
							colorCheck = 0;
							if(img.areaGen.left == 0){
								img.areaGen.left = x;
							} else if(img.areaGen.width > 0){
								img.areaGen.spacing = x - img.areaGen.left - img.areaGen.width;
								break;
							}
						}
					}
				}
			}			

			let doOcr = true, logs = false, charsArr = [];
			for(let x = 0; x < 4; x++) {
				let areaSize = img.areaGen.width;
				this.charaR.width = this.charaR.height = areaSize - 20;
				this.chrR.drawImage(this.chara, img.areaGen.left + (areaSize + img.areaGen.spacing) * x + 10, img.areas[attempt].top + 10, areaSize - 20, areaSize - 20, 0, 0, areaSize - 20, areaSize - 20);
				this.cpr.clearRect(img.areaGen.left + (areaSize + img.areaGen.spacing) * x + areaData.x, areaData.y + genData.h * .35 + img.areas[attempt].top, areaSize, areaSize);
				
				let charName = character.search(this.charaR);
				charsArr.push(charName);
				if(logs) console.log((attempt+1) + "." + (x+1), charName);
			}

			// textRec
			if(doOcr){
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
		a.forEach(a => {
			b += a.name + "\t" + a.dmg + "\t" + a.boss + "\t" + a.lv + "\t" + a.fin + "\t" + a.char[0] + "\t" + a.char[1] + "\t" + a.char[2] + "\t" + a.char[3] + "\n"
		});
		document.getElementById("removeinfo").setAttribute("desc2","Removed " + (this.runs.length - a.length) + " duplicates");
		document.getElementById("progress").setAttribute("desc2", ``);
		document.getElementById("output").innerHTML = b;
	}
}

const reader = new FileReader(), ssImg = new ssImage();

document.querySelector("input").addEventListener("drop", a => {
	a.preventDefault(), ssImg.loadToBuffer(a.dataTransfer.files);
});

function processClick(){ ssImg.loadToBuffer(document.querySelector("input").files); }