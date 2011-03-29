
// 3x3 matrix (similar to glmatrix)
var mat3 = {
    create: function(mat) {
        var dest = new Float32Array(9);
        if (mat) {
            mat3.set(mat, dest);
        }
        return dest;
    },
    
    set: function(src, dest) {
        dest[0] = src[0];
        dest[1] = src[1];
        dest[2] = src[2];
        dest[3] = src[3];
        dest[4] = src[4];
        dest[5] = src[5];
        dest[6] = src[6];
        dest[7] = src[7];
        dest[8] = src[8];
        dest[9] = src[9];
        return dest;
    },
    
    identity: function(dest) {
        dest[0] = 1;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        dest[4] = 1;
        dest[5] = 0;
        dest[6] = 0;
        dest[7] = 0;
        dest[8] = 1;
    },
    
    ortho2D: function (dest, xmin, xmax, ymin, ymax) {
        var xlength = xmax - xmin;
        var ylength = ymax - ymin;
        dest[0] = 2 / xlength;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        dest[4] = 2 / ylength;
        dest[5] = 0;
        dest[6] = -(xmin + xmax) / xlength;
        dest[7] = -(ymin + ymax) / ylength;
        dest[8] = 1;
    },
    
    rotate: function (mat, angle) {
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        var v00 = mat[0], v01 = mat[1], v02 = mat[2];
        var v10 = mat[3], v11 = mat[4], v12 = mat[5];
        // first row
        mat[0] = c*v00 + s*v10;
        mat[1] = c*v01 + s*v11;
        mat[2] = c*v02 + s*v12;
        // second row
        mat[3] = c*v10 - s*v00;
        mat[4] = c*v11 - s*v01;
        mat[5] = c*v12 - s*v02;
    },
    
    translate: function (mat, x, y) {
        // row2 += x*row0 + y*row1
        mat[6] += x*mat[0] + y*mat[3];
        mat[7] += x*mat[1] + y*mat[4];
        mat[8] += x*mat[2] + y*mat[5];
    },
    
    scale: function (mat, x, y) {
        mat[0] *= x;
        mat[1] *= x;
        mat[2] *= x;
        mat[3] *= y;
        mat[4] *= y;
        mat[5] *= y;
    }
};

