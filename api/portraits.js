class Characters{
    pImage = new Image;
    charP = document.createElement("canvas");
    list = [];

    parseNames = [
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

    parseSize = {w:80,x:8,y:16};

    constructor(filename = 'api/portraits.png'){
        this.charP.width = this.charP.height = this.parseSize.w;
        this.charx = this.charP.getContext("2d");

        this.pImage.src = filename;
        this.pImage.onload = () => {
            for(let i = 0; i < this.parseSize.x*this.parseSize.y;i++){
                if(this.parseNames[i] !== "" | undefined | null){
                    let x = i % this.parseSize.x * this.parseSize.w, y = Math.floor(i / this.parseSize.x) * this.parseSize.w;
                    this.charx.fillRect(0,0,this.parseSize.w,this.parseSize.w);
                    this.charx.drawImage(this.pImage,x,y,128,128,0,0,this.parseSize.w,this.parseSize.w);
                    this.list.push({n:this.parseNames[i], c: colorThief.getPalette(this.charP,2)[0], u: this.charP.toDataURL()});
                }
            }
        }
	}
    
    getList(){
        return this.list;
    }
}

const colorThief = new ColorThief(), characters = new Characters();