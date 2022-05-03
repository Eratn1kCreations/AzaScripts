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

    dilate(grayCanvas, destinationCanvas,color=0){
        let [w, h] = this.getCanvasShape(grayCanvas),
            imageData = this.getCanvasData(grayCanvas,0,0,w,h);
        for(let y = 0; y < h; y ++){
            for(let x = 0; x < w; x ++){
                for(let xi = -1; xi<2; xi++){
                    for(let yi = -1; yi<2; yi++){
                        if(x>0&&x<w-1&&y>0&&y<h-1){
                            if(imageData.data[((x+xi)+(y+yi)*w)*4+1] == color){
                                imageData.data[(x+y*w)*4] = color;
                                break;
                            }
                        }
                    }
                }
            }
        }
        this.setCanvasData(destinationCanvas,imageData,0,0,true);
    }

    erode(grayCanvas, destinationCanvas,color=255){
        let [w, h] = this.getCanvasShape(grayCanvas),
            imageData = this.getCanvasData(grayCanvas,0,0,w,h);
        for(let y = 0; y < h; y ++){
            for(let x = 0; x < w; x ++){
                for(let xi = -1; xi<2; xi++){
                    for(let yi = -1; yi<2; yi++){
                        if(x>0&&x<w-1&&y>0&&y<h-1){
                            if(imageData.data[((x+xi)+(y+yi)*w)*4+1] != color){
                                imageData.data[(x+y*w)*4] = 255-color;
                                break;
                            }
                        }
                    }
                }
            }
        }
        this.setCanvasData(destinationCanvas,imageData,0,0,true);
    }

    floodFill(grayCanvas, x, y, color = 255, fullCheck = false, fill = false){
        let [w, h] = this.getCanvasShape(grayCanvas),
            imageData = this.getCanvasData(grayCanvas,0,0,w,h),
            pixelsNew = [], pixelsList = [[x,y],[x,5]], minX=x, maxX=x, minY=y, maxY=y;
        do {
            pixelsNew = [];
            for(let pixelID in pixelsList){
                let [px,py] = pixelsList[pixelID];
                for(let cx = px-1; cx < px+2; cx += (fullCheck)?1:2){
                    for(let cy = py-1; cy < py+2; cy += (fullCheck)?1:2){
                        if(cx >= 0 && cx < w && cy >= 0 && cy < h ){
                            if(imageData.data[(cx+cy*w)*4] == color){
                                pixelsNew.push([cx,cy]);
                                imageData.data[(cx+cy*w)*4] = 128;
                                if(cx<minX){minX=cx}else if(cx>maxX){maxX=cx}
                                if(cy<minY){minY=cy}else if(cy>maxY){maxY=cy}
                            }
                        }
                    }
                }
            }
            pixelsList = [...pixelsNew];
        } while(pixelsNew.length > 0);
        if(fill)
            this.setCanvasData(grayCanvas,imageData,0,0,true);
        return [minX,minY,maxX-minX,maxY-minY];
    }
}