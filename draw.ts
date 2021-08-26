window.onload = function () {
    let canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = 1600;
    canvas.height = 720;
    let ctx : CanvasRenderingContext2D = canvas.getContext("2d");

    let digit0 = new Digit(0, 0, 120, 180, 5, 5);
    let digit1 = new Digit(125, 0, 120, 180, 5, 5);
    let sep = new Separator(250, 0, 55, 180, 5, 5);
    let digit2 = new Digit(310, 0, 120, 180, 5, 5);
    let digit3 = new Digit(435, 0, 120, 180, 5, 5);
    let sep1 = new Separator(560, 0, 55, 180, 5, 5);
    let digit4 = new Digit(620, 0, 120, 180, 5, 5);
    let digit5 = new Digit(745, 0, 120, 180, 5, 5);

    setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        digit0.draw(ctx);
        digit1.draw(ctx);
        sep.draw(ctx);
        digit2.draw(ctx);
        digit3.draw(ctx);
        sep1.draw(ctx);
        digit4.draw(ctx);
        digit5.draw(ctx);
        ctx.stroke();
    }, 50);

    setInterval(() => {
        let now = new Date();
        let h = now.getHours();
        let m = now.getMinutes();
        let s = now.getSeconds();

        digit0.setTarget(Math.floor(h / 10));
        digit1.setTarget(Math.floor(h % 10));
        sep.set();
        digit2.setTarget(Math.floor(m / 10));
        digit3.setTarget(Math.floor(m % 10));
        sep1.set();
        digit4.setTarget(Math.floor(s / 10));
        digit5.setTarget(Math.floor(s % 10));
    }, 1000);

}


class Clock {
    hours : number; // 0 .. 2pi
    minutes : number; // 0 .. 2pi

    targetHours : number; // 0 .. 2pi
    targetMinutes : number; // 0 .. 2pi

    rotationSpeed : number; // radian per second
    lastUpdTs : number; // timestamp of last update

    MINS_ARROW_LEN : number = .9;
    HRS_ARROW_LEN : number = .7;

    constructor(rotationSpeed : number) {
        this.hours = 0;
        this.minutes = 0;

        this.targetHours = 0;
        this.targetMinutes = 0;

        this.rotationSpeed = rotationSpeed;
        this.lastUpdTs = Date.now();
    }

    setTarget(hours : number, minutes : number) {
        this.targetHours = hours;
        this.targetMinutes = minutes;
    }

    moveArrows() {
        let curTs = Date.now();
        let tsDiff = curTs - this.lastUpdTs;
        this.lastUpdTs = curTs;

        if (this.hours === this.targetHours && this.minutes === this.targetMinutes) {
            return;
        }

        let targetHours = (this.targetHours < this.hours ? this.targetHours + 2 * Math.PI : this.targetHours);
        let targetMinutes = (this.targetMinutes < this.minutes ? this.targetMinutes + 2 * Math.PI : this.targetMinutes);

        let nextHours = Math.min(targetHours,  this.hours + this.rotationSpeed * tsDiff / 1000);
        let nextMinutes = Math.min(targetMinutes,  this.minutes + this.rotationSpeed * tsDiff / 1000);

        this.hours = (nextHours > 2 * Math.PI ? nextHours - 2 * Math.PI : nextHours);
        this.minutes = (nextMinutes > 2 * Math.PI ? nextMinutes - 2 * Math.PI : nextMinutes);
    }

    draw(ctx : CanvasRenderingContext2D, x : number, y : number, r : number) {
        this.moveArrows();

        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.sin(this.hours) * r * this.HRS_ARROW_LEN,
            y - Math.cos(this.hours) * r * this.HRS_ARROW_LEN);
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.sin(this.minutes) * r * this.MINS_ARROW_LEN,
            y - Math.cos(this.minutes) * r * this.MINS_ARROW_LEN);
    }
}

class Segment {
    clocks : Clock[][];

    x: number; // square to fit the segment in
    y : number;
    w : number;
    h : number;
    gapx : number; // x-gap between clocks in pixels
    gapy : number; // y-gap between clocks in pixels
    n : number; // # of rows
    m : number; // # of columns

    constructor(x : number, y : number, w : number, h : number, gapx : number, gapy : number, n : number, m : number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.gapx = gapx;
        this.gapy = gapy;
        this.n = n;
        this.m = m;

        this.clocks = [];
        for (let i = 0; i < n; ++i) {
            let curRow = [];
            for (let j = 0; j < m; ++j) {
                curRow.push(new Clock(2 * Math.PI));
            }
            this.clocks.push(curRow);
        }
    }

