/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir mismunandi útgáfur af síun (filter) í mynsturvörpun.
//     Tvívíður veggur er skilgreindur og varpað á hann mynd sem er
//     lesin inn.  Hægt að snúa spjaldinu og færa til.
//
//    Hjálmtýr Hafsteinsson, mars 2015
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 6;
var numVerticesPole = 24;

var program;

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texture;

var vBuffer;
var vTexCoord;
var tBuffer;
var vPosition;

var image;
var image2;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;
var points = [];

var zDist = -5.0;

var proLoc;
var mvLoc;

// Tveir þríhyrningar sem mynda spjald í z=0 planinu
var vertices = [
    //Flag
    vec4(  0.0,  0.0, 0.0, 1.0 ),
    vec4(  5.0,   0.0, 0.0, 1.0 ),
    vec4(  5.0,   2.5, 0.0, 1.0 ),
    vec4(  5.0,   2.5, 0.0, 1.0 ),
    vec4(  0.0,   2.5, 0.0, 1.0 ),
    vec4(  0.0,   0.0, 0.0, 1.0 )
    //Pole
    /*
    vec4( -1.0,  -1.0, -10.0, 1.0 ),
    vec4(  1.0,  -1.0, -10.0, 1.0 ),
    vec4(  1.0,  -1.0, 0.0, 1.0 ),
    vec4(  1.0,  -1.0, 0.0, 1.0 ),
    vec4( -1.0,  -1.0, 0.0, 1.0 ),
    vec4( -10.0,  -1.0, -10.0, 1.0 )*/
    
];

// Mynsturhnit fyrir spjaldið
var texCoords = [
    vec2(  0.0, 0.0 ),
    vec2( 20.0, 0.0 ),
    vec2( 20.0, 2.0 ),
    vec2( 20.0, 2.0 ),
    vec2(  0.0, 2.0 ),
    vec2(  0.0, 0.0 ),
    vec2(  0.0, 0.0 ),
    vec2( 20.0, 0.0 ),
    vec2( 20.0, 2.0 ),
    vec2( 20.0, 2.0 ),
    vec2(  0.0, 2.0 ),
    vec2(  0.0, 0.0 ),
    vec2(  0.0, 0.0 ),
    vec2( 20.0, 0.0 ),
    vec2( 20.0, 2.0 ),
    vec2( 20.0, 2.0 ),
    vec2(  0.0, 2.0 ),
    vec2(  0.0, 0.0 ),
    vec2(  0.0, 0.0 ),
    vec2( 20.0, 0.0 ),
    vec2( 20.0, 2.0 ),
    vec2( 20.0, 2.0 ),
    vec2(  0.0, 2.0 ),
    vec2(  0.0, 0.0 ),
    vec2(  0.0, 0.0 ),
    vec2( 20.0, 0.0 ),
    vec2( 20.0, 2.0 ),
    vec2( 20.0, 2.0 ),
    vec2(  0.0, 2.0 ),
    vec2(  0.0, 0.0 ),
    vec2(  0.0, 0.0 ),
    vec2( 20.0, 0.0 ),
    vec2( 20.0, 2.0 ),
    vec2( 20.0, 2.0 ),
    vec2(  0.0, 2.0 ),
    vec2(  0.0, 0.0 )
   
];
var FtexCoords =[
    vec2(  0.0, 0.0 ),
    vec2( 20.0, 0.0 ),
    vec2( 20.0, 2.0 ),
    vec2( 20.0, 2.0 ),
    vec2(  0.0, 2.0 ),
    vec2(  0.0, 0.0 )
    ];


function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    //gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
    //gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //

    colorCube();
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
    
    vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    // Seinni leið til að ná í mynd: Ná í úr html-skrá:
    //
    
    image = document.getElementById("texImage");
    image2 = document.getElementById("texImage2");
    configureTexture( image );

    document.getElementById("MagFilter").innerHTML = "gl.NEAREST";
    document.getElementById("MinFilter").innerHTML = "gl.NEAREST";


    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));
    

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.clientX - origX) ) % 360;
            spinX = ( spinX + (origY - e.clientY) ) % 360;
            origX = e.clientX;
            origY = e.clientY;
        }
    } );
    
    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zDist += 0.1;
                break;
            case 40:	// niður ör
                zDist -= 0.1;
                break;
         }
     }  );  

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
     }  );  

    render();
    

}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var verticesTemp = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        vertices.push( verticesTemp[indices[i]] );
    }
}




var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotate( parseFloat(spinX), [1, 0, 0] ) );
    mv = mult( mv, rotate( parseFloat(spinY), [0, 1, 0] ) );

    
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

    configureTexture( image2 );
    gl.drawArrays( gl.TRIANGLES, 0, numVerticesPole);
    configureTexture( image );

    gl.drawArrays( gl.TRIANGLES, numVerticesPole, numVertices);
    
    requestAnimFrame(render);
}