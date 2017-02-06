function Memorama(WIDTH,HEIGHT){
  this.bloqueado=false;
  this.WIDTH_CANVAS=WIDTH;
  this.HEIGHT_CANVAS=HEIGHT;
  calibrar=false;
  calibracion_correcta=false;
  puntos_encontrados=false;
  inicio_calibracion=false;
  this.pos_elegido=0;
}

Memorama.prototype.start=function(){
  var Animacion=require('./utils/animacion.js');
  var Escenario=require("./class/escenario.js");
  var WebcamStream=require("./utils/webcamstream.js");
  var DetectorAR=require("./utils/detector");
  this.Elemento=require("./class/elemento.js");
  var Observador=require("./utils/ManejadorEventos.js");
  this.observador=new Observador();
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
  calibracion_correcta=false;
  this.objetos=[];
  var Labels=require("./class/labels");
  texto=Labels(250,250);
  texto.init();
  texto.definir({
    color:'#ff0000',
    alineacion:'center',
    tiporafia:'200px Arial',
    x:250/2,
    y:250/2
  });
  this.label=texto.crear("HELLO WORLD");
  var mano_obj=new this.Elemento(60,60,new THREE.PlaneGeometry(60,60));
  mano_obj.init();
  mano_obj.etiqueta("Detector");
  mano_obj.definir("../../assets/img/mano_escala.png",mano_obj);
  this.puntero=new THREE.Object3D();
  this.puntero.add(mano_obj.get());
  this.puntero.position.z=-1;
  this.puntero.matrixAutoUpdate = false;
  this.puntero.visible=false;
  this.anadirMarcador({id:1,callback:this.logicaCalibracion,puntero:this.puntero});
}

Memorama.prototype.bloquear=function(){
  this.bloqueado=false;
}

Memorama.prototype.desbloquear=function(){
  this.bloqueado=true;
}


Memorama.prototype.anadir=function(obj){
  this.planoEscena.anadir(obj);
}

Memorama.prototype.init=function(){
  this.tipo_memorama="animales";
  var mensaje="Bienvenido al ejercicio Memorama<br>";
  var descripcion="El objetivo de este ejercicio, es tocar los pares de cada carta.<br>No te preocupes si no logras en el primer intento, puedes seguir jugando hasta seleccionar cada uno de los pares<br><br>";
  document.getElementById("informacion_nivel").innerHTML=mensaje+descripcion;
  var avances=document.createElement("id");
  avances.id="avances_memorama";
  document.getElementById("informacion_nivel").appendChild(avances);
  this.detectados=[];

  // CREACION DEL ELEMENTO ACIERTO (LA IMAGEN DE LA ESTRELLA)
  this.indicador_acierto=new this.Elemento(500,500,new THREE.PlaneGeometry(500,500));
  this.indicador_acierto.init();
  this.indicador_acierto.definir("./assets/img/scale/star.png",this.indicador_acierto);
  this.indicador_acierto.position({x:0,y:0,z:-2500});
  this.anadir(this.indicador_acierto.get());

  // CREACION DEL ELEMENTO ERROR (LA IMAGEN DE LA X)
  this.indicador_error=new this.Elemento(500,500,new THREE.PlaneGeometry(500,500));
  this.indicador_error.init();
  this.indicador_error.definir("./assets/img/scale/error.png",this.indicador_error);
  this.indicador_error.position({x:0,y:0,z:-2500});
  this.anadir(this.indicador_error.get());

  ///*
  // CREACION DE LAS CARTAS COMO ELEMENTOS
  var cartas={animales:["medusa","ballena","cangrejo","pato"],cocina:["pinzas","refractorio","sarten","rallador"]};
  limite_renglon=Math.floor(this.cantidad_cartas/2)+1;
  for(var i=1,cont_fila=1,pos_y=-100,fila_pos=i,pos_x=-200;i<=this.cantidad_cartas;i++,pos_y=((i%2!=0) ? pos_y+130 : pos_y) ,fila_pos=((fila_pos>=limite_renglon-1) ? 1 : fila_pos+1),pos_x=(i%2==0 ? 200 : -200)){
    var elemento=new this.Elemento(120,120,new THREE.PlaneGeometry(120,120));
    elemento.init();
    elemento.etiqueta(cartas[this.tipo_memorama][fila_pos-1]);
    elemento.scale(.7,.7);
    elemento.position({x:pos_x,y:pos_y,z:-600});
    this.objetos.push(elemento);
    this.anadir(elemento.get());
    this.objetos[this.objetos.length-1].definirCaras("./assets/img/memorama/sin_voltear.jpg","./assets/img/memorama/"+this.tipo_memorama+"/cart"+fila_pos+"_"+cartas[this.tipo_memorama][fila_pos-1]+".jpg",
    this.objetos[this.objetos.length-1]);
    capa_elemento=document.createElement("div");
    this.observador.suscribir("colision",this.objetos[this.objetos.length-1]);
  }
  //*/


  var mano_obj=new this.Elemento(60,60,new THREE.PlaneGeometry(60,60));
  mano_obj.init();
  mano_obj.etiqueta("Detector");
  mano_obj.definir("../../assets/img/mano_escala.png",mano_obj);
  this.puntero=new THREE.Object3D();
  this.puntero.add(mano_obj.get());
  this.puntero.position.z=-1;
  this.puntero.matrixAutoUpdate = false;
  this.puntero.visible=false;
  this.anadirMarcador({id:16,callback:this.fnAfter,puntero:this.puntero});
  //CREACION DE KATHIA
  document.getElementById("kathia").appendChild(kathia_renderer.view);

  //CREACION DE LA ETIQUETA DONDE SE ESCRIBE LA RESPUESTA DE KATHIA

  iniciarKathia(texto);
  clasificarOpcion("memorama","bienvenida");
  clasificarOpcion("memorama","instrucciones");
  this.loop();
}

