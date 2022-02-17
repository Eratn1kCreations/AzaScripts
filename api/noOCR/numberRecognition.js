class NumberRecognition extends CanvasFunctions{
    constructor(){
        super();
        this.temp = document.createElement("canvas");
        this.setCanvasShape(this.temp,25,35);
    }

    readNumber(numberSlice){
        let [w, h] = this.getCanvasShape(numberSlice);
        this.getCanvasCtx(this.temp).drawImage(numberSlice, 0, 0, w, h, 0, 0, 25, 35);
		let sliceData = this.getCanvasData(this.temp,1,1,23,33).data,
            dleft = [], dright = [], middle = 0;
        for(let y = 0; y < 33; y++){
            for(let x = 0; x < 23; x++){
                if(sliceData[ (y*23+x)*4 ] < 255 && dleft.length <= y )
                    dleft.push(x);
                if(sliceData[ (y*23+22-x)*4 ] < 255 && dright.length <= y )
                    dright.push(x);
                if(dleft.length > y && dright.length > y)
                    break;
            }
            if(y > 0){
                dleft[y-1] -= dleft[y];
                dright[y-1] -= dright[y];
            }
            middle += (sliceData[ (y*23+12)*4 ] < 255) ? 1 : 0;
        }
        dleft.pop(); dright.pop();
        let tl = dleft.slice(0, 15 + 2),  bl = dleft.slice(15 - 2),
			tr = dright.slice(0, 15 + 2), br = dright.slice(15 - 2),
            pattern = [1,Number(Math.min(...tl) <= -6), Number(Math.max(...tl) >= 6), Number(Math.min(...bl) <= -6), Number(Math.max(...bl) >= 6), Number(Math.min(...tr) <= -6), Number(Math.max(...tr) >= 6), Number(Math.max(...br) >= 6)].join(''),
            templates = [11000001, 11111000, 11101000, 10010000, 10011110, 10000110, 11000000, 10001000, 10011000],
            templatesCode = [2,3,3,4,5,6,7,9,9];

        for(let i = 0; i < templates.length; i++){
            if(templates[i] == pattern)
                return templatesCode[i];
        }
        if(middle > 25) return 1;
        if(middle > 12) return 8;
        return 0;
    }
}
