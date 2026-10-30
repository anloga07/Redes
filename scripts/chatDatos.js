// Base de conocimiento del asistente de chat.
//
// Las claves están ya normalizadas (minúsculas, sin acentos y con la eñe
// convertida en ene), porque normalizarTexto() deja de ese modo el mensaje del
// alumno antes de compararlo. Un cambio en los datos no necesita tocar el motor.
//
// Cada entrada lleva:
//   claves    -> términos que activan la respuesta (cuanto más larga la clave,
//                más peso tiene al puntuar)
//   pregunta  -> texto de la sugerencia cuando el bot no entiende
//   respuesta -> lo que contesta el bot
//   vista     -> opcional; id de VISTAS (scripts/redes.js) al que lleva el botón
//   etiqueta  -> texto de ese botón; obligatorio si hay "vista"
const BASE_CONOCIMIENTO = [
  {
    claves: ["direccion ip", "que es una ip", "ip"],
    pregunta: "¿Qué es una dirección IP?",
    respuesta:
      "Una dirección IP es un número de 32 bits escrito como cuatro octetos separados por puntos, por ejemplo 192.168.1.1. Identifica un equipo dentro de una red y se divide en una parte de red y otra de host.",
    vista: "teoria",
    etiqueta: "Leer la teoría",
  },
  {
    claves: ["clase", "clases", "a que clase"],
    pregunta: "¿A qué clase pertenece mi IP?",
    respuesta:
      "La clase depende del primer octeto: A de 0 a 127, B de 128 a 191, C de 192 a 223, D de 224 a 239 (multicast) y E de 240 a 255 (experimental). Escribe la dirección en la calculadora y te la dirá al instante.",
    vista: "clases",
    etiqueta: "Ver clases",
  },
  {
    claves: ["rango", "rangos", "primer octeto"],
    pregunta: "¿Cuáles son los rangos de cada clase?",
    respuesta:
      "Clase A: 0.0.0.0 – 127.255.255.255. Clase B: 128.0.0.0 – 191.255.255.255. Clase C: 192.0.0.0 – 223.255.255.255. Clase D: 224.0.0.0 – 239.255.255.255. Clase E: 240.0.0.0 – 255.255.255.255.",
    vista: "clases",
    etiqueta: "Ver la tabla",
  },
  {
    claves: ["privada", "privadas", "publica", "publicas", "rfc 1918"],
    pregunta: "¿Qué es una dirección privada?",
    respuesta:
      "Son los rangos reservados para redes internas, que no se enrutan por Internet: 10.0.0.0/8, de 172.16.0.0 a 172.31.255.255 (/12) y 192.168.0.0/16.",
    vista: "teoria",
    etiqueta: "Ampliar en Teoría",
  },
  {
    claves: ["mascara", "prefijo", "cidr", "barra"],
    pregunta: "¿Cómo se calcula la máscara de subred?",
    respuesta:
      "La máscara se escribe con tantos 1 seguidos como indique el prefijo: /24 son 24 unos, es decir 255.255.255.0. Escribe tu IP y su máscara en la calculadora para ver el resultado.",
    vista: "subneting",
    etiqueta: "Abrir calculadora",
  },
  {
    claves: ["hosts", "host", "hosts utiles"],
    pregunta: "¿Cuántos hosts útiles entran en una subred?",
    respuesta:
      "Con n bits de host los equipos útiles son 2^n − 2, porque se descartan la dirección de red y la de broadcast. Por ejemplo, un /26 deja 6 bits y da 62 hosts.",
    vista: "subneting",
    etiqueta: "Calcular capacidad",
  },
  {
    claves: ["subredes", "subred", "cuantas subredes"],
    pregunta: "¿Cuántas subredes puedo crear?",
    respuesta:
      "Cada bit que tomas del campo de host duplica las subredes: con 2 bits salen 4, con 3 salen 8. El modo capacidad te resume cuántas salen y cuántos hosts quedan en cada una.",
    vista: "subneting",
    etiqueta: "Abrir calculadora",
  },
  {
    claves: ["numero de redes", "por redes", "objetivo redes"],
    pregunta: "¿Cómo saco la máscara a partir del número de redes?",
    respuesta:
      "En el modo objetivo elige «Redes», escribe cuántas necesitas y pulsa Calcular: la máscara sale de los bits que hay que tomar prestados del campo de host.",
    vista: "subneting",
    etiqueta: "Ir al modo objetivo",
  },
  {
    claves: ["numero de hosts", "por hosts", "objetivo hosts"],
    pregunta: "¿Cómo saco la máscara a partir del número de hosts?",
    respuesta:
      "En el modo objetivo elige «Hosts», indica cuántos equipos necesitas y pulsa Calcular: se busca la máscara que deja al menos 2^n − 2 hosts útiles.",
    vista: "subneting",
    etiqueta: "Ir al modo objetivo",
  },
  {
    claves: ["tutor", "paso a paso", "desglose"],
    pregunta: "¿Qué es el Modo Tutor?",
    respuesta:
      "Es el desglose paso a paso del cálculo: pasa la IP a binario, marca la parte de red, obtiene la máscara y lista las direcciones de cada subred.",
    vista: "subneting",
    etiqueta: "Ver el desglose",
  },
  {
    claves: ["binario", "hexadecimal", "octal", "conversor", "decimal"],
    pregunta: "¿Cómo paso un número a binario?",
    respuesta:
      "El conversor traduce entre decimal, binario, octal y hexadecimal, y agrupa el binario en octetos para que puedas leer una IP bit a bit.",
    vista: "conversor",
    etiqueta: "Abrir conversor",
  },
  {
    claves: ["contrasena", "contrasenas", "password", "clave segura"],
    pregunta: "¿Dónde genero una contraseña?",
    respuesta:
      "En PassGenerator eliges la longitud y los tipos de caracteres, y puedes copiar el resultado con un clic. Las contraseñas se guardan solo en este navegador.",
    vista: "pass",
    etiqueta: "Abrir PassGenerator",
  },
  {
    claves: ["tarea", "tareas", "deberes"],
    pregunta: "¿Cómo apunto mis tareas?",
    respuesta:
      "En Tareas escribes el enunciado y lo marcas como completado cuando lo termines. Todo queda guardado en este navegador.",
    vista: "tareas",
    etiqueta: "Abrir Tareas",
  },
  {
    claves: ["nota", "notas", "apuntes"],
    pregunta: "¿Dónde escribo apuntes?",
    respuesta: "En Notas puedes crear, editar y borrar apuntes con título, contenido y fecha.",
    vista: "notas",
    etiqueta: "Abrir Notas",
  },
  {
    claves: ["agenda", "calendario", "examen", "examenes"],
    pregunta: "¿Hay una agenda?",
    respuesta:
      "Sí: la Agenda reúne las fechas del curso para que no se te escape ningún examen ni ninguna entrega.",
    vista: "agenda",
    etiqueta: "Abrir Agenda",
  },
  {
    claves: ["subneting", "subnetear", "subdividir"],
    pregunta: "¿Qué es el subneting?",
    respuesta:
      "Es dividir una red en subredes más pequeñas tomando bits del campo de host. Cada subred tiene así su propia dirección de red y de broadcast.",
    vista: "subneting",
    etiqueta: "Practicar subneting",
  },
  {
    claves: ["por donde empiezo", "empezar", "soy nuevo", "principiante"],
    pregunta: "¿Por dónde empiezo?",
    respuesta:
      "Sigue el orden de la portada: primero la teoría, después comprueba la clase de una IP y termina dividiendo la red con el subneting.",
    vista: "inicio",
    etiqueta: "Ir a la portada",
  },
  {
    claves: ["se guardan", "privacidad", "datos", "servidor"],
    pregunta: "¿Dónde se guardan mis datos?",
    respuesta:
      "Solo en tu navegador, con localStorage. Este asistente funciona sin servidor: nada de lo que escribes sale de tu equipo.",
  },
  {
    claves: ["tema", "modo claro", "modo oscuro", "oscuro"],
    pregunta: "¿Puedo cambiar el tema?",
    respuesta:
      "Sí: el botón de la luna o el sol, arriba a la derecha de la barra de navegación, alterna entre modo claro y oscuro y recuerda tu elección.",
  },
  {
    claves: ["hola", "buenas", "buenos dias", "que tal"],
    pregunta: "Hola",
    respuesta:
      "Hola. Pregúntame por las clases de direcciones, las máscaras, el subneting o cualquier herramienta del sitio.",
  },
  {
    claves: ["gracias", "muchas gracias"],
    pregunta: "Gracias",
    respuesta: "De nada. Si te queda otra duda, aquí estoy.",
  },
  {
    claves: ["quien eres", "que sabes", "que puedes hacer", "ayuda"],
    pregunta: "¿Qué puedes hacer?",
    respuesta:
      "Respondo dudas frecuentes sobre direcciones IP, clases, máscaras y subneting, y te llevo a la herramienta que necesites con el botón que acompaña a cada respuesta.",
  },
];
