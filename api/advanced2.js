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

		this.numRec = document.createElement("canvas");
		this.numRec.width = 340;
		this.numRec.height = 60;
		this.numr = this.numRec.getContext("2d");
		this.numr.translate(.5, .5);
		
		this.numRecTemp = document.createElement("canvas");
		this.numRecTemp.width = 25;
		this.numRecTemp.height = 35;
		this.numrt = this.numRecTemp.getContext("2d");
		this.numrt.translate(.5, .5);
		
		this.bossc = document.createElement("canvas");
		this.cbo = this.bossc.getContext("2d");
		this.cbo.translate(.5, .5);
		
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
			this.bossKill(img, attempt);
			this.ocrData(img, imageNo, attempt);
		} else {
			for(let i = 4; i >= 0; i--){
				let run = {...img.runsText[i]};
					run.fin = img.runsFins[i];
				this.runs.push(run);
			}
			this.processImages(imageNo + 1);
		}
	}

	bossKill(img, attempt){
		let genData = img.areaGen, areaData = img.areas[attempt],
			close = 0, col = this.rgb2hsv(49,85,107);

		this.bossc.width = 1, this.bossc.height = genData.h * .65 - 20;
		this.cbo.drawImage(img.image, areaData.x + genData.w - 10, areaData.y + genData.h * .35 + 10, 5, this.bossc.height, 0, 0, 5, this.bossc.height);
		
		let dataH = this.cbo.getImageData(0, 0, 1, this.bossc.height).data;
		for(let x = 0; x < this.bossc.height; x++)
			if( this.hsvDist(col, this.rgb2hsv(dataH[4*x],dataH[4*x+1],dataH[4*x+2])) < 0.1 )
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

	ocrData(img, imageNo, attempt){
		let genData = img.areaGen, areaData = img.areas[attempt];
		this.tess.width = img.range.w, this.tess.height = img.range.h, this.cte.fillStyle = "black";
		this.cte.drawImage(img.image, areaData.x, areaData.y, genData.w, genData.h, 0, 0, genData.w, genData.h);
		this.cte.fillRect(0,  genData.h * .35, 400, genData.h * .65);
		this.cte.fillRect( genData.w - 400,  genData.h * .35, 400,  genData.h * .65);
				
		this.toGrayAndContrast(5);
		
		let runData = {}
		// number reading
		this.numr.drawImage(this.tess, 390, 90, 340, 60, 0, 0, 340, 60);
		runData.dmg = this.parseNumber();

		// text reading
		let temp = this.cte.getImageData(0, 0, this.tess.width, 70);
		this.tess.height = 70;
		this.cte.putImageData(temp,0,0);
		this.ocrText(runData).then((r1)=>{
			img.runsText.push(runData);
			this.ocrImage(img, imageNo, attempt + 1);
		});
	}

	parseNumber(){
		let igray = this.numr.getImageData(0, 0, 50, 60).data, yS = 0, yE = 0;
		for(let yi = 0; yi < 60; yi++){
			let isLine = 1;
			for(let xi = 0; xi < 50; xi++){
				if(igray[(yi*50 + xi)*4] == 0){
					if(yS == 0)
						yS = yi;
					isLine = 0;
					break;
				}
			}
			if(yS > 0 && isLine){
				yE = yi - yS;
				break;
			}
		}
		igray = this.numr.getImageData(0, yS, 340, yE).data;

		let xi = 0, xS = 0, sStart = 1, sBreak = 0, number = [];
		while ((sStart || sBreak < 15) && xi < 340){
			let isLine = 1;
			for(let yi = 0; yi < yE; yi++){
				if(igray[(yi*340 + xi)*4] == 0){
					if(xS == 0)
						xS = xi;
					isLine = 0;
					sBreak = -1;
					break;
				}
			}
			
			if(xS > 0 && isLine){
				this.numrt.drawImage(this.numRec, xS, yS, xi-xS, yE, 0, 0, 25, 35);
				number.push(this.recognizeNumber())
				xS = 0;
			}
			sBreak += 1;
			xi += 1;
		}
		return number.join('');
	}

	recognizeNumber(){
		let vecLeft = [], vecRight = [], dvecLeft = [], dvecRight = [], sumLeft = 0, sumRight = 0,
			igray = this.numrt.getImageData(0, 0, 25, 35).data;

		for(let y = 0; y < 31; y++){
			vecLeft.push(-1); vecRight.push(-1);
			for(let x = 0; x < 25; x++){
				if(vecLeft[y] < 0){
					if(igray[((y+2)*25+x)*4] < 128){
						vecLeft[y] = x;
						sumLeft += x;
					}
				}
				if(vecRight[y] < 0){
					if(igray[((y+2)*25 + 24 - x)*4] < 128){
						vecRight[y] = x;
						sumRight += x;
					}
				}
				if(vecLeft[y] > 0 && vecRight[y] > 0)
					break;
			}
			if(y > 0){
				dvecLeft.push(vecLeft[y-1] - vecLeft[y]);
				dvecRight.push(vecRight[y-1] - vecRight[y]);
			}
		}
		
		let tl = dvecLeft.slice(0, 15 + 2),  bl = dvecLeft.slice(15 - 2),
			tr = dvecRight.slice(0, 15 + 2), br = dvecRight.slice(15 - 2);

		let pattern = [1,Number(Math.min(...tl) <= -6), Number(Math.max(...tl) >= 6), Number(Math.min(...bl) <= -6), Number(Math.max(...bl) >= 6), Number(Math.min(...tr) <= -6), Number(Math.max(...tr) >= 6), Number(Math.max(...br) >= 6)].join('');
		
		let templates = [11000001, 11111000, 11101000, 10010000, 10011110, 10000110, 11000000, 10011000],
		templatesCode = [2,3,3,4,5,6,7,9];
		for(let i = 0; i < templates.length; i++){
			if(templates[i] == pattern)
				return templatesCode[i];
		}

		sumLeft /= vecLeft.length;
		sumRight /= vecRight.length;
		if (sumLeft > 5 && sumRight > 5){
			return 1
		} else if(sumLeft + sumRight < 2){
			return 0
		}
		return 8
	}

	ocrText(dataFrame){
		return new Promise((resolve, reject) =>{
			let c = new Image;
			c.src = this.tess.toDataURL(), c.onload = () => {
				Tesseract.recognize(c, "eng").then(({
					data: { text: r }
				}) => {
					let b = r.replaceAll("\n","").split(" ");
					if(b.length > 2){
						let i = 0;
						b.forEach(s => {
							if( i == 0){
								dataFrame.name = s in fixTable ? fixTable[s] : s, i++;
							} else if( i == 1 && s.includes("Lv.")){
								dataFrame.lv = s.split(".")[1], i++;
							} else if( i == 2){
								dataFrame.boss = s, i++;
							} else if( i == 3){
								dataFrame.boss += " " + s;
							}
						});
					}
					resolve("ocrBosses done");
				}).catch( e => {
					reject(Error(e))
				})
			}
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
			b += `${a.name}\t${a.dmg}\t${a.boss}\t${a.lv}\t${a.fin}\n`
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