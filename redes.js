//CALCULAR EL TIPO DE CLASE QUE ES LA RED
function verClase(ip) {
    document.getElementById('result').innerHTML = '';
    const direcciones = document.getElementById('direcciones');
    if (direcciones) direcciones.innerHTML = '';
    if (!ip) {
        document.getElementById('result').innerHTML = 'Por favor, ingrese una dirección IP';
        return;
    }

    const octetos = ip.split('.');
    if (octetos.length !== 4) {
        document.getElementById('result').innerHTML = 'Por favor, ingrese una dirección IP válida (formato: xxx.xxx.xxx.xxx)';
        return;
    }

    // Validar que cada octeto sea un número válido entre 0 y 255
    for (let i = 0; i < octetos.length; i++) {
        const octeto = parseInt(octetos[i]);
        if (isNaN(octeto) || octeto < 0 || octeto > 255) {
            document.getElementById('result').innerHTML = 'Por favor, ingrese una dirección IP válida (cada octeto debe ser un número entre 0 y 255)';
            return;
        }
    }

    const primerOcteto = parseInt(octetos[0]);
    let clase = '';
    let rango = '';

    if (primerOcteto >= 1 && primerOcteto <= 126) {
        clase = 'A';
        rango = '1-126';
    } else if (primerOcteto >= 128 && primerOcteto <= 191) {
        clase = 'B';
        rango = '128-191';
    } else if (primerOcteto >= 192 && primerOcteto <= 223) {
        clase = 'C';
        rango = '192-223';
    } else if (primerOcteto >= 224 && primerOcteto <= 239) {
        clase = 'D';
        rango = '224-239';
    } else if (primerOcteto >= 240 && primerOcteto <= 255) {
        clase = 'E';
        rango = '240-255';
    } else {
        document.getElementById('result').innerHTML = 'IP no válida';
        return;
    }

    document.getElementById('result').innerHTML = `La dirección IP: <b>${octetos.join('.')}</b> pertenece a la clase <b>${clase}</b> (Rango: <b>${rango})</b>`;
    return [octetos,clase];
}

