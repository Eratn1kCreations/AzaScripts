class Characters{
    pImage = new Image;
    mapCharacters = document.createElement("canvas");
    mapSize = {x:8,y:16};
    mapNames = [
        "Marina","Akayuki","Mayreel","Rie","Lynn","Fei","Mei","Tinia",
        "Favi","Lilith","Lavi","Marvin","Ranpang","Ranpang","Girgas","",
        "","","Nari","Nari","Eleanor","Eugene","Miya","Miya",
        "Vishuvac","Scintilla","Bari","Future Knight","Future Princess","Future Princess","Garam","Sohee",
        "Alef","Idol Eva","Coco","Beth","Knight","Eva","Knight","Knight",
        "Lucy","Aoba","Lahn","Lifeguard Yuze","Gremory","Amy","Loraine","Mk.99",
        "","Noxia","","White Beast","Rachel","Plitvice","Plitvice","Veronica",
        "Elvira","Oghma","Rue","Hekate","Shapira","Gabriel","Gabriel","",
        "Yuze","Lapice","Karina","","Neva","Arabelle","Lupina","Aisha",
        "Bianca","","","","","","","",
        "Beach Sohee","","","","","","","",
        "Catherine","","","","","","","",
        "Dolf","","","","","","","",
        "Craig","","","","","","","",
        "Marinanne","","","","","","","",
        "","","","","","","",""
    ];

    constructor(filename = 'api/portraits.png'){
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
        return pointToName(cv.minMaxLoc(this.dst, this.mask).maxLoc);
    }

    pointToName(point){
        let x = Math.floor((point.x + mapSize.w2) / mapSize.w),
            y = Math.floor((point.y + mapSize.w2) / mapSize.w);
        return this.mapNames[x + y * this.mapSize.x];
    }
}

const character = new Characters("https://eratn1kcreations.github.io/AzaScripts/api/portraits.png");