/**
* @file Nivel Memorama
* @author Fernando Segura Gómez, Twitter: @fsgdev
* @version 0.1
*/

/**
* Clase Memorama
* @class
* @constructor
* @param {integer} WIDTH - El ancho del canvas que se agregara al documento HTML
* @param {integer} HEIGHT - El alto del canvas que se agregara al documento HTML
*/
function Memorama(WIDTH,HEIGHT){
  this.WIDTH_CANVAS=WIDTH;
  this.HEIGHT_CANVAS=HEIGHT;
  calibrar=false;
  calibracion_correcta=false;
  puntos_encontrados=false;
  primera_ejecucion=true;
  document.getElementById("calibrar").addEventListener("click",function(){
    if(!calibrar){
      this.inicioCalibracion();
      calibrar=true;
    }
  }.bind(this))
  this.pos_elegido=0;
}


/**
* @function start
* @summary Permite inicializar todas las dependencias iniciales que ocupara la aplicación, incluyendo las clases para crear elementos,escenarios,planos, y la detección de la webcam
*/
Memorama.prototype.start=function(){
  var Animacion=require('./utils/animacion.js');
  var Escenario=require("./class/escenario.js");
  var WebcamStream=require("./utils/webcamstream.js");
  var DetectorAR=require("./utils/detector_ar");
  this.Elemento=require("./class/elemento.js");
  var Mediador=require("./utils/Mediador.js");
  this.mediador=new Mediador();
  this.webcam=new WebcamStream({"WIDTH":this.WIDTH_CANVAS,"HEIGHT":this.HEIGHT_CANVAS});
  this.renderer=new THREE.WebGLRenderer();
  this.renderer.autoClear = false;
  this.renderer.setSize(this.WIDTH_CANVAS,this.HEIGHT_CANVAS);
  document.getElementById("ra").appendChild(this.renderer.domElement);
  this.detector_ar=DetectorAR(this.webcam.getCanvas());
  this.detector_ar.init();
  this.animacion=new Animacion();
  this.planoEscena=new Escenario();
  this.realidadEscena=new Escenario();
  this.videoEscena=new Escenario();
  this.planoEscena.initCamara(function(){
    this.camara=new THREE.PerspectiveCamera();//THREE.Camera();
    this.camara.near=0.1;
    this.camara.far=2000;
    this.camara.updateProjectionMatrix();
  });
  this.cantidad_cartas=4;
  this.realidadEscena.initCamara();
  this.videoEscena.initCamara();
  this.videoEscena.anadir(this.webcam.getElemento());
  this.detector_ar.setCameraMatrix(this.realidadEscena.getCamara());
}


/**
* @function anadir
* @summary Permite añadir un elemento al escenario visible en el canvas.
* @param {THREE.Object3D} obj - Una instancia de THREE.Object3D a agregar a escena
*/
Memorama.prototype.anadir=function(obj){
  this.planoEscena.anadir(obj);
}