function calculaConMascara(ip, mask) {
    let miIp = verClase(ip); // IP dividida en octetos y la clase de la red
    const miMask = mask.split('.').map(Number); // Convertimos la máscara en un array de números
    let numHost = 0;  
    let numRedes = 0;
    let binario = [];
    let decimal = [];
    
   /*  document.getElementById('result').innerHTML +=  
        `<br>La dirección IP: ${miIp[0].join('.')} con máscara ${miMask.join('.')}`; */

    let i = 0;
    
    // Buscar el primer octeto que no sea 255
    switch (miIp[1]) {
        case 'A':
              i = 1;
          break; 
        case 'B':
              i = 2;
        break; 
        case 'C':
              i = 3; 
          break; 
          default:
                /* return 'Solo calculo redes A, B y C'; */
                alert('Solo calculo redes de clase A, B y C')
                return ;
          break; 
        } 
        

    // Convertimos la máscara a binario desde el primer octeto que no sea 255
    for (let j = 0; j < 4; j++) {   
        if (j<i)
            {
               binario[j] = '11111111'; 
               decimal[j] = 255;
            } 
        binario[j] = miMask[j].toString(2).padStart(8, '0'); // Convertimos cada octeto a binario y rellenamos con 0
        decimal[j] = miMask[j]; // Convertimos cada octeto a decimal
     
    }

    // Unimos los valores de binario en una sola cadena
    document.getElementById('result').innerHTML +=  `<br>Mascara en decimal:<b> ${decimal.join('.')}</b> <br>Mascara adptada en binario: <b>${binario.join('.')}</b>`
    binario = binario.join('');

    // Contar los bits en 1 para calcular el número de subredes
    let bitsRed = 0;
    let bitsHost = 0;

    for (let k = (i * 8); k < 32; k++) {
        if (binario[k] === '0') {
            bitsHost++;
        } else {
            bitsRed++;
        }
    }
    numRedes = Math.pow(2, bitsRed);
    numHost = Math.pow(2, bitsHost);

    document.getElementById('result').innerHTML += 
        `<br> Direcciones de subred <b>${numRedes} </b>, 
        <br> Direcciones de host <b>${numHost}</b>, útiles <b>${numHost-2}</b> 
        `;
//mostrar todas las direcciones de subredes

let red=[]          //***************************************************ESTAMOS AQUÍ */
document.getElementById('direcciones').innerHTML ='';
//REDES
///  PROBAR CON MASK 
let octetos255 = 0;
while (miMask[octetos255]===255)
    octetos255++;   //con esto sabemos cuantos octetos de la mascara son 255
/* alert(`El número de octetos de la mascara que son 255 son ${octetos255}`); */
for(let dirIP=0 ; dirIP<octetos255; dirIP++)
    red[dirIP] = miIp[0][dirIP]; // Copia los octetos de la IP original hasta el octeto que se está modificando
for(let dirIP=octetos255 ; dirIP<4; dirIP++)
    red[dirIP] = 0; // Inicializa los octetos restantes a 0 

let contador = 0;
if (numRedes > 512) {
    alert('El número de subredes es muy grande por lo que solo se mostrarán 512 direcciones de subredes');
    numRedes = 512;
}
for (let redNum = 0; redNum < numRedes; redNum++){
    
    document.getElementById('direcciones').innerHTML +=
       `<br>Direcciónes de subred <b>${red.join('.')}</b> Host <b>[${red[3]+1} - ${red[3]+numHost-2}]</b> Broadcast <b>[${red[3]+numHost-1}]</b>`;

       
 if (red[octetos255]+numHost<254){
    red[octetos255]+=numHost;
 }
 else 
    {
      red[octetos255]=0;  
      red[octetos255-1]++;
    }
     
   /*  if (red[octetos255]<254)
        red[octetos255]+=miMask[octetos255]/(numRedes-1);
   else  */
        
contador++;

}
document.getElementById('direcciones').innerHTML +=
       `<br>Número de subredes <b>${contador}</b>`;

//DIRECCIONES FINALES DE HOST
 /* for (let hostNum = red[3]+1; hostNum < numHost; hostNum++){  //Mostramos direcciones de host
        if (hostNum===numHost-1)
            document.getElementById('direcciones').innerHTML += `<br>IP de Broadcast <b>${hostNum}</b>`;
        else
            document.getElementById('direcciones').innerHTML += `<br>IP de HOST <b>${hostNum}</b>`;    
        } */
}
function calculaConRedes(ip, numRedes) {
    let miIp = verClase(ip); // IP dividida en octetos y la clase de la red    
    let mascara = [];
  /*   let numRedes2 = 0;  */
    let i = 0;
// Buscar el primer octeto que no sea 255
switch (miIp[1]) {
    case 'A':
          i = 1;
      break;    
    case 'B':
          i = 2;    
      break;
    case 'C':
          i = 3;
      break;
          
      default:
            /* return 'Solo calculo redes A, B y C'; */
            alert('Solo calculo redes de clase A, B y C')
            return ; 
    } 
    let j=0; //nº de bitis en 1
   
    while (numRedes > ( Math.pow(2,j)) ) {
        j++;
    }
 
alert(`La máscara mínima es ${j}, bits submascara ${j}, la potencia es  ${Math.pow(2,j)} y el numero de redes es ${numRedes}`);
    // Calcular la máscara
    if (j>8){
      i=i+1;  
      j=j-8
    } 
    if (j>16){
       i=i+2; 
       j=j-16; 
    }  
    
    for (let k = 0; k < i; k++) { //llena octeto con 255s
        mascara[k] = 255;
         
    }
    alert(`La máscara es ${mascara} `);
    numRedes=0; 
    for (let k = 0; k < j; k++) {//Calcula el valor de la mascara en decimal con las potencias de los bits en 1 desde el octeto que no sea 255 hasta el final de la máscara
         numRedes +=  Math.pow(2,7-k)
           
    }
    mascara[i] = numRedes;
    for (k=i+1; k<4; k++) { //llena octeto con 0s
        mascara[k] = 0; 
    }
   /*  alert(`La máscara es ${mascara} `); */

    calculaConMascara(ip, mascara.join('.'));
    document.getElementById('result').innerHTML +=
        `<br>La dirección IP: <b>${miIp[0].join('.')}</b> debe tener la máscara <b>${mascara.join('.')}</b>`;   

}

