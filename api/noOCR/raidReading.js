class AttemptsReading extends CanvasFunctions{
    constructor(){
        super();
        this.textMatching = new TextMatching();
        this.numberRecognition = new NumberRecognition();
        this.tempSlice = document.createElement("canvas");
        this.tempSlice2 = document.createElement("canvas");
        this.tempSliceTh = document.createElement("canvas");
        this.tempColor = document.createElement("canvas");
        this.tempGray = document.createElement("canvas");//document.getElementById("test");//
    }

    readAttempt(imageColor,attemptData,playersList,bossesList){
        this.setCanvasData(
            this.tempColor,
            this.getCanvasData(imageColor,attemptData.x,attemptData.y,attemptData.w,attemptData.h),
            0,0,true
        );
        this.toGrayscale(this.tempColor,this.tempGray);

        let run = {};
            run.name = this.readName(playersList);
            run.dmg = this.readDmg();
            [run.boss, run.lv] = this.readBoss(bossesList);
            run.fin = this.checkIfKill();
        return run;
    }

    readName(playersList){
        this.setCanvasData(
            this.tempSlice,
            this.getCanvasData(this.tempGray, 30, 15, 320, 35),
            0,0,true
        );
        this.thresholdInv(this.tempSlice, this.tempSliceTh, 170, 255);
        
        let [w, h] = this.getCanvasShape(this.tempSliceTh),
            [top,bot] = this.shrinkVertiacally(this.tempSliceTh,2),
            checklist = playersList;
      
        h = bot - top;
        let sliceData = this.getCanvasData(this.tempSliceTh,0,top,w,h).data,
            xi = 0, left = -1, space = 0, n = 0;

        while ((left < 0 || space < 15) && xi < w){
            for(let yi = 0; yi < h; yi++){
                if(sliceData[(yi*w+xi)*4] < 255){
                    if(left <= 1) left = xi;
                    space = 0;
                    break;
                }
            }
            if(left >= 0 && space == 1){
                this.setCanvasData(
                    this.tempSlice2,
                    this.getCanvasData(this.tempSlice, left, top, xi-left, bot-top),
                    0,0,true
                );
                checklist = this.textMatching.checkLetter(this.tempSlice2, checklist, n)
                if(checklist.length == 1) return checklist[0]
                n++;
                left = 0;
            }
            space++;
            xi++;
        }
        return "";
    }

    readBoss(bossesList){
        let [w, h] = this.getCanvasShape(this.tempGray);
        this.setCanvasData(
            this.tempSlice,
            this.getCanvasData(this.tempGray, w-450, 15, 435, 30),
            0,0,true
        );
        this.thresholdInv(this.tempSlice, this.tempSliceTh, 100, 255);

        let [top,bot] = this.shrinkVertiacally(this.tempSliceTh,1);
        [w, h] = this.getCanvasShape(this.tempSliceTh)
        h = bot - top;
        let sliceData = this.getCanvasData(this.tempSliceTh,0,top,w,h).data,
            checklist = bossesList.map(el => el.split('').reverse().join('')),
            xi = 1, right = -1, space = 0, n = 0, bossName = "";

        while ((right < 0 || space < 15) && xi < w){
            for(let yi = 0; yi < h; yi++){
                if(sliceData[(yi*w+w-xi)*4] < 255){
                    if(right <= 1) right = w-xi;
                    space = 0;
                    break;
                }
            }
            if(right >= 0 && space == 1){
                this.setCanvasData(
                    this.tempSlice2,
                    this.getCanvasData(this.tempSlice, w-xi, top, right-w+xi, bot-top),
                    0,0,true
                );
                checklist = this.textMatching.checkLetter(this.tempSlice2, checklist, n, 49)
                if(checklist.length == 1){
                    bossName = checklist[0].split('').reverse().join('');
                    break;
                }
                n++;
                right = 0;
            }
            space++;
            xi++;
        }
        let left = -1, i = 0, bossLvL = 0;
        xi = 0; space = 0; n = 1;
        while ((left < 0 || space < 15) && xi < w){
            for(let yi = 0; yi < h; yi++){
                if(sliceData[(yi*w+xi)*4] < 255){
                    if(left <= 1) left = xi;
                    space = 0;
                    break;
                }
            }
            if(left >= 0 && space == 1){
                if(i > 2){
                    this.setCanvasData(
                        this.tempSlice2,
                        this.getCanvasData(this.tempSlice, left, top, xi-left, bot-top),
                        0,0,true
                    );
                    bossLvL *= n;
                    bossLvL += parseInt(this.textMatching.checkLetter(this.tempSlice2, ["0123456789"], -1, 49));
                    n *= 10;
                }
                i++;
                left = 0;
            }
            space++;
            xi++;
        }
        return [bossName, bossLvL];
    }

    readDmg(){
        this.setCanvasData(
            this.tempSlice,
            this.getCanvasData(this.tempGray, 390, 80, 340, 60),
            0,0,true
        );
        this.thresholdInv(this.tempSlice, this.tempSliceTh, 150, 255);
        
        let [w, h] = this.getCanvasShape(this.tempSliceTh),
            [top,bot] = this.shrinkVertiacally(this.tempSliceTh);

        h = bot - top;
        let sliceData = this.getCanvasData(this.tempSliceTh,0,top,w,h).data,
            xi = 0, left = -1, space = 0, damage = [];

        while ((left < 0 || space < 15) && xi < w){
            for(let yi = 0; yi < h; yi++){
                if(sliceData[(yi*w+xi)*4] < 255){
                    if(left <= 1) left = xi;
                    space = 0;
                    break;
                }
            }
            if(left >= 0 && space == 1){
                this.setCanvasData(
                    this.tempSlice,
                    this.getCanvasData(this.tempSliceTh, left, top, xi-left, h),
                    0,0,true
                );
                damage.push(this.numberRecognition.readNumber(this.tempSlice));
                left = 0;
            }
            space++;
            xi++;
        }
        return damage.join("");
    }

    shrinkVertiacally(image, checkWidth = 4){
        let [w, h] = this.getCanvasShape(image), top = 0, bot = 0,
            imageData = this.getCanvasData(image,0,0,w,h).data;
        for(let y = 0; y < h; y++){
            for(let x = 0; x < Math.floor(w/checkWidth); x++){
                if(!top)
                    if(imageData[(y*w+x)*4] < 255)
                        top = y;
                if(!bot)
                    if(imageData[((h-1-y)*w+x)*4] < 255)
                        bot = h-1-y;
                if(top && bot)
                    break;
            }
        }
        return [top, bot];
    }

    checkIfKill(){
        let [w, h] = this.getCanvasShape(this.tempColor), close = 0,
            sliceData = this.getCanvasData(this.tempColor, w-11, Math.floor(h*.35)+10, 1 , h - Math.floor(h*.35) - 20).data;
        for(let x = 0; x < sliceData.length; x += 4){
            if(this.hsvDist([204, 0.6122448979591837, 49],this.rgb2hsv(sliceData[x],sliceData[x+1],sliceData[x+2])) < 0.1)
                close++
        }
        return (close > 10) ? 1 : 0;
    }

    rgb2hsv(r,g,b) {
        let v = Math.max(r,g,b), c=v-Math.min(r,g,b);
        let h = c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); 
        return [60*(h<0?h+6:h),v&&c/v,v];
    }

	hsvDist(a,b) {
		let dh = Math.min(Math.abs(b[0]-a[0]), 360-Math.abs(b[0]-a[0])) / 180.0,
			ds = Math.abs(b[1]-a[1]),
			dv = Math.abs(b[2]-a[2]) / 255.0;
		return Math.sqrt(dh*dh+ds*ds+dv*dv);
	}
}

