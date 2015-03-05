;
skyshares.geometry = {
	//
	//
	//
	DEG_TO_RAD : (Math.PI/180.0),
	RAD_TO_DEG : (180.0/Math.PI),
	//
	//
	//
	vec2 : function( x, y ) {
		return new Vec2( x, y );
	},
	//
	//
	//
	bezier : function( cp ) {
		return new Bezier( cp );
	},
    spline : function(points) {
    	return new MonotonicCubicSpline(points);
    }
};

function Vec2( x, y ) {
	this.x = x || 0.0;
	this.y = y || 0.0;
}
//
//
//
Vec2.prototype.set = function( x, y ) {
	this.x = x;
	this.y = y;
	return this;
}
//
// Check similarity/equality.
//
 Vec2.prototype.match = function(  vec, tolerance )  {
	return (Math.abs(this.x - vec.x) < tolerance) && (Math.abs(this.y - vec.y) < tolerance);
}
//
// Checks if vectors look in the same direction.
// Tolerance is specified in degree.
//
 Vec2.prototype.isAlignedt = function(  vec, tolerance )  { 
	return  Math.abs( this.angle( vec ) ) < tolerance;
}
 Vec2.prototype.alignt = function(  vec, tolerance )  {
    return this.isAligned( vec, tolerance );
}

Vec2.prototype.isAlignedRadt = function( vec, tolerance )  {
	return  Math.abs( this.angleRad( vec ) ) < tolerance;
}
 Vec2.prototype.alignRadt = function( vec, tolerance )  {
    return this.isAlignedRad( vec, tolerance );
}
//
// Overloading for any type to any type
//
Vec2.prototype.add = function( other )  {
	this.x += isNaN( other ) ? other.x : other;
	this.y += isNaN( other ) ? other.y : other;
	return this;
}
Vec2.prototype.subtract = function( other )  {
	this.x -= isNaN( other ) ? other.x : other;
	this.y -= isNaN( other ) ? other.y : other;
	return this;
}
Vec2.prototype.multiply = function( other ) {
	this.x *= isNaN( other ) ? other.x : other;
	this.y *= isNaN( other ) ? other.y : other;
	return this;
}

 Vec2.prototype.divide = function( other ) {
	vec.x!=0 ? this.x/=vec.x : x;
	vec.y!=0 ? this.y/=vec.y : y;
	return this;
}
//
// scale
//
Vec2.prototype.rescaled = function( length )  {
	return this.getScaled(length);
}
Vec2.prototype.getScaled = function( length )  {
	var l = Math.sqrt(this.x*this.x + this.y*this.y);
	if( l > 0 )
		return new Vec2( (this.x/l)*length, (this.y/l)*length );
	else
		return new Vec2();
}
Vec2.prototype.rescale = function( length ){
	return this.scale(length);
}
Vec2.prototype.scale = function( length ) {
	var l = Math.sqrt(this.x*this.x + this.y*this.y);
	if (l > 0) {
		this.x = (this.x/l)*length;
		this.y = (this.y/l)*length;
	}
	return this;
}
//
// Rotation
//
 Vec2.prototype.rotated = function( angle )  {
	return this.getRotated(angle);
}

