class CanvasFunctions{
    getCanvasCtx(canvas, alpha = false){
        return canvas.getContext("2d",{'alpha':alpha});
    }

    getCanvasShape(canvas){
        return [canvas.width, canvas.height];
    }

    setCanvasShape(canvas,width,height){
        canvas.width = width;
        canvas.height = height;
    }

    getCanvasData(canvas,x,y,width,height){
        return this.getCanvasCtx(canvas).getImageData(x,y,width,height);
    }

    setCanvasData(canvas,data,x,y,overwriteShape = false){
        if(overwriteShape)
            this.setCanvasShape(canvas,data.width,data.height);
        this.getCanvasCtx(canvas).putImageData(data,x,y);
    }

    toGrayscale(colorCanvas,destinationCanvas){
        let [w, h] = this.getCanvasShape(colorCanvas),
            imageData = this.getCanvasData(colorCanvas,0,0,w,h);
        for(let x = 0; x < (w*h)*4; x += 4){
            imageData.data[x] = imageData.data[x+1] = imageData.data[x+2] = Math.floor((imageData.data[x] + imageData.data[x+1] + imageData.data[x+2]) / 3);
        }
        this.setCanvasData(destinationCanvas,imageData,0,0,true);
    }

    thresholdInv(grayCanvas,destinationCanvas,lower = 0,upper = 255){
        let [w, h] = this.getCanvasShape(grayCanvas),
            imageData = this.getCanvasData(grayCanvas,0,0,w,h);
        for(let x = 0; x < w*h*4; x += 4){
            imageData.data[x] = imageData.data[x+1] = imageData.data[x+2] = ( imageData.data[x] >= lower && imageData.data[x] <= upper) ? 0 : 255;
        }
        this.setCanvasData(destinationCanvas,imageData,0,0,true);
    }
}