class ScreenshotParser extends AttemptsReading{
    constructor(previewName, progressBar, players, bosses){
        super();
        this.screenshotColor = document.createElement("canvas");
        this.preview = document.getElementById(previewName);
        this.progress = document.getElementById(progressBar);
        this.playersList = players;
        this.bossesList = bosses;
    }

    loadToBuffer(filesQueue, fileNo = 0){
        if(fileNo == 0){
            this.processedCount = 0;
            this.progress.setAttribute("max", filesQueue.length * 4);
            this.runsData = []
        }

        if(fileNo < filesQueue.length){
            document.getElementById("progress").setAttribute("desc2", `${fileNo+1} / ${filesQueue.length}`);
            reader.readAsDataURL(filesQueue[fileNo]), reader.onload = () => {
                var b = new Image;
                b.src = reader.result;
                b.setAttribute("id","pImg");
                b.onload = () => {
                    this.parseScreenshot(b);
                    this.loadToBuffer(filesQueue, fileNo + 1);
                }
            }
        } else {
			this.printOutput();
        }
    }

    parseScreenshot(imageObject){
        this.setCanvasShape(this.screenshotColor,imageObject.width,imageObject.height);
        this.getCanvasCtx(this.screenshotColor).drawImage(imageObject,0,0);
        this.displayImage(imageObject);
        let attempts = this.findAttemptArea();
        attempts.forEach((attempt)=>{
            this.runsData.push(this.readAttempt(this.screenshotColor,attempt, this.playersList, this.bossesList));
            this.markAttemptArea(attempt,true);
            this.processedCount++;
            this.progress.setAttribute("value", this.processedCount);
        });
    }