Vec2.prototype.getRotated = function( angle )  {
	var a = (angle*skyshares.geometry.DEG_TO_RAD);
	return new Vec2( this.x*Math.cos(a) - this.y*Math.sin(a),
				   this.x*Math.sin(a) + this.y*Math.cos(a) );
}

 Vec2.prototype.getRotatedRad = function( angle )  {
	var a = angle;
	return new Vec2( this.x*cos(a) - this.y*sin(a),
				   this.x*sin(a) + this.y*cos(a) );
}

 Vec2.prototype.rotate = function( angle ) {
	var a = (angle * skyshares.geometry.DEG_TO_RAD);
	var xrot = this.x*Math.cos(a) - this.y*sin(a);
	this.y = this.x*sin(a) + this.y*cos(a);
	this.x = xrot;
	return this;
}

 Vec2.prototype.rotateRad = function( angle ) {
	var a = angle;
	var xrot = this.x*Math.cos(a) - this.y*Math.sin(a);
	this.y = this.x*Math.sin(a) + this.y*Math.cos(a);
	this.x = xrot;
	return this;
}
//
// Rotate point by angle (deg) around pivot point.
//
Vec2.prototype.rotated = function( angle, pivot )  {
	return this.getRotated(angle, pivot);
}

 Vec2.prototype.getRotated = function( angle, pivot )  {
	var a = (angle * skyshares.geometry.DEG_TO_RAD);
	return new Vec2( ((this.x-pivot.x)*Math.cos(a) - (this.y-pivot.y)*Math.sin(a)) + pivot.x,
				   ((this.x-pivot.x)*Math.sin(a) + (this.y-pivot.y)*Math.cos(a)) + pivot.y );
}

 Vec2.prototype.rotate = function( angle, pivot ) {
	var a = (angle * skyshares.geometry.DEG_TO_RAD);
	var xrot = ((this.x-pivot.x)*Math.cos(a) - (this.y-pivot.y)*Math.sin(a)) + pivot.x;
	this.y = ((this.x-pivot.x)*Math.sin(a) + (this.y-pivot.y)*Math.cos(a)) + pivot.y;
	this.x = xrot;
	return this;
}

 Vec2.prototype.getRotatedRad = function( angle, pivot )  {
	var a = angle;
	return new Vec2( ((this.x-pivot.x)*Math.cos(a) - (this.y-pivot.y)*Math.sin(a)) + pivot.x,
				   ((this.x-pivot.x)*Math.sin(a) + (this.y-pivot.y)*Math.cos(a)) + pivot.y );
}

 Vec2.prototype.rotateRad = function( angle, pivot ) {
	var a = angle;
	var xrot = ((this.x-pivot.x)*Math.cos(a) - (this.y-pivot.y)*Math.sin(a)) + pivot.x;
	this.y = ((this.x-pivot.x)*Math.sin(a) + (this.y-pivot.y)*Math.cos(a)) + pivot.y;
	this.x = xrot;
	return this;
}
//
// Map point to coordinate system defined by origin, vx, and vy.
//
 Vec2.prototype.mapped = function( origin, vx, vy ) {
	return this.getMapped(origin, vx, vy);
}

Vec2.prototype.getMapped = function( origin, vx, vy ) {
	return new Vec2( origin.x + this.x*vx.x + this.y*vy.x, origin.y + this.x*vx.y + this.y*vy.y );
}
Vec2.prototype.map = function( origin, vx, vy ) {
	var xmap = origin.x + this.x*vx.x + this.y*vy.x;
	this.y = origin.y + this.x*vx.y + this.y*vy.y;
	this.x = xmap;
	return this;
}

//
// Distance between two points.
//
Vec2.prototype.distance = function(pnt)  {
	var vx = this.x-pnt.x;
	var vy = this.y-pnt.y;
	return Math.sqrt(vx*vx + vy*vy);
}
Vec2.prototype.distanceSquared = function( pnt )  {
	return this.squareDistance(pnt);
}

Vec2.prototype.squareDistance = function( pnt )  {
	var vx = this.x-pnt.x;
	var vy = this.y-pnt.y;
	return vx*vx + vy*vy;
}
//
// Linear interpolation.
//
//
/**
 * p==0.0 results in this point, p==0.5 results in the
 * midpoint, and p==1.0 results in pnt being returned.
 */
Vec2.prototype.interpolated = function( pnt, p ) {
	return this.getInterpolated(pnt, p);
}

Vec2.prototype.getInterpolated = function( pnt, p )  {
	return new Vec2( this.x*(1-p) + pnt.x*p, this.y*(1-p) + pnt.y*p );
}

Vec2.prototype.interpolate = function( pnt, p ) {
	this.x = this.x*(1-p) + pnt.x*p;
	this.y = this.y*(1-p) + pnt.y*p;
	return this;
}

Vec2.prototype.middled = function( pnt ) {
	return this.getMiddle(pnt);
}

Vec2.prototype.getMiddle = function( pnt )  {
	return new Vec2( (this.x+pnt.x)/2.0, (this.y+pnt.y)/2.0 );
}

Vec2.prototype.middle = function( pnt ) {
	this.x = (this.x+pnt.x)/2.0;
	this.y = (this.y+pnt.y)/2.0;
	return this;
}
//
// Average (centroid) among points.
//
Vec2.prototype.average = function( points ) {
	this.x = 0.0;
	this.y = 0.0;
	var num = points.length;
	for( var i=0; i<num; i++) {
		this.x += points[i].x;
		this.y += points[i].y;
	}
	this.x /= num;
	this.y /= num;
	return this;
}
//
// Normalization
//
Vec2.prototype.normalized = function()  {
	return this.getNormalized();
}

Vec2.prototype.getNormalized = function()  {
	var length = Math.sqrt(this.x*this.x + this.y*this.y);
	if( length > 0 ) {
		return new Vec2( this.x/length, this.y/length );
	} else {
		return new Vec2();
	}
}

