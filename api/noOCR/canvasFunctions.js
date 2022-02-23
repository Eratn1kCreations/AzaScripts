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

    threshold(grayCanvas,destinationCanvas,lower = 0,upper = 255, inverted = false){
        let [w, h] = this.getCanvasShape(grayCanvas),
            imageData = this.getCanvasData(grayCanvas,0,0,w,h);
        for(let x = 0; x < w*h*4; x += 4){
            imageData.data[x] = imageData.data[x+1] = imageData.data[x+2] = (( imageData.data[x] >= lower && imageData.data[x] <= upper ) ? (!inverted) : (inverted))*255;
        }
        this.setCanvasData(destinationCanvas,imageData,0,0,true);
    }

    floodFill(grayCanvas, x, y, color = 255){
        let [w, h] = this.getCanvasShape(grayCanvas),
            imageData = this.getCanvasData(grayCanvas,0,0,w,h).data,
            pixelsNew = [], pixelsList = [[x,y],[x,5]], minX=x, maxX=x, minY=y, maxY=y;
        do {
            pixelsNew = [];
            for(let pixelID in pixelsList){
                let [px,py] = pixelsList[pixelID];
                for(let cx = px-1; cx < px+2; cx += 2){
                    for(let cy = py-1; cy < py+2; cy += 2){
                        if(cx >= 0 && cx < w && cy >= 0 && cy < h ){
                            if(imageData[(cx+cy*w)*4] == color){
                                pixelsNew.push([cx,cy]);
                                imageData[(cx+cy*w)*4] = 128;
                                if(cx<minX){minX=cx}else if(cx>maxX){maxX=cx}
                                if(cy<minY){minY=cy}else if(cy>maxY){maxY=cy}
                            }
                        }
                    }
                }
            }
            pixelsList = [...pixelsNew];
        } while(pixelsNew.length > 0);
        return [minX,minY,maxX-minX,maxY-minY];
    }
}