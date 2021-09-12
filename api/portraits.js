class Characters{
    pImage = new Image;
    mapCharacters = document.createElement("canvas");
    mapSize = {x:16,y:8};
    mapNames = [
        "Eugene", "Future Princess", "God of Harvest Kamael", "Erina", "", "Elvira", "", "Marinanne", "Eva", "", "", "", "", "", "", "", 
        "", "Miya", "Garam", "Future Knight", "Lahn", "Noxia", "Oghma", "Yuze", "", "Aisha", "", "", "", "", "", "", 
        "Lavi", "", "Miya", "Sohee", "Knight", "Lifeguard Yuze", "White Beast", "Rue", "Bianca", "Lapice", "", "", "", "", "", "", 
        "Mei", "Marvin", "", "Vishuvac", "Alef", "Knight", "Gremory", "Rachel", "Hekate", "Beach Sohee", "Karina", "", "", "", "", "", 
        "Rie", "Tinia", "Ranpang", "Nari", "Scintilla", "Idol Eva", "Lucy", "Amy", "Plitvice", "Shapira", "Catherine", "Neva", "", "", "", "", 
        "Akayuki", "Lynn", "Favi", "Ranpang", "Nari", "Bari", "Coco", "Aoba", "Loraine", "Plitvice", "Gabriel", "Dolf", "Arabelle", "", "", "", 
        "Marina", "Mayreel", "Fei", "Lilith", "Girgas", "Eleanor", "Future Knight", "Beth", "Legendary Hero Erina", "Mk.99", "Veronica", "Gabriel", "Craig", "Lupina", 
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ];

    constructor(filename = 'api/Texture2D/portraits.png'){
        this.mpaCtx = this.mapCharacters.getContext("2d");
        this.pImage.src = filename;
        this.pImage.onload = () => {
            this.mapCharacters.width = this.pImage.width;
            this.mapCharacters.height = this.pImage.height;
            this.mapSize.w = this.pImage.width / this.mapSize.x;
            this.mapSize.w2 = this.mapSize.w / 2;
            this.mpaCtx.fillRect(0,0,this.pImage.width,this.pImage.height);
            this.mpaCtx.drawImage(this.pImage,0,0);
        }
	}

    cvReady(){
        cv['onRuntimeInitialized']=()=>{
            this.src = cv.imread(this.mapCharacters);
            this.dst = new cv.Mat();
            this.mask = new cv.Mat();
            document.getElementById("disableBlock").className = "hide";
        };
    }
    
    search(character){
        let templ = cv.imread(character);
        cv.matchTemplate(this.src, templ, this.dst, cv.TM_CCOEFF_NORMED , this.mask);
        return this.pointToName(cv.minMaxLoc(this.dst, this.mask).maxLoc);
    }

    pointToName(point){
        let x = Math.floor((point.x + this.mapSize.w2) / this.mapSize.w),
            y = Math.floor((point.y + this.mapSize.w2) / this.mapSize.w);
        return this.mapNames[x + y * this.mapSize.x];
    }
}