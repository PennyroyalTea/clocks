window.onload = function () {
    let canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    let ctx : CanvasRenderingContext2D = canvas.getContext("2d");

    let clc : Clock = new Clock(2 * Math.PI);
    clc.setTarget(2 * Math.PI, 0.5 * Math.PI);

    setTimeout(() => {
        clc.setTarget(Math.PI, 1.5 * Math.PI);
    }, 1200)

    setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        clc.draw(ctx, 100, 100, 50)
        ctx.stroke();
    }, 50);

}


class Clock {
    hours : number; // 0 .. 2pi
    minutes : number; // 0 .. 2pi

    targetHours : number; // 0 .. 2pi
    targetMinutes : number; // 0 .. 2pi

    rotationSpeed : number; // radian per second
    lastUpdTs : number; // timestamp of last update

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

        let targetHours = (this.targetHours < this.hours ? this.targetHours + 2 * Math.PI : this.targetHours);
        let targetMinutes = (this.targetMinutes < this.minutes ? this.targetMinutes + 2 * Math.PI : this.targetMinutes);

        let nextHours = Math.min(targetHours,  this.hours + this.rotationSpeed * tsDiff / 1000);
        let nextMinutes = Math.min(targetMinutes,  this.minutes + this.rotationSpeed * tsDiff / 1000);

        this.hours = (nextHours > 2 * Math.PI ? nextHours - 2 * Math.PI : nextHours);
        this.minutes = (nextMinutes > 2 * Math.PI ? nextMinutes - 2 * Math.PI : nextMinutes);

        this.lastUpdTs = curTs;
    }

    draw(ctx : CanvasRenderingContext2D, x : number, y : number, r : number) {
        this.moveArrows();

        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(this.hours) * r * 0.75, y - Math.cos(this.hours) * r * 0.75);
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(this.minutes) * r, y - Math.cos(this.minutes) * r)
    }
}

