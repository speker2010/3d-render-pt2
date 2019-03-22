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

    function clearCanvas() {
        canvasBuffer = CTX.createImageData(width, height);
    }

    function putPixel(x, y, color) {
        if (typeof y === 'undefined') {
            debugger;
        }
        x = horizontalCenter + Math.floor(x);
        y = verticalCenter - Math.floor(y);        
        
        let offset = 4 * x + canvasPitch * y;
        canvasBuffer.data[offset++] = color[0];
        canvasBuffer.data[offset++] = color[1];
        canvasBuffer.data[offset++] = color[2];
        canvasBuffer.data[offset++] = (color[3]) ? color[3] : 255;        
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
    
    function stringToMatrix(string) {
        return string.split("\n").map((line) => {
            return line.split(' ').map((elem) => {                
                return Number(elem)
            });
        });
    }

    function matrixE() {
        return stringToMatrix(
            `1 0 0 0\n` +
            `0 1 0 0\n` +
            `0 0 1 0\n` +
            `0 0 0 1`
        );
    }

    function gradToRadDecorator(callback) {
        let koef = (Math.PI / 180);
        return (angle) => {
            let rad = angle * koef;
            return +callback(rad).toFixed(9);
        }
    }

    let cos = gradToRadDecorator((angle) => {
        return Math.cos(angle);
    });    

    let sin = gradToRadDecorator((angle) => {
        return Math.sin(angle);
    });

    function rotate(horizontal, vertical, rotate) {
        const COS_R = cos(rotate);
        const COS_H = cos(horizontal);
        const COS_V = cos(vertical);
        const SIN_R = sin(rotate);
        const SIN_H = sin(horizontal);
        const SIN_V = sin(vertical);

        let a11 = COS_R * COS_H + SIN_R * SIN_V * SIN_H;
        let a21 = SIN_R * COS_H - COS_R * SIN_V * SIN_H;
        let a31 = COS_V * SIN_H;
        let a12 = -SIN_R * COS_V;
        let a22 = COS_R * COS_V;
        let a32 = SIN_V;
        let a13 = SIN_R * SIN_V * COS_H - COS_R * SIN_H;
        let a23 = - SIN_R * SIN_H - COS_R * SIN_V * COS_H;
        let a33 = COS_V * COS_H;
        return stringToMatrix(
            `${a11} ${a12} ${a13} 0\n` +
            `${a21} ${a22} ${a23} 0\n` +
            `${a31} ${a32} ${a33} 0\n` +
            `0 0 0 1`
        );
        // horizontal > 0. y in face, z and x with watch's arrow || horizontal < 0. y in face, z and x without watch's arrow 
        // vertical > 0. x in face, z and y with watch's arrow || vertical < 0 x in face, z and y whitout watch's arrow
        // rotate > 0 z from face, y and x with watch's arrow || rotate < 0 z from face, y and x whithout watch's arrow
    }

    function rotateInvert(horizontal, vertical, rotate) {        
        const COS_R = cos(rotate);
        const COS_H = cos(horizontal);
        const COS_V = cos(vertical);
        const SIN_R = sin(rotate);
        const SIN_H = sin(horizontal);
        const SIN_V = sin(vertical);

        let a11 = COS_R * COS_H - SIN_R * SIN_V * SIN_H;
        let a21 = -SIN_R * COS_H - COS_R * SIN_V * SIN_H;
        let a31 = -COS_V * SIN_H;
        let a12 = SIN_R * COS_V;
        let a22 = COS_R * COS_V;
        let a32 = -SIN_V;
        let a13 = SIN_R * SIN_V * COS_H - COS_R * SIN_H;
        let a23 = - SIN_R * SIN_H + COS_R * SIN_V * COS_H;
        let a33 = COS_V * COS_H;
        return stringToMatrix(
            `${a11} ${a12} ${a13} 0\n` +
            `${a21} ${a22} ${a23} 0\n` +
            `${a31} ${a32} ${a33} 0\n` +
            `0 0 0 1`
        );
    }

    function transition(x, y, z) {
        return stringToMatrix(
            `1 0 0 ${x}\n` + 
            `0 1 0 ${y}\n` + 
            `0 0 1 ${z}\n` +
            `0 0 0 1`
        );
    }

    function transitionInvert(x, y, z) {           
        let result = stringToMatrix(            
            `1 0 0 ${x}\n` + 
            `0 1 0 ${y}\n` + 
            `0 0 1 ${z}\n` +
            `0 0 0 1`
        );        
        return result;
    }

    function scale(x, y, z) {
        return stringToMatrix(
            `${x} 0 0 0\n` +
            `0 ${y} 0 0\n` +
            `0 0 ${z} 0\n` +
            `0 0 0 1`
        );
    }
    

    function renderTriangle(triangle, vertexes, color) {
        let p0 = triangle[0];
        let p1 = triangle[1];
        let p2 = triangle[2];

        drawWireframeTriangle(vertexes[p0], vertexes[p1], vertexes[p2], triangle[3]);
    }

    function transformVertex(vertex, transform) {        
        let result = vertex;
        result.push(1);
        result = vectorToMatrix(result);
        result = multiMatrix(transform, result);
        result = matrixToVector(result);
        result.pop();
        if (vertex.length === 4) {
            vertex.pop();
        }        
        return result;     
    }

    function rotateTransform(vertex, transformMatrix) {
        let result = vectorToMatrix(vertex);
        result = multiMatrix(transformMatrix, result);
        return matrixToVector(result);        
    }

    function renderInstance(instance, transform) {        
        let projected = {};
        let model = instance.model;
        Object.keys(model.vertexes).forEach((vertex) => {            
            let position = instance.model.vertexes[vertex];
            let newPosition = transformVertex(position, transform);            
            projected[vertex] = projectVertex(ptz(...newPosition));
        });
        model.triangles.forEach((triangle) => {            
            renderTriangle(triangle, projected);
        });        
    }

    function makeCameraMatrix(position, rotate) {        
        let matrixPosition = transitionInvert(...position);
        return multiMatrix(matrixPosition, rotate);
    }

    function makeInstanceMatrix(instance) {
        let result = stringToMatrix(
            `1 0 0 0\n` +
            `0 1 0 0\n` +
            `0 0 1 0\n` +
            `0 0 0 1`
        );
        if (instance.transform.scale) {
            let matrixScale = scale(...instance.transform.scale);
            result = multiMatrix(result, matrixScale);
        }
        if (instance.transform.position) {
            let matrixPosition = transition(...instance.transform.position);
            result = multiMatrix(result, matrixPosition);
        }
        if (instance.transform.rotate) {
            result = multiMatrix(result, instance.transform.rotate);
        }        
        return result;        
    }

    function renderScene() {
        let cameraMatrix = makeCameraMatrix(camera.position, camera.rotate);
        scene.instances.forEach((instance) => {
            let instanceMatrix = makeInstanceMatrix(instance);
            let transform = multiMatrix(cameraMatrix, instanceMatrix);            
            renderInstance(instance, transform);
        });
        CTX.putImageData(canvasBuffer, 0, 0);
    }

    
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
            ['a', 'b', 'c', RED],
            ['a', 'c', 'd', GREEN],
            ['e', 'f', 'g', BLUE],
            ['e', 'h', 'g', RED],
            ['d', 'f', 'g', BLUE],
            ['d', 'a', 'g', GREEN],
            ['a', 'h', 'g', RED],
            ['a', 'b', 'h', GREEN],
            ['c', 'b', 'h', RED],
            ['c', 'e', 'h', BLUE],
            ['c', 'd', 'e', RED],
            ['d', 'f', 'e', GREEN]
        ]
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
    let canvasBuffer = CTX.createImageData(width, height);
    let canvasPitch = canvasBuffer.width*4;
    
    horizontalAngle = 0;
    verticalAngle = 0;

    let build1 = {
        model: CUBE,
        transform: {
            position: [-2, 2, -40],
            rotate: rotate(horizontalAngle, verticalAngle, 0)
        }
    };

    let build2 = {
        model: CUBE,
        transform: {
            position: [0, 0, -40],
            rotate: rotate(horizontalAngle, verticalAngle, 0)            
        }
    };

    let scene = {
        instances: [,
            build1,
            build2
        ],
        transform: {
            rotate: rotateInvert(0, 0, 0)
        }
    };

    let cameraHorizontalAngle = 0;
    let cameraVerticalAngle = 0;
    let cameraRotateAngle = 0; 

    let camera = {
        position: [0, 0, 0],
        rotate: rotateInvert(cameraHorizontalAngle, cameraVerticalAngle, cameraRotateAngle)
    }

    renderScene();

    window.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'w':
                camera.position[2]++;
                break;
            case 's':
                camera.position[2]--;
                break;
            case 'a':
                camera.position[0]--;
                break;
            case 'd':
                camera.position[0]++;
                break;
            case 'z':
                cameraHorizontalAngle++;
                break;
            case 'x':
                cameraVerticalAngle++;
                break;
            case 'c':
                cameraRotateAngle++;
                break;            
        }
        console.log(e.key);
    });

    let loop = (time) => {
        clearCanvas();
        renderScene();
        horizontalAngle += 1;
        verticalAngle += 1;
        build2.transform.rotate = rotate(horizontalAngle, verticalAngle, 0);
        build1.transform.rotate = rotate(-horizontalAngle, verticalAngle, 0);      
        camera.rotate = rotateInvert(cameraHorizontalAngle, cameraVerticalAngle, cameraRotateAngle);
        requestAnimationFrame(loop);
    }

    let requestId = requestAnimationFrame(loop);


    //drawWireframeTriangle(pt(-100, -100), pt(100, -100), pt(75, 50), [0, 0, 0]);
    //drawFilledTriangle(pt(-100, -100), pt(80, -90), pt(75, 50), [0, 150, 0]);
    

    //drawAxis();
})()