/**
* @function init
* @summary Esta función ejecuta el nivel de Memorama. En la aplicación esta funcion se ejecuta despues de calibrar la cámara.
*/
Memorama.prototype.init=function(){
  this.tipo_memorama="animales";
  var mensaje="Bienvenido al ejercicio Memorama<br>";
  var descripcion="El objetivo de este ejercicio, es tocar los pares de cada carta.<br>No te preocupes si no logras en el primer intento, puedes seguir jugando hasta seleccionar cada uno de los pares<br><br>";
  document.getElementById("informacion_nivel").innerHTML=mensaje+descripcion;
  document.getElementById("informacion_calibrar").style="display:none";
  var avances=document.createElement("id"); // ELIMINAR
  avances.id="avances_memorama"; // ELIMINAR
  document.getElementById("informacion_nivel").appendChild(avances); // ELIMINAR
  this.detectados=[];
  this.objetos=[];
  // CREACION DEL ELEMENTO ACIERTO (LA IMAGEN DE LA ESTRELLA)
  this.indicador_acierto=new this.Elemento(500,500,new THREE.PlaneGeometry(500,500));
  this.indicador_acierto.init();
  this.indicador_acierto.definirSuperficiePorImagen("./assets/img/scale/star.png",this.indicador_acierto);
  this.indicador_acierto.position({x:0,y:0,z:-2500});
  this.anadir(this.indicador_acierto.get());

  // CREACION DEL ELEMENTO ERROR (LA IMAGEN DE LA X)
  this.indicador_error=new this.Elemento(500,500,new THREE.PlaneGeometry(500,500));
  this.indicador_error.init();
  this.indicador_error.definirSuperficiePorImagen("./assets/img/scale/error.png",this.indicador_error);
  this.indicador_error.position({x:0,y:0,z:-2500});
  this.anadir(this.indicador_error.get());

  ///*
  // CREACION DE LAS CARTAS COMO ELEMENTOS
  var cartas={animales:["medusa","ballena","cangrejo","pato"],cocina:["pinzas","refractorio","sarten","rallador"]};
  limite_renglon=Math.floor(this.cantidad_cartas/2)+1;
  for(var i=1,pos_y=-100,fila_pos=i,pos_x=-200;i<=this.cantidad_cartas;i++,pos_y=((i%2!=0) ? pos_y+130 : pos_y) ,fila_pos=((fila_pos>=limite_renglon-1) ? 1 : fila_pos+1),pos_x=(i%2==0 ? 200 : -200)){
    var elemento=new this.Elemento(120,120,new THREE.PlaneGeometry(120,120));
    elemento.init();
    elemento.etiqueta(cartas[this.tipo_memorama][fila_pos-1]);
    elemento.scale(.7,.7);
    elemento.position({x:pos_x,y:pos_y,z:-600});
    //elemento.calculoOrigen();
    this.objetos.push(elemento);
    elemento.definirCaras("./assets/img/memorama/sin_voltear.jpg","./assets/img/memorama/"+this.tipo_memorama+"/cart"+fila_pos+"_"+cartas[this.tipo_memorama][fila_pos-1]+".jpg");
    this.mediador.suscribir("colision",this.objetos[this.objetos.length-1]);
    this.anadir(elemento.get());
    capa_elemento=document.createElement("div");
  }
  //*/


  var mano_obj=new this.Elemento(60,60,new THREE.PlaneGeometry(60,60));
  mano_obj.init();
  mano_obj.definirSuperficiePorImagen("../../assets/img/mano_escala.png",mano_obj);
  this.puntero=new THREE.Object3D();
  this.puntero.add(mano_obj.get());
  this.puntero.position.z=-1;
  this.puntero.matrixAutoUpdate = false;
  this.puntero.visible=false;
  this.anadirMarcador({id:16,callback:this.callbackMemorama,puntero:this.puntero});
  //CREACION DE KATHIA, se utiliza la variable "kathia_renderer" de dist/js/libs/kathia/kathia.js
  document.getElementById("kathia").appendChild(kathia_renderer.view);

  //CREACION DE LA ETIQUETA DONDE SE ESCRIBE LA RESPUESTA DE KATHIA

  iniciarKathia();
  clasificarOpcion("memorama","bienvenida");
  clasificarOpcion("memorama","instrucciones");
}

/**
* @function logicaMemorama
* @summary Esta función se ejecutara una vez que algún objeto haya colisionado con el marcador.
* La función sera ejecutada por la instancia de ManejadorEventos.
* Dentro de esta función es donde esta la logica tradicional de un juego de memorama
* @param {boolean} esColisionado - Es una bandera, la cual traera el resultado si el marcador colisiono con algun objeto
* @param {Elemento} objeto_actual -
*/
Memorama.prototype.logicaMemorama=function(esColisionado,objeto_actual){
  if(esColisionado){
    if(this.detectados.length==1 && this.detectados[0].igualA(objeto_actual)){

    }else if(this.detectados.length==1 && this.detectados[0].esParDe(objeto_actual)){
      clasificarOpcion("memorama","acierto");
      this.indicador_acierto.easein(this.animacion);
      objeto_actual.voltear(this.animacion);
      this.mediador.baja("colision",objeto_actual);
      this.mediador.baja("colision",this.detectados[0]);
      document.getElementById("avances_memorama").innerHTML="Excelente, haz encontrado el par de la carta x"; // ELIMINAR
      this.detectados=[];
    }else if(this.detectados.length==0){
      objeto_actual.voltear(this.animacion);
      this.detectados.push(objeto_actual);
    }else if(!this.detectados[0].esParDe(objeto_actual)){
      clasificarOpcion("memorama","fallo");
      this.indicador_error.easein(this.animacion);
      document.getElementById("avances_memorama").innerHTML="Al parecer te haz equivocado de par, no te preocupes, puedes seguir intentando con el par de x"; // ELIMINAR
      this.detectados[0].voltear(this.animacion);
      this.detectados.pop();
    }
  }
}

