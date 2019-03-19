(() => {
    function pt(x, y) {
        
        return {
            x: x,
            y: y
        };
    }

    let pth = (x, y, h) => {
        let coords = pt(x, y);
        coords.h = h;
        return coords;
    }

    let ptz = (x, y, z) => {
        let coords = pt(x, y);
        coords.z = z;
        return coords;
    }

    function putPixel(x, y, color) {
        if (typeof y === 'undefined') {
            debugger;
        }
        x = horizontalCenter + +x;
        y = verticalCenter - y;        
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
        console.log('line', p0, p1);
        console.log(width, height);
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
                putPixel(i, ys[Math.round(i - p0.x)], color);
            }
        } else {
            if (y0 > y1) {                
                let pSwap = p0;
                p0 = p1;
                p1 = pSwap;
            }

            let xs = interpolate(p0.y, p0.x, p1.y, p1.x);
            for (var i = p0.y; i <= p1.y; i++) {                
                putPixel(xs[Math.round(i - p0.y)], i, color);
            }
        }
    }

    function drawWireframeTriangle(p0, p1, p2, color) {
        drawLine(p0, p1, color);
        drawLine(p1, p2, color);
        drawLine(p2, p0, color);
    }

    function drawFilledTriangle(p0, p1, p2, color) {
        
        if (p1.y < p0.y) {
            let swap = p1;
            p1 = p0;
            p0 = swap;
        }

        if (p2.y < p0.y) {
            let swap = p0;
            p0 = p2;
            p2 = swap;
        }

        if (p2.y < p1.y) {
            let swap = p1;
            p1 = p2;
            p2 = swap;
        }
        
        let x01 = interpolate(p0.y, p0.x, p1.y, p1.x);
        let x12 = interpolate(p1.y, p1.x, p2.y, p2.x);
        let x02 = interpolate(p0.y, p0.x, p2.y, p2.x);

        x01.pop();
        let x012 = x01.concat(x12);

        let middle = Math.floor(x012.length / 2);
        console.log(middle, 'middle');
        let x_left;
        let x_right;

        if (x02[middle] < x012[middle]) {
            x_left = x02;
            x_right = x012;
        } else {
            x_left = x012;
            x_right = x02;
        }        
        
        for (var y = p0.y; y <= p2.y; y++) {      
            for (var x = x_left[y - p0.y]; x <= x_right[y - p0.y]; x++) {
                
                let coord = pt(x, y);
            
                putPixel(coord.x, coord.y, color);
            }
        }
    }

    function drawShadedTriangle(p0, p1, p2, color) {          
        if (p1.y < p0.y) {
            let swap = p1;
            p1 = p0;
            p0 = swap;
        }

        if (p2.y < p0.y) {
            let swap = p0;
            p0 = p2;
            p2 = swap;
        }

        if (p2.y < p1.y) {
            let swap = p1;
            p1 = p2;
            p2 = swap;
        }
        
        let x01 = interpolate(p0.y, p0.x, p1.y, p1.x);
        let h01 = interpolate(p0.y, p0.h, p1.y, p1.h);

        let x12 = interpolate(p1.y, p1.x, p2.y, p2.x);
        let h12 = interpolate(p1.y, p1.h, p2.y, p2.h);

        let x02 = interpolate(p0.y, p0.x, p2.y, p2.x);
        let h02 = interpolate(p0.y, p0.h, p2.y, p2.h);

        x01.pop();
        let x012 = x01.concat(x12);

        h01.pop();
        let h012 = h01.concat(h12);

        let middle = Math.floor(x012.length / 2);
        console.log(middle, 'middle');
        let x_left;
        let x_right;
        let h_left;
        let h_right;

        if (x02[middle] < x012[middle]) {
            x_left = x02;
            x_right = x012;

            h_left = h02;
            h_right = h012;
        } else {
            x_left = x012;
            x_right = x02;

            h_left = h012;
            h_right = h02;
        }        
        
        for (var y = p0.y; y <= p2.y; y++) {
            let x_l = x_left[y - p0.y] | 0;
            let x_r = x_right[y - p0.y] | 0;

            let h_segment = interpolate(x_l, h_left[y - p0.y], x_r, h_right[y - p0.y]);
            for (var x = x_l; x <= x_r; x++) {
                let shaded_color = color.map((chanel) => {
                    return chanel * h_segment[x - x_l];
                });                         
                putPixel(x, y, shaded_color);
            }
        }
    }

    function drawAxis() {
        const AXIS_COLOR = [200, 0, 0];
        const HALF_DASH_WIDTH = 3;
        drawLine(pt(-horizontalCenter, 0), pt(width, 0), AXIS_COLOR);
        drawLine(pt(0, -verticalCenter), pt(0, height), AXIS_COLOR);
        /*
        for (let i = -horizontalCenter; i < width; i += 10) {
            drawLine(pt(i, HALF_DASH_WIDTH), pt(i, -HALF_DASH_WIDTH), AXIS_COLOR);
        }
        for (let i = -verticalCenter; i < height; i += 10) {
            drawLine(pt(HALF_DASH_WIDTH, i), pt(-HALF_DASH_WIDTH, i), AXIS_COLOR);
        }
        */
    }

    function viewportToCanvas(x, y) {
        return {
            x: x * width / viewWidth,
            y: y * height / viewHeight
        };
    }

    function projectVertex(v) {
        return viewportToCanvas(v.x * d / v.z, v.y * d / v.z);
    }

    function renderTriangle(triangle, vertexes, color) {
        let p0 = triangle[0];
        let p1 = triangle[1];
        let p2 = triangle[2];

        drawWireframeTriangle(vertexes[p0], vertexes[p1], vertexes[p2], color);
    }

    function renderInstance(instance) {
        let projected = {};
        let model = instance.model;
        Object.keys(model.vertexes).forEach((vertex) => {
            let newPosition = add3(
                ptz(...model.vertexes[vertex]),
                ptz(...instance.transform.position)
            );
            projected[vertex] = projectVertex(newPosition);
        });
        model.triangles.forEach((triangle) => {
            renderTriangle(triangle, projected, model.color);
        });        
    }

    function renderScene() {
        scene.instances.forEach((instance) => {
            renderInstance(instance);
        });
    }

    const CANVAS = document.querySelector('canvas');
    const CTX = CANVAS.getContext('2d');
    let size = (window.innerWidth > window.innerHeight) ? window.innerHeight - 4 : window.innerWidth - 4;
    let width = size;
    let height = size;
    let viewWidth = 1;
    let viewHeight = 1;
    let d = 1;
    let horizontalCenter = Math.floor(width / 2);
    let verticalCenter = Math.floor(height / 2);
    CANVAS.width = width;
    CANVAS.height = height;
    
    let vAf = ptz(-2, -0.5, 5);
    let vBf = ptz(-2, 0.5, 5);
    let vCf = ptz(-1, 0.5, 5);
    let vDf = ptz(-1, -0.5, 5);
  
    
    let vAb = ptz(-2, -0.5, 6);
    let vBb = ptz(-2, 0.5, 6);
    let vCb = ptz(-1, 0.5, 6);
    let vDb = ptz(-1, -0.5, 6);

    const BLUE = [0, 0, 255];
    const RED = [255, 0, 0];
    const GREEN = [0, 255, 0];

    const CUBE = {
        vertexes: {
            a: [1, 1, 1],
            b: [1, 1, -1],
            c: [1, -1, -1],
            d: [1, -1, 1],
            e: [-1, -1, -1],
            f: [-1, -1, 1],
            g: [-1, 1, 1],
            h: [-1, 1, -1]
        },
        triangles: [
            ['a', 'b', 'c'],
            ['a', 'c', 'd'],
            ['e', 'f', 'g'],
            ['e', 'h', 'g'],
            ['d', 'f', 'g'],
            ['d', 'a', 'g'],
            ['a', 'h', 'g'],
            ['a', 'b', 'h'],
            ['c', 'b', 'h'],
            ['c', 'e', 'h'],
            ['c', 'd', 'e'],
            ['d', 'f', 'e']
        ],
        color: RED
    }

    let build1 = {
        model: CUBE,
        transform: {
            position: [-2, 2, -10]
        }
    };

    let build2 = {
        model: CUBE,
        transform: {
            position: [1, 0, -20]
        }
    };

    let scene = {
        instances: [
            build1,
            build2
        ]
    };

    renderScene();


    //drawWireframeTriangle(pt(-100, -100), pt(100, -100), pt(75, 50), [0, 0, 0]);
    //drawFilledTriangle(pt(-100, -100), pt(80, -90), pt(75, 50), [0, 150, 0]);
    

    //drawAxis();


    
})()

function add3(p0, p1) {
    return {
        x: p0.x + +p1.x,
        y: p0.y + +p1.y,
        z: p0.z + +p1.z
    };
}