    draw(ctx : CanvasRenderingContext2D) {
        let clocksW = (this.w - this.gapx * (this.m - 1)) / this.m;
        let clocksH = (this.h - this.gapy * (this.n - 1)) / this.n;
        let r = Math.min(clocksW, clocksH) / 2;
        for (let i = 0; i < this.n; ++i) {
            for (let j = 0; j < this.m; ++j) {
                this.clocks[i][j].draw(
                    ctx,
                    this.x + j * (clocksW + this.gapx) + clocksW / 2,
                    this.y + i * (clocksH + this.gapy) + clocksH / 2,
                    r);
            }
        }
    }

    clear() {
        for (let i = 0; i < this.n; ++i) {
            for (let j = 0; j < this.m; ++j) {
                this.clocks[i][j].setTarget(XX[0], XX[1]);
            }
        }
    }
}

class Digit extends Segment {

    constructor(x : number, y : number, w : number, h : number, gapx : number, gapy : number) {
        super(x, y, w, h, gapx, gapy, 6, 4);
    }

    setTarget(target : number) {
        for (let i = 0; i < this.n; ++i) {
            for (let j = 0; j < this.m; ++j) {
                this.clocks[i][j].setTarget(positions[target][i][j][0], positions[target][i][j][1]);
            }
        }
    }
}

class Separator extends Segment {
    constructor(x : number, y : number, w : number, h : number, gapx : number, gapy : number) {
        super(x, y, w, h, gapx, gapy, 6, 2);
    }

    set() {
       for (let i = 0; i < this.n; ++i) {
           for (let j = 0; j < this.m; ++j) {
               this.clocks[i][j].setTarget(positions['separator'][i][j][0], positions['separator'][i][j][1]);
           }
       }
    }
}

let RD = [0.5 * Math.PI, Math.PI];
let RL = [0.5 * Math.PI, 1.5 * Math.PI];
let DL = [Math.PI, 1.5 * Math.PI];
let DU = [Math.PI, 0];
let RU = [0.5 * Math.PI, 0];
let LU = [1.5 * Math.PI, 0];
let XX = [1.25 * Math.PI, 1.25 * Math.PI];
let UX = [0, 1.25 * Math.PI];
let XD = [0.25 * Math.PI, Math.PI];
let UY = [0, 0.75 * Math.PI];
let YD = [1.75 * Math.PI, Math.PI];

let positions = {
    'separator' : [[XX, XX], [RD, DL], [RU, LU], [RD, DL], [RU, LU], [XX, XX]],
    0 : [[RD, RL, RL, DL], [DU, RD, DL, DU], [DU, DU, DU, DU], [DU, DU, DU, DU], [DU, RU, LU, DU], [RU, RL, RL, LU]],
    1 : [[RD, RL, DL, XX], [RU, DL, DU, XX], [XX, DU, DU, XX], [XX, DU, DU, XX], [RD, LU, RU, DL], [RU, RL, RL, LU]],
    2 : [[RD, RL, RL, DL], [RU, RL, DL, DU], [RD, RL, LU, DU], [DU, RD, RL, LU], [DU, RU, RL, DL], [RU, RL, RL, LU]],
    3 : [[RD, RL, RL, DL], [RU, RL, DL, DU], [RD, RL, LU, DU], [RU, RL, DL, DU], [RD, RL, LU, DU], [RU, RL, RL, LU]],
    4 : [[RD, DL, RD, DL], [DU, DU, DU, DU], [DU, RU, LU, DU], [RU, RL, DL, DU], [XX, XX, DU, DU], [XX, XX, RU, LU]],
    5 : [[RD, RL, RL, DL], [DU, RD, RL, LU], [DU, RU, RL, DL], [RU, RL, DL, DU], [RD, RL, LU, DU], [RU, RL, RL, LU]],
    6 : [[RD, RL, RL, DL], [DU, RD, RL, LU], [DU, RU, RL, DL], [DU, RD, DL, DU], [DU, RU, LU, DU], [RU, RL, RL, LU]],
    7 : [[RD, RL, RL, DL], [RU, RL, DL, DU], [XX, XX, UX, UX], [XX, XD, XD, XX], [XX, DU, DU, XX], [XX, RU, LU, XX]],
    8 : [[RD, RL, RL, DL], [DU, RD, DL, DU], [UY, RU, LU, UX], [XD, RD, DL, YD], [DU, RU, LU, DU], [RU, RL, RL, LU]],
    9 : [[RD, RL, RL, DL], [DU, RD, DL, DU], [DU, RU, LU, DU], [RU, RL, DL, DU], [RD, RL, LU, DU], [RU, RL, RL, LU]]
}