Memorama.prototype.logicaMemorama=function(esColisionado,objeto_actual){
  if(esColisionado){
    if(this.detectados.length==1 && this.detectados[0].igualA(objeto_actual)){

    }else if(this.detectados.length==1 && this.detectados[0].esParDe(objeto_actual)){
      clasificarOpcion("memorama","acierto");
      this.indicador_acierto.easein(this.animacion);
      objeto_actual.voltear(this.animacion);
      this.observador.baja("colision",objeto_actual);
      this.observador.baja("colision",this.detectados[0]);
      document.getElementById("avances_memorama").innerHTML="Excelente, haz encontrado el par de la carta x";
      this.detectados=[];
    }else if(this.detectados.length==0){
      objeto_actual.voltear(this.animacion);
      this.detectados.push(objeto_actual);
    }else if(this.detectados[0].get().id!=objeto_actual.get().id){
      clasificarOpcion("memorama","fallo");
      this.indicador_error.easein(this.animacion);
      document.getElementById("avances_memorama").innerHTML="Al parecer te haz equivocado de par, no te preocupes, puedes seguir intentando con el par de x";
      this.detectados[0].voltear(this.animacion);
      this.detectados.pop();
    }
  }
}

Memorama.prototype.fnAfter=function(puntero){
  if(puntero.getWorldPosition().z>300 && puntero.getWorldPosition().z<=500){
    puntero.visible=true;
    this.observador.disparar("colision",puntero,this.logicaMemorama,{stage:this});
  }
}

Memorama.prototype.logicaCalibracion=function(puntero){
  if(puntero.getWorldPosition().z>300 && puntero.getWorldPosition().z<=500){
    puntero.visible=true;
    this.observador.dispararParticular("colision",this.objetos[this.pos_elegido],puntero,function(esColision,extras){
      if(esColision){
        extras["observador"].baja("colision",this.objetos[this.pos_elegido]);
        this.pos_elegido++;
        document.getElementById("colorSelect").style.backgroundColor=this.colores[this.pos_elegido];
        if(this.pos_elegido==this.cantidad_cartas){
          this.puntos_encontrados=true;
          this.detener_calibracion=true;
          this.init();
        }
      }
    }.bind(this));//*/
  }
}

Memorama.prototype.inicioCalibarcion=function(){
  this.objetos=[];
  this.colores=["rgb(34, 208, 6)","rgb(25, 11, 228)","rgb(244, 6, 6)","rgb(244, 232, 6)"];

  //CREACION DE OBJETOS A SELECCIONAR PARA CALIBRAR
  limite_renglon=Math.floor(this.cantidad_cartas/2)+1;
  tamano_elemento=80;
  margenes_espacio=(this.WIDTH_CANVAS-(tamano_elemento*limite_renglon))/limite_renglon;
  for(var x=1,cont_fila=1,pos_y=-100,fila_pos=x,pos_x=-200;x<=this.cantidad_cartas;x++,pos_y=((fila_pos>=limite_renglon-1) ? pos_y+120+50 : pos_y) ,fila_pos=((fila_pos>=limite_renglon-1) ? 1 : fila_pos+1),pos_x=(fila_pos==1 ? -200 : (pos_x+margenes_espacio+tamano_elemento))){
    var elemento=new this.Elemento(tamano_elemento,tamano_elemento,new THREE.PlaneGeometry(tamano_elemento,tamano_elemento));
    elemento.init();
    elemento.etiqueta(this.colores[x-1]);
    elemento.position({x:pos_x,y:pos_y,z:-600});
    elemento.calculoOrigen();
    this.objetos.push(elemento);
    elemento.definirBackground(this.colores[x-1]);
    this.observador.suscribir("colision",this.objetos[this.objetos.length-1]);
    this.anadir(elemento.get());
  }
}

Memorama.prototype.calibracion=function(){
  if(calibrar){
    threshold_total=0;
    threshold_conteo=0;
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
      calibrar=false;
      threshold_conteo=0;
      threshold_total=0;
    }
    calibrar=false;
    if(calibracion_correcta && !puntos_encontrados){
      this.allowDetect(true);
    }
  }
  if(this.detener_calibracion)
  this.init();
  if(!inicio_calibracion){
    inicio_calibracion=true;
    document.getElementById("calibrar").addEventListener("click",function(){
      this.inicioCalibarcion();
      calibrar=true;
    }.bind(this))
    this.loop();
  }
}

Memorama.prototype.anadirMarcador=function(marcador){
  this.detector_ar.addMarker.call(this,marcador);
  if(marcador.puntero!=undefined)
  this.realidadEscena.anadir(marcador.puntero);
  return this;
}

Memorama.prototype.allowDetect=function(bool){
  this.detecting_marker=bool;
}

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
  this.label.material.map.needsUpdate=true;
  if(!pausado_kathia)
  animate();
  if(!this.detener_calibracion)
  this.calibracion();
  requestAnimationFrame(this.loop.bind(this));
}

module.exports=Memorama;