/**
* @function callbackMemorama
* @summary Esta funcion sirve como callback una vez que el detector de marcadores, haya detectado un marcador.
* Una vez detectado el marcador, se ejecutara y dentro se identificara si cumple con las condiciones de profunidad
* @param {THREE.Object3D} puntero - Es el objeto que la instancia de DetectorAR, traspuso la posición del marcador
*/
Memorama.prototype.callbackMemorama=function(puntero){
  if(puntero.getWorldPosition().z>300 && puntero.getWorldPosition().z<=500){
    puntero.visible=true;
    this.mediador.comunicar("colision",puntero,this.logicaMemorama,{stage:this});
  }
}

/**
* @function logicaCalibracion
* @summary Esta funcion sirve como callback una vez que el detector de marcadores, haya detectado un marcador.
* A su vez, dentro de la misma esta la lógica de la etapa de Calibracion.
* La etapa de calibración es un proceso donde a partir de un orden de colores, debes de seleccionar cada color, dependiendo de el orden indicado.
* La misma funcion identifica si ya se detectaron todos los elementos de prueba, inicia el nivel de Memorama
* @param {THREE.Object3D} puntero - Es el objeto que la instancia de DetectorAR, traspuso la posición del marcador
*/
Memorama.prototype.logicaCalibracion=function(puntero){
  if(puntero.getWorldPosition().z>300 && puntero.getWorldPosition().z<=500){
    puntero.visible=true;
    this.mediador.comunicarParticular("colision",this.objetos[this.pos_elegido],puntero,function(esColisionado,extras){
      if(esColisionado){
        extras["mediador"].baja("colision",this.objetos[this.pos_elegido]);
        this.pos_elegido++;
        if(this.pos_elegido==this.cantidad_cartas){
          this.puntos_encontrados=true;
          this.detener_calibracion=true;
          this.limpiar();
          this.init();
        }else
          document.getElementById("colorSelect").style.backgroundColor=this.colores[this.pos_elegido];
      }
    }.bind(this));//*/
  }
}

/**
* @function inicioCalibracion
* @summary Crea todos los elementos dibujados en el canvas,donde cada elemento tiene un color especifico
*/
Memorama.prototype.inicioCalibracion=function(){
  var threshold_total=0;
  var threshold_conteo=0;
  for(var i=0;i<300;i++){
    this.detector_ar.cambiarThreshold(i);
    if(this.detector_ar.detectMarker(this)){
      threshold_total+=i;
      threshold_conteo++;
    }
  }
  if(threshold_conteo>0){
    threshold_total=threshold_total/threshold_conteo;
    this.detector_ar.cambiarThreshold(threshold_total);
    calibracion_correcta=true;
    threshold_conteo=0;
    threshold_total=0;
  }
  calibrar=false;
  if(calibracion_correcta){
    this.allowDetect(true);
    this.colores=["rgb(34, 208, 6)","rgb(25, 11, 228)","rgb(244, 6, 6)","rgb(244, 232, 6)"];
    document.getElementById("colorSelect").style.backgroundColor=this.colores[this.pos_elegido];
    //CREACION DE OBJETOS A SELECCIONAR PARA CALIBRAR
    limite_renglon=Math.floor(this.cantidad_cartas/2)+1;
    tamano_elemento=80;
    margenes_espacio=(this.WIDTH_CANVAS-(tamano_elemento*limite_renglon))/limite_renglon;
    for(var i=1,pos_y=-100,fila_pos=i,pos_x=-200;i<=this.cantidad_cartas;i++,pos_y=((i%2!=0) ? pos_y+130 : pos_y) ,fila_pos=((fila_pos>=limite_renglon-1) ? 1 : fila_pos+1),pos_x=(i%2==0 ? 200 : -200)){
      var elemento=new this.Elemento(tamano_elemento,tamano_elemento,new THREE.PlaneGeometry(tamano_elemento,tamano_elemento));
      elemento.init();
      elemento.etiqueta(this.colores[i-1]);
      elemento.position({x:pos_x,y:pos_y,z:-600});
      //elemento.calculoOrigen();
      this.objetos.push(elemento);
      elemento.definirSuperficiePorColor(this.colores[i-1]);
      this.mediador.suscribir("colision",this.objetos[this.objetos.length-1]);
      this.anadir(elemento.get());
    }
  }
}