function calculaConHosts(ip, numHosts) {
    let miIp = verClase(ip); // IP dividida en octetos y la clase de la red
    let bitmascara = 0; 
    let mascara = []; 
    let i = 0;
    switch (miIp[1]) {
        case 'A':
              i = 1;
          break;    
        case 'B':
              i = 2; 
          break;
        case 'C':
              i = 3;              
          break;
              
          default:
                /* return 'Solo calculo redes A, B y C'; */
                alert('Solo calculo redes de clase A, B y C')
                return ; 
        } 
        let j=0; //nº de bitis en 1
        while (numHosts >  Math.pow(2,j) ) {
            j++;
        }
/* alert(`Nº de bits en 1 ${j}`); */
    // Calcular la máscara  
bitmascara = 32-j;
alert(`Nº de bits para hosts: ${j}. Nº bits para subredes: ${bitmascara}`);

for (let k = 0; k < 4; k++) { //llena octeto con 255s y con número de mascara en decimal para la mascara modificada
   if (bitmascara>=8) { //rellenamos octeto con 255s
    mascara[k] = 255;
    bitmascara=bitmascara-8;

   }else
   if (bitmascara==0){
    mascara[k] = 0;
    
   }
   else{ //rellenamos octeto con número de mascara en decimal     
     
    octetoClave=0; 
   for (let l = 0; l < bitmascara; l++) {// calcula el valor del octeto donde modifico la mascara con los bits restantes
            octetoClave +=  Math.pow(2,7-l);           
   } 
     mascara[k] = octetoClave; 
    bitmascara=0;//no  hace falta.    
   }  
 }

            calculaConMascara(ip, mascara.join('.'));    
            document.getElementById('result').innerHTML +=
            `<br>La dirección IP: <b>${miIp[0].join('.')}</b> debe tener la máscara <b>${mascara.join('.')}</b>`;   
    
}


//FUNCIONALIDAD PARA CARGAR PÁGINAS A PARTIR DE LOS ENLACES DEL MENÚ
function cargarSubneting(event) {
    event.preventDefault();
    fetch('subneting.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('cuerpo').innerHTML = data;
        })
        .catch(error => console.error('Error:', error));
}
function cargarInicio(event) {
    event.preventDefault();
    fetch('inicio.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('cuerpo').innerHTML = data;
        })
        .catch(error => console.error('Error:', error));
}
function cargarClases(event) {
    event.preventDefault();
    fetch('clases.html')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            document.getElementById('cuerpo').innerHTML = doc.body.innerHTML;
        })
        .catch(error => console.error('Error:', error));
}

// Función para actualizar la máscara según el valor seleccionado
function actualizarMascara(valor) {
    if (valor === 'Máscaras') {
        document.getElementById('mascara').value = '';
        return;
    }
    const bits = parseInt(valor);
    const mask = new Array(4).fill(0);
    const fullBytes = Math.floor(bits / 8);
    const remainingBits = bits % 8;

    // Establecer bytes completos
    for (let i = 0; i < fullBytes; i++) {
        mask[i] = 255;
    }

    // Establecer bits restantes si hay
    if (remainingBits > 0) {
        mask[fullBytes] = 256 - Math.pow(2, 8 - remainingBits);
    }

    document.getElementById('mascara').value = mask.join('.');
}

//VALIDAR FORMULARIO DE ip  -- esto hay que terminarlo
document.addEventListener('DOMContentLoaded', function () {
    // Agregar el event listener para el select de máscara
    const selectElement = document.getElementById('maskSelect');
    if (selectElement) {
        selectElement.addEventListener('change', function() {
            actualizarMascara(this.value);
        });
    }
    var form = document.getElementById('ipForm');
    if (!form) return;
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var ipAddressInput = document.getElementById('ipAddress');
        var ipAddress = ipAddressInput.value;
        var ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

        if (ipPattern.test(ipAddress)) {
            ipAddressInput.classList.remove('is-invalid');
            ipAddressInput.classList.add('is-valid');
        } else {
            ipAddressInput.classList.remove('is-valid');
            ipAddressInput.classList.add('is-invalid');
        }

        form.classList.add('was-validated');
    }, false);
});