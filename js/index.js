(() => {
    const CANVAS = document.querySelector('canvas');
    const CTX = CANVAS.getContext('2d');
    console.log(window.innerWidth, window.innerHeight);
    let width = window.innerWidth - 4;
    let height = window.innerHeight - 4;
    CANVAS.width = width;
    CANVAS.height = height;    

    drawLine(pt(240, 120), pt(-200, -100), [0, 0, 0]);
    drawLine(pt(-50, -200), pt(60, 240), [0, 0, 0]);


    function pt(x, y) {
        return {
            x: x,
            y: y
        };
    }

    function putPixel(x, y, color) {
        let pixel = CTX.createImageData(1, 1);
        pixel.data[0] = color[0];
        pixel.data[1] = color[1];
        pixel.data[2] = color[2];
        pixel.data[3] = (color[3]) ? color[3] : 255;
        CTX.putImageData(pixel, x, y);
    }

    function interpolate(i0, d0, i1, d1) {
        if (i0 === i1) {
            return [d0];
        }
        let values = [];
        let a = (d1 - d0) / (i1 - i0);
        let d = d0;
        for (var i = i0; i <= i1; i++) {
            values.push(d);
            d = d + a;
        }
        return values;
    }
    function drawLine(p0, p1, color) {
        let x1 = p1.x;
        let x0 = p0.x;
        let y1 = p1.y;
        let y0 = p0.y;
        if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) {
            if (x0 > x1) {
                let pSwap = p0;
                p0 = p1;
                p1 = pSwap;                
            }
            let ys = interpolate(p0.x, p0.y, p1.x, p1.y);
            for (var i = p0.x; i <= p1.x; i++) {
                putPixel(i, ys[i - p0.x], color);
            }
        } else {
            if (y0 > y1) {
                swap(p0, p1);
                let pSwap = p0;
                p0 = p1;
                p1 = pSwap;
            }
            let xs = interpolate(p0.y, p0.x, p1.y, p1.x);
            for (var i = p0.y; i <= p1.y; i++) {
                putPixel(xs[i - p0.y], i, color);
            }
        }
    }
})()