function add3(p0, p1) {
    return [
        p0[0] + +p1[0],
        p0[1] + +p1[1],
        p0[2] + +p1[2]
    ];
}

function multiMatrix(matrix0, matrix1) {
    if (!isMatrix(matrix0) && !isMatrix(matrix1)) {
        throw new Error('Оба элементы должны быть матрицами');
    }
    const HEIGHT_0 = matrix0.length;
    const HEIGHT_1 = matrix1.length;
    const WIDTH_0 = matrix0[0].length;
    const WIDTH_1 = matrix1[0].length;
    
    if (WIDTH_0 !== HEIGHT_1) {
        throw new Error('Такие матрицы нельзя умножить');
    }
    let result = [];
    for (let i = 0; i < HEIGHT_0; i++) {
        result[i] = new Array(WIDTH_1);
    }
    
    
    for (let i = 0; i < HEIGHT_0; i++) {        
        for (let j = 0; j < WIDTH_1; j++) {
            let cell = 0;
            matrix0[i].forEach((cell0, index) => {
                cell += cell0 * matrix1[index][j];
            });
            result[i][j] = cell;
        }
    }    
    return result;    
}

function vectorToMatrix(vector) {
    return vector.map((cell) => {
        return [cell];
    });
}

function matrixToVector(matrix) {
    return matrix.map((cell) => {
        return cell[0];
    });
}

function isMatrix(matrix) {    
    if (!Array.isArray(matrix)) return false;
    if (!Array.isArray(matrix[0])) return false;
    if (typeof matrix[0][0] !== 'number') return false;
    return true;
}
