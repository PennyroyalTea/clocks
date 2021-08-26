window.onload = function () {
    let canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let ctx : CanvasRenderingContext2D = canvas.getContext("2d");

    let layout = new VerticalLayout(0, 0, canvas.width, canvas.height);

    setInterval(() => {
        layout.redraw(ctx);
    }, 16);

    setInterval(() => {
        let now = new Date();
        let h = now.getHours();
        let m = now.getMinutes();
        let s = now.getSeconds();
        layout.set([Math.floor(h / 10), h % 10, Math.floor(m / 10), m % 10, Math.floor(s / 10), s % 10]);
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
            return false;
        }

        let targetHours = (this.targetHours < this.hours ? this.targetHours + 2 * Math.PI : this.targetHours);
        let targetMinutes = (this.targetMinutes < this.minutes ? this.targetMinutes + 2 * Math.PI : this.targetMinutes);

        let nextHours = Math.min(targetHours,  this.hours + this.rotationSpeed * tsDiff / 1000);
        let nextMinutes = Math.min(targetMinutes,  this.minutes + this.rotationSpeed * tsDiff / 1000);

        this.hours = (nextHours > 2 * Math.PI ? nextHours - 2 * Math.PI : nextHours);
        this.minutes = (nextMinutes > 2 * Math.PI ? nextMinutes - 2 * Math.PI : nextMinutes);

        return true;
    }

    draw(ctx : CanvasRenderingContext2D, x : number, y : number, r : number) {
        let changed = this.moveArrows();
        if (!changed) {
            return;
        }
        ctx.beginPath();
        ctx.clearRect(x - r - 1, y - r - 1, 2 * (r + 1), 2 * (r + 1));

        ctx.lineWidth = 1;

        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 2;

        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.sin(this.hours) * r * this.HRS_ARROW_LEN,
            y - Math.cos(this.hours) * r * this.HRS_ARROW_LEN);
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.sin(this.minutes) * r * this.MINS_ARROW_LEN,
            y - Math.cos(this.minutes) * r * this.MINS_ARROW_LEN);
        ctx.stroke();
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

class Layout {
    x : number;
    y : number;
    w : number;
    h : number;

    segments : Segment[];

    constructor(x : number, y : number, w : number, h : number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.segments = [];
    }

    redraw(ctx : CanvasRenderingContext2D) {
        for (let segment of this.segments) {
            segment.draw(ctx);
        }
    }

    set(values : number[]) {
        let cur = 0;
        for (let segment of this.segments) {
            if (segment instanceof Digit) {
                segment.setTarget(values[cur]);
                cur += 1;
            } else if (segment instanceof Separator) {
                segment.set();
            } else {
                throw `Unexpected segment type`;
            }
        }

    }
}

class HorizontalLayout extends Layout {
    constructor(x : number, y : number, w : number, h : number) {
        super(x, y, w, h);
        let gap = 5;
        let clockSize = Math.floor(Math.min((w - gap * 27) / 28, (h - gap * 5) / 6));
        let digitW = 3 * (clockSize + gap) + clockSize;
        let digitH = 5 * (clockSize + gap) + clockSize;
        let sepW = 2 * clockSize + gap;
        this.segments.push(
            new Digit(x, y, digitW, digitH, gap, gap),
            new Digit(x + digitW + gap, y, digitW, digitH, gap, gap),
            new Separator(x + 2 * (digitW + gap), y, sepW, digitH, gap, gap),
            new Digit(x + 2 * (digitW + gap) + sepW + gap, y, digitW, digitH, gap, gap),
            new Digit(x + 3 * (digitW + gap) + sepW + gap, y, digitW, digitH, gap, gap),
            new Separator(x + 4 * (digitW + gap) + sepW + gap, y, sepW, digitH, gap, gap),
            new Digit(x + 4 * (digitW + gap) + 2 * (sepW + gap), y, digitW, digitH, gap, gap),
            new Digit(x + 5 * (digitW + gap) + 2 * (sepW + gap), y, digitW, digitH, gap, gap)
        )
    }
}

class VerticalLayout extends Layout {
    constructor(x : number, y : number, w : number, h : number) {
        super(x, y, w, h);
        let gap = 5;
        let clockSize = Math.floor(Math.min((w - gap * 7) / 8, (h - gap * 17) / 18));
        let digitW = 3 * (clockSize + gap) + clockSize;
        let digitH = 5 * (clockSize + gap) + clockSize;
        this.segments.push(
            new Digit(x, y, digitW, digitH, gap, gap),
            new Digit(x + digitW + gap, y, digitW, digitH, gap, gap),
            new Digit(x, y + digitH + gap, digitW, digitH, gap, gap),
            new Digit(x + digitW + gap, y + digitH + gap, digitW, digitH, gap, gap),
            new Digit(x, y + 2 * (digitH + gap), digitW, digitH, gap, gap),
            new Digit(x + digitW + gap, y + 2 * (digitH + gap), digitW, digitH, gap, gap)
        )
    }
}