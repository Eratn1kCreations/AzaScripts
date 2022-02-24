class TemplateMatching extends CanvasFunctions{
    constructor(){
        super();
        this.resultPreview = document.createElement("canvas");
        this.powTable = [];
        for(let i=0;i<256;i++){this.powTable.push(Math.pow(i/255,2))}
    }

    drawResultPreview(destinationCanvas){
        let [w, h] = this.getCanvasShape(this.resultPreview);
        this.setCanvasShape(destinationCanvas,w,h);
        this.getCanvasCtx(destinationCanvas).drawImage(this.resultPreview,0,0);
    }

    matchTemplate(template, object, renderPreview = false){
        let [w_t, h_t] = this.getCanvasShape(template),
            [w_o, h_o] = this.getCanvasShape(object),
            minX = 0, minY = 0;

        if(w_t < w_o || h_t < h_o){
            console.error("Size not match: Object is bigger than template");
        } else {
            let denominator_o = 0, first_loop = true, minV = Infinity, temp, value;
            let templateData = this.getCanvasData(template,0,0,w_t,h_t).data,
                objectData = this.getCanvasData(object,0,0,w_o,h_o).data;
            
            if(renderPreview){
                this.setCanvasShape(this.resultPreview, w_t-w_o, h_t-h_o+1);
                temp = this.getCanvasData(this.resultPreview,0,0,w_t-w_o, h_t-h_o+1);
            }

            for(let y_t = 0; y_t <= h_t - h_o; y_t++){
                for(let x_t = 0; x_t <= w_t - w_o; x_t++){
                    
                    let numerator = 0, denominator_t = 0;
                    for(let x_o = 0; x_o < w_o; x_o++){
                        for(let y_o = 0; y_o < h_o; y_o++){
                            
                            let pixel_o = objectData[(y_o*w_o + x_o)*4],
                                pixel_t = templateData[((y_o + y_t)*w_t + x_o + x_t)*4];

                            numerator += this.powTable[ Math.abs(pixel_o - pixel_t) ];
                            denominator_t += this.powTable[pixel_t];
                            if(first_loop) denominator_o += this.powTable[pixel_o];
                        }
                    }

                    value = numerator / Math.sqrt(denominator_o*denominator_t);
                    
                    if(value < minV){
                        minV = value;
                        minX = x_t;
                        minY = y_t;
                    }

                    if(renderPreview){
                        let pos = (y_t*(w_t - w_o) + x_t)*4;
                        temp.data[pos] = temp.data[pos+1] = temp.data[pos+2] = (1-value)*255;
                    }

                    first_loop = false;
                }
            }
            if(renderPreview) this.setCanvasData(this.resultPreview,temp,0,0);
        }
        return [minY, minX];
    }
}

class TextMatching extends TemplateMatching{
    constructor(){
        super();
        this.template = document.createElement("canvas");
        this.templateBuffor = {};
    }

    clearNameBuffor(){
        delete this.templateBuffor.name;
    }

    generateTemplate(namesList, characterNo, type){
        
        if(type in this.templateBuffor && characterNo == 0){
            this.setCanvasData(this.template,this.templateBuffor[type][0],0,0,true);
            return this.templateBuffor[type][1];
        }

        let letters = "";
        if(characterNo < 0){
            letters = namesList[0];
        } else {
            namesList.forEach((name)=>{
                if(name.length > characterNo){
                    letters += name[characterNo];
                }
            });
        }
    
        let lettersList = [...(new Set(letters))];

        this.setCanvasShape(this.template, 26*lettersList.length, 28);
        let c = this.getCanvasCtx(this.template);
            c.clearRect(0, 0, 26*lettersList.length, 28);
            c.font = '26px GTfont';
            c.textBaseline = 'middle';
            c.textAlign = 'center';
            c.fillStyle = 'rgb(188,188,188)';
    
        let x = 13;
        lettersList.forEach((letter)=>{
            c.fillText(letter, x, 14);
            x += 26;
        });

        if(characterNo == 0){
            this.templateBuffor[type] = [this.getCanvasData(this.template,0,0,26*lettersList.length,28), lettersList];
        }

        return lettersList;
    }

    checkLetter(letterSlice, matchList, characterNo = 0, correctionValue = 67, type = 'name'){
        this.correctValue(letterSlice, correctionValue);

        let lettersList = this.generateTemplate(matchList,characterNo,type),
            [_,x] = this.matchTemplate(this.template,letterSlice),
            letter = lettersList[Math.floor((x + 10)/26)];

        // for single comparation when characterNo < 0
        if(characterNo < 0) return letter;
        
        // exceptions
        let letters = [letter];
        if(["P","R","F"].indexOf(letter) >= 0){
            letters = ["P","R","F"]
        } else if(["l","k","1","i","I"].indexOf(letter) >= 0){
            letters = ["l","k","1","i","I"]
        } else if(["m","n","r"].indexOf(letter) >= 0){
            letters = ["m","n","r"]
        }

        let matchListOut = [];
        matchList.forEach((name)=>{
            if(name.length > characterNo)
                if(letters.indexOf(name[characterNo]) >= 0)
                    matchListOut.push(name)
        });

        return matchListOut;
    }

    correctValue(letterSlice, correctionValue){
        if(correctionValue){
            let [w, h] = this.getCanvasShape(letterSlice),
                temp = this.getCanvasData(letterSlice,0,0,w,h);
            for(let x = 0; x < w*h*4; x += 4){
                temp.data[x] -= (temp.data[x] <= correctionValue) ? temp.data[x] : correctionValue;
            }
            this.setCanvasData(letterSlice,temp,0,0);
        }
    }

}