Vec2.prototype.normalize = function()  {
	var length = Math.sqrt(this.x*this.x + this.y*this.y);
	if( length > 0 ) {
		this.x /= length;
		this.y /= length;
	}
	return this;
}
//
// Limit length.
//
 Vec2.prototype.limited = function( max) {
	return this.getLimited(max);
}

 Vec2.prototype.getLimited = function( max)  {
    var limited;
    var lengthSquared = (this.x*this.x + this.y*this.y);
    if( lengthSquared > max*max && lengthSquared > 0 ) {
        var ratio = max/Math.sqrt(lengthSquared);
        limited.set( this.x*ratio, this.y*ratio);
    } else {
        limited.set(this.x,this.y);
    }
    return limited;
}
Vec2.prototype.limit = function( max) {
    var lengthSquared = (this.x*this.x + this.y*this.y);
    if( lengthSquared > max*max && lengthSquared > 0 ) {
        var ratio = max/Math.sqrt(lengthSquared);
        this.x *= ratio;
        this.y *= ratio;
    }
    return this;
}
//
// Perpendicular normalized vector.
//
Vec2.prototype.perpendiculared = function()  {
	return getPerpendicular();
}
Vec2.prototype.getPerpendicular = function()  {
	var length = Math.sqrt(this.x*this.x + this.y*this.y);
	if( length > 0 )
		return new Vec2( -(this.y/length), this.x/length );
	else
		return new Vec2();
}
Vec2.prototype.perpendicular = function() {
	var length = Math.sqrt(this.x*this.x + this.y*this.y);
	if( length > 0 ) {
		var _x = this.x;
		this.x = -(this.y/length);
		this.y = _x/length;
	}
	return this;
}
//
// Length
//
Vec2.prototype.length = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
}

Vec2.prototype.lengthSquared = function() {
	return (this.x*this.x + this.y*this.y);
}
//
// Angle (deg) between two vectors.
// This is a signed relative angle between -180 and 180.
//
Vec2.prototype.angle = function( vec )  {
	return (Math.atan2( this.x*vec.y-this.y*vec.x, this.x*vec.x + this.y*vec.y )*skyshares.geometry.RAD_TO_DEG);
}

Vec2.prototype.bearing = function( vec )  {
	var a = Math.atan2( vec.y - this.y, vec.x - this.x )*skyshares.geometry.RAD_TO_DEG;
	if ( vec.y < this.y ) a += 360.0;
	return a;
}
//
// Angle (deg) between two vectors.
// This is a signed relative angle between -180 and 180.
//
Vec2.prototype.angleRad = function( vec )  {
	return Math.atan2( this.x*vec.y-this.y*vec.x, this.x*vec.x + this.y*vec.y );
}
//
// Dot Product.
//
Vec2.prototype.dot = function( vec )  {
	return this.x*vec.x + this.y*vec.y;
}

function Bezier( cp ) {
	this.control_points = cp;
	this.n_points = cp.length - 1;
	this.calculateCoefficients();
}
//
// interpolate along line
//
Bezier.prototype.computePoint = function(u) {
	//
	// get coordinates
	//
	var pt = { x: 0.0, y: 0.0 };
	for(var k = 0; k <= this.n_points; k++) {
		var b = this.blendingValue(u, k);
		pt.x += (this.control_points[ k ].x * b);
		pt.y += (this.control_points[ k ].y * b);
	}
	return pt;
}

Bezier.prototype.YFromX = function(x,clamp) { // this assumes the curve moves left to right, TODO: generalise
	if ( x > this.control_points[ this.n_points ].x ) { // extrapolate beyond end of line
		var slope = ( this.control_points[ this.n_points ].y - this.control_points[ this.n_points - 1].y ) /
        ( this.control_points[ this.n_points ].x - this.control_points[ this.n_points - 1].x );
		return this.control_points[ this.n_points ].y + ( slope * ( x - this.control_points[ this.n_points ].x ) );
	} else { // interpolate
		var p0 = -1;
		var p1 = -1;
		for ( var i = 0; i < this.n_points; i++ ) {
			if ( x >= this.control_points[ i ].x && x <= this.control_points[ i+1 ].x ) {
				p0 = i; p1 = i +1;
				break;
			}
		}
		return this.control_points[ p0 ].y +
        ( this.control_points[ p1 ].y - this.control_points[ p0 ].y ) *
        ( ( x - this.control_points[ p0 ].x ) / ( this.control_points[ p1 ].x - this.control_points[ p0 ].x ) );
	}
}