    findAttemptArea(){
        let [w, h] = this.getCanvasShape(this.screenshotColor),
            mw = Math.floor(w/2), mh = Math.floor(h/2),
            [top, bot] = this.findBorder(this.getCanvasData(this.screenshotColor,mw,0,1,h).data,mh),
            [left, right] = this.findBorder(this.getCanvasData(this.screenshotColor,0,mh-top+20,w,1).data,mw,600),
            space = 7, ah = top + bot + 1, aw = left + right + 1,
            anchorTop = mh - top - ah - space, anchorLeft = mw - left,
            attempts = [];
        for(let i = 0; i < 4; i++){
            let attempt = {y:anchorTop + i*ah + i*space,x:anchorLeft,w:aw,h:ah};
            this.markAttemptArea(attempt);
            attempts.push(attempt);
        }
        return attempts.reverse();
    }

    findBorder(dataTable, size, begin = 0){
        let a = 0, b = 0;
        for(let y = begin*4; y < size*4; y += 4){
            if(!a)
                if((dataTable[size*4-y]+dataTable[size*4-y+1]+dataTable[size*4-y+2]) < 80)
                    a = y/4;
            if(!b)
                if((dataTable[size*4+y]+dataTable[size*4+y+1]+dataTable[size*4+y+2]) < 80)
                    b = y/4;
            if(a && b)
                break;
        }
        return [a,b];
    }

    markAttemptArea(attemptData, clearArea = false){
        let ctx = this.getCanvasCtx(this.preview,true);
        if(clearArea){
            ctx.clearRect(attemptData.x,attemptData.y,attemptData.w,attemptData.h);
        } else {
            ctx.fillStyle = "rgba(255,255,0,0.5)";
            ctx.fillRect(attemptData.x,attemptData.y,attemptData.w,attemptData.h);
        }
    }

	displayImage(image){
		document.querySelectorAll('[id^="pImg"]').forEach(function (e) { e.remove() });
		document.getElementById("worker").insertBefore(image.cloneNode(false),this.preview);
		let newImg = document.getElementById("pImg"),
			w = image.width,
			h = image.height,
			sw = newImg.offsetWidth / w,
			sh = newImg.offsetHeight / h;
		this.setCanvasShape(this.preview,w,h);
        this.getCanvasCtx(this.preview,true).clearRect(0, 0, w, h);
        this.preview.setAttribute("style", `transform:scale(${sw},${sh})`);
	}

    canvasRescale(){
		let newImg = document.getElementById("pImg");
		if(newImg != null | undefined){
			let sw = newImg.offsetWidth / this.screenshotColor.width,
			    sh = newImg.offsetHeight / this.screenshotColor.height;
			this.preview.setAttribute("style", `transform:scale(${sw},${sh})`);
		}
	}

    printOutput() {
		let a = this.runsData.reduce((a, b) => a.some(a => JSON.stringify(b) === JSON.stringify(a)) ? a : [...a, b], []),
			b = "";
		a.forEach(a => {
			b += `${a.name}\t${a.dmg}\t${a.boss}\t${a.lv}\t${a.fin}\n`
		});
		document.getElementById("removeinfo").setAttribute("desc2","Removed " + (this.runsData.length - a.length) + " duplicates");
		document.getElementById("progress").setAttribute("desc2", `Done`);
		document.getElementById("output").innerHTML = b;
	}
}