/**
* @function limpiar
* @summary Ejecuta la funcion limpiar de planoEscena, realidadEscena, donde en cada una, elimina todos los objetos dibujados y agregados a escena.
* Tambien elimina todos los marcadores agregados a detectar.
*/
Memorama.prototype.limpiar=function(){
  this.planoEscena.limpiar();
  this.realidadEscena.limpiar();
  this.detector_ar.cleanMarkers();
}

/**
* @function calibracion
* @summary Inicia el nivel de calibracion.
* Crea el puntero (un objeto THREE.Object3D) para reemplazar en la posición del marcador detectado por DetectorAR(JSArtoolkit).
* Dentro de este método ejecuta la función loop.
*/
Memorama.prototype.calibracion=function(){
  this.objetos=[];
  var mano_obj=new this.Elemento(60,60,new THREE.PlaneGeometry(60,60));
  mano_obj.init();
  mano_obj.definirSuperficiePorImagen("../../assets/img/mano_escala.png");
  this.puntero=new THREE.Object3D();
  this.puntero.add(mano_obj.get());
  this.puntero.position.z=-1;
  this.puntero.matrixAutoUpdate = false;
  this.puntero.visible=false;
  this.anadirMarcador({id:16,callback:this.logicaCalibracion,puntero:this.puntero});
  this.loop();
}

/**
* @function anadirMarcador
* @summary Agrega un marcador a la instancia de DetectorAR, donde una vez que se identifique el marcador se ejecutara el callback especificado
* @param {Object} marcador - Un objeto con 3 propiedades
* 1) id (integer - es el identificador que ocupa JSArtoolkit para un marcador especifico),
* 2) callback (function - es la función a ejecutar una vez que el marcador se haya detectado),
* 3) puntero (THREE.Object3D - es el objeto el cual tendra la posicion del marcador detectado)
*/
Memorama.prototype.anadirMarcador=function(marcador){
  this.detector_ar.addMarker.call(this,marcador);
  if(marcador.puntero!=undefined)
  this.realidadEscena.anadir(marcador.puntero);
  return this;
}


/**
* @function allowDetect
* @param {boolean} bool
*/
Memorama.prototype.allowDetect=function(bool){
  this.detecting_marker=bool;
}


/**
* @function loop
* @summary Esta función se estara ejecutando finitamente hasta que se cierre la aplicación.
* Se encargara del redibujo de todos los elementos agregados a escena y la actualización del canvas con la transmisión de la webcam.
*/
Memorama.prototype.loop=function(){
  this.renderer.clear();
  this.videoEscena.update.call(this,this.videoEscena);
  this.planoEscena.update.call(this,this.planoEscena);
  this.realidadEscena.update.call(this,this.realidadEscena);
  this.webcam.update();
  if(this.detecting_marker)
  this.detector_ar.detectMarker(this);
  for(var i=0;i<this.objetos.length;i++)
  this.objetos[i].actualizar();
  if(!pausado_kathia)
  animate();
  requestAnimationFrame(this.loop.bind(this));
}

module.exports=Memorama;