Bezier.prototype.calculateCoefficients = function() {
	var k, j;
	//
	// allocate array
	//
	this.coefficient = [];
	this.coefficient.length = ( this.n_points + 1 );
	//
	// calculate coefficients
	//
	for (k = 0; k <= this.n_points; k++) {
		this.coefficient[ k ] = 1.0;
		for(j = this.n_points; j >= (k + 1); j--) this.coefficient[k] *= j;
		for(j = (this.n_points - k); j >= 2; j--) this.coefficient[k] /= j;
	}
}

Bezier.prototype.blendingValue = function( u, k ) {
	var bv = this.coefficient[k]; // compute m_coefficient[k] * (u to kth power) * ((1-u) to (n-k) power)
	if ( u >= 1.0 ) {
		u = 1.0; // ????
	}
	var j;
	for( j = 1; j <= k; j++) bv *= u;
	for( j = 1; j <= (this.n_points - k); j++)	bv *= (1.0 - u);
	return bv;
}

function MonotonicCubicSpline(points) {
    var alpha, beta, delta, dist, i, m, n, tau, to_fix, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
    n = points.length;
    delta = [];
    m = [];
    alpha = [];
    beta = [];
    dist = [];
    tau = [];
    for (i = 0, _ref = n - 1; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        delta[i] = (points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
        if (i > 0) {
            m[i] = (delta[i - 1] + delta[i]) / 2;
        }
    }
    m[0] = delta[0];
    m[n - 1] = delta[n - 2];
    to_fix = [];
    for (i = 0, _ref2 = n - 1; (0 <= _ref2 ? i < _ref2 : i > _ref2); (0 <= _ref2 ? i += 1 : i -= 1)) {
        if (delta[i] === 0) {
            to_fix.push(i);
        }
    }
    for (_i = 0, _len = to_fix.length; _i < _len; _i++) {
        i = to_fix[_i];
        m[i] = m[i + 1] = 0;
    }
    for (i = 0, _ref3 = n - 1; (0 <= _ref3 ? i < _ref3 : i > _ref3); (0 <= _ref3 ? i += 1 : i -= 1)) {
        alpha[i] = m[i] / delta[i];
        beta[i] = m[i + 1] / delta[i];
        dist[i] = Math.pow(alpha[i], 2) + Math.pow(beta[i], 2);
        tau[i] = 3 / Math.sqrt(dist[i]);
    }
    to_fix = [];
    for (i = 0, _ref4 = n - 1; (0 <= _ref4 ? i < _ref4 : i > _ref4); (0 <= _ref4 ? i += 1 : i -= 1)) {
        if (dist[i] > 9) {
            to_fix.push(i);
        }
    }
    for (_j = 0, _len2 = to_fix.length; _j < _len2; _j++) {
        i = to_fix[_j];
        m[i] = tau[i] * alpha[i] * delta[i];
        m[i + 1] = tau[i] * beta[i] * delta[i];
    }
    this.points = points.slice(0, n);
    this.n_points = this.points.length;
    this.m = m;
}

MonotonicCubicSpline.prototype.interpolate = function(x) {
	if ( x < this.points[ 0 ].x ) { // needs validating
		var slope = ( this.points[ 0 ].y - this.points[ 1 ].y ) /
        ( this.points[ 0 ].x - this.points[ 1 ].x );
		return this.points[ this.n_points - 1 ].y + ( slope * ( this.points[ this.n_points - 1 ].x - x ) ); 
	} else if ( x > this.points[ this.n_points - 1 ].x ) {
		var slope = ( this.points[ this.n_points - 1 ].y - this.points[ this.n_points - 2].y ) /
        ( this.points[ this.n_points - 1 ].x - this.points[ this.n_points - 2 ].x );
		return this.points[ this.n_points - 1 ].y + ( slope * ( x - this.points[ this.n_points - 1 ].x ) );
	}
    var h, h00, h01, h10, h11, i, t, t2, t3, y, _ref;
    for (i = _ref = this.points.length - 2; (_ref <= 0 ? i <= 0 : i >= 0); (_ref <= 0 ? i += 1 : i -= 1)) {
        if (this.points[i].x <= x) {
            break;
        }
    }
    h = this.points[i + 1].x - this.points[i].x;
    t = (x - this.points[i].x) / h;
    t2 = Math.pow(t, 2);
    t3 = Math.pow(t, 3);
    h00 = 2 * t3 - 3 * t2 + 1;
    h10 = t3 - 2 * t2 + t;
    h01 = -2 * t3 + 3 * t2;
    h11 = t3 - t2;
    y = h00 * this.points[i].y + h10 * h * this.m[i] + h01 * this.points[i + 1].y + h11 * h * this.m[i + 1];
    return y;
}
