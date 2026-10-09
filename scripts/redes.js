// ===== UTILIDADES DE CÁLCULO =====

// Convierte 4 octetos (array de números) a su valor de 32 bits
function ipAInt(octetos) {
    return octetos[0] * 16777216 + octetos[1] * 65536 + octetos[2] * 256 + octetos[3];
}

// Convierte un valor de 32 bits a su notación IP (xxx.xxx.xxx.xxx)
function intAIP(valor) {
    return [
        Math.floor(valor / 16777216) % 256,
        Math.floor(valor / 65536) % 256,
        Math.floor(valor / 256) % 256,
        valor % 256
    ].join('.');
}

// Devuelve clase, rango y octeto donde empieza la red (i) según el primer octeto
function claseDelPrimerOcteto(primerOcteto) {
    if (primerOcteto >= 1 && primerOcteto <= 126) return { clase: 'A', rango: '1-126', i: 1 };
    if (primerOcteto >= 128 && primerOcteto <= 191) return { clase: 'B', rango: '128-191', i: 2 };
    if (primerOcteto >= 192 && primerOcteto <= 223) return { clase: 'C', rango: '192-223', i: 3 };
    if (primerOcteto >= 224 && primerOcteto <= 239) return { clase: 'D', rango: '224-239', i: null };
    if (primerOcteto >= 240 && primerOcteto <= 255) return { clase: 'E', rango: '240-255', i: null };
    return null;
}

// Convierte un prefijo /n en la máscara decimal correspondiente
function prefijoAMascara(prefijo) {
    const mascara = [];
    for (let k = 0; k < 4; k++) {
        if (prefijo >= 8) {
            mascara[k] = 255;
            prefijo -= 8;
        } else if (prefijo === 0) {
            mascara[k] = 0;
        } else {
            mascara[k] = 256 - Math.pow(2, 8 - prefijo);
            prefijo = 0;
        }
    }
    return mascara;
}

// Añade contenido al párrafo de resultados (si existe en la página)
function escribirResultado(html) {
    const el = document.getElementById('result');
    if (el) el.innerHTML += html;
}

// ===== DETECCIÓN DE CLASE =====

//CALCULAR EL TIPO DE CLASE QUE ES LA RED
// Devuelve { octetos, clase, i } o null si la IP no es válida (el error ya se muestra en pantalla)
function verClase(ip) {
    const elResult = document.getElementById('result');
    const elDirecciones = document.getElementById('direcciones');
    if (elResult) elResult.innerHTML = '';
    if (elDirecciones) elDirecciones.innerHTML = '';

    function error(mensaje) {
        if (elResult) elResult.innerHTML = mensaje;
        return null;
    }

    if (!ip || !ip.trim()) {
        return error('Por favor, ingrese una dirección IP');
    }
    ip = ip.trim();

    const octetos = ip.split('.');
    if (octetos.length !== 4) {
        return error('Por favor, ingrese una dirección IP válida (formato: xxx.xxx.xxx.xxx)');
    }

    // Validar que cada octeto sea un número válido entre 0 y 255
    for (let i = 0; i < octetos.length; i++) {
        if (!/^\d{1,3}$/.test(octetos[i]) || parseInt(octetos[i], 10) > 255) {
            return error('Por favor, ingrese una dirección IP válida (cada octeto debe ser un número entre 0 y 255)');
        }
    }

    const info = claseDelPrimerOcteto(parseInt(octetos[0], 10));
    if (!info) {
        return error('IP no válida');
    }

    if (elResult) {
        elResult.innerHTML = `La dirección IP: <b>${octetos.join('.')}</b> pertenece a la clase <b>${info.clase}</b> (Rango: <b>${info.rango}</b>)`;
    }
    return { octetos: octetos.map(Number), clase: info.clase, i: info.i };
}

// ===== CÁLCULOS DE SUBNETING =====

function calculaConMascara(ip, mask) {
    const miIp = verClase(ip);
    if (!miIp) return; // la IP ya está validada y el error mostrado
    if (miIp.i === null) {
        alert('Solo calculo redes de clase A, B y C');
        return;
    }

    // Validar la máscara
    const octetosMask = (mask || '').trim().split('.');
    if (octetosMask.length !== 4 || octetosMask.some(o => !/^\d{1,3}$/.test(o) || parseInt(o, 10) > 255)) {
        escribirResultado('<br>La máscara no es válida (formato: 255.255.255.0)');
        return;
    }
    const miMask = octetosMask.map(Number);

    const binario = miMask.map(o => o.toString(2).padStart(8, '0'));
    const cadenaBinaria = binario.join('');
    if (!/^1*0*$/.test(cadenaBinaria)) {
        escribirResultado('<br>La máscara no es válida: los bits a 1 deben ser consecutivos');
        return;
    }

    // Prefijo = nº de bits a 1 de la máscara
    const posicionCero = cadenaBinaria.indexOf('0');
    const prefijo = posicionCero === -1 ? 32 : posicionCero;
    if (prefijo < miIp.i * 8) {
        escribirResultado(`<br>La máscara debe ser igual o mayor que la máscara de la clase ${miIp.clase} (/${miIp.i * 8})`);
        return;
    }

    const bitsRed = prefijo - miIp.i * 8;   // bits tomados prestados de la red
    const bitsHost = 32 - prefijo;
    const numRedes = Math.pow(2, bitsRed);
    const numHost = Math.pow(2, bitsHost);

    escribirResultado(`<br>Máscara en decimal: <b>${miMask.join('.')}</b><br>Máscara adaptada en binario: <b>${binario.join('.')}</b>`);
    escribirResultado(`<br>Direcciones de subred <b>${numRedes}</b>, <br>Direcciones de host <b>${numHost}</b>, útiles <b>${Math.max(numHost - 2, 0)}</b>`);

    // Red principal: se copian los octetos de la IP según la clase y el resto a 0
    const base = ipAInt(miIp.octetos.map((o, k) => (k < miIp.i ? o : 0)));
    const blockSize = numHost;

    let mostrar = numRedes;
    if (mostrar > 512) {
        alert('El número de subredes es muy grande por lo que solo se mostrarán 512 direcciones de subredes');
        mostrar = 512;
    }

    // MOSTRAR TODAS LAS DIRECCIONES DE SUBREDES
    let html = '';
    for (let redNum = 0; redNum < mostrar; redNum++) {
        const red = base + redNum * blockSize;
        const broadcast = red + blockSize - 1;
        html += `<br>Direcciones de subred <b>${intAIP(red)}</b>`;
        if (blockSize > 2) {
            html += ` Host <b>[${intAIP(red + 1)} - ${intAIP(broadcast - 1)}]</b>`;
        } else {
            html += ' Host <b>[ninguno]</b>';
        }
        html += ` Broadcast <b>[${intAIP(broadcast)}]</b>`;
    }
    html += `<br>Número de subredes <b>${numRedes}</b>`;

    const elDirecciones = document.getElementById('direcciones');
    if (elDirecciones) elDirecciones.innerHTML = html;

    if (document.getElementById('modoTutor') && document.getElementById('modoTutor').checked) {
        escribirResultado(generarDesgloseTutor(ip, miMask.join('.')));
    }
}

function calculaConRedes(ip, numRedes) {
    const miIp = verClase(ip);
    if (!miIp) return;
    if (miIp.i === null) {
        alert('Solo calculo redes de clase A, B y C');
        return;
    }

    const totalRedes = parseInt(numRedes, 10);
    if (!Number.isInteger(totalRedes) || totalRedes < 1) {
        escribirResultado('<br>Indique un número de redes válido (mayor o igual que 1)');
        return;
    }

    // Nº de bits necesarios en la submáscara para obtener esa cantidad de redes
    let j = 0;
    while (totalRedes > Math.pow(2, j)) {
        j++;
    }

    const prefijo = miIp.i * 8 + j;
    const bitsHost = 32 - prefijo;
    if (bitsHost < 2) {
        alert(`No es posible: serían ${j} bits de subred y quedarían menos de 2 bits para hosts`);
        return;
    }

    const mascara = prefijoAMascara(prefijo);
    calculaConMascara(ip, mascara.join('.'));
    escribirResultado(
        `<br>La dirección IP: <b>${miIp.octetos.join('.')}</b> debe tener la máscara <b>${mascara.join('.')}</b> (/${prefijo})` +
        `<br>Se usan <b>${j}</b> bits de subred y <b>${bitsHost}</b> de hosts: ` +
        `<b>${Math.pow(2, j)}</b> subredes de <b>${Math.pow(2, bitsHost) - 2}</b> hosts útiles`
    );
}

function calculaConHosts(ip, numHosts) {
    const miIp = verClase(ip);
    if (!miIp) return;
    if (miIp.i === null) {
        alert('Solo calculo redes de clase A, B y C');
        return;
    }

    const totalHosts = parseInt(numHosts, 10);
    if (!Number.isInteger(totalHosts) || totalHosts < 1) {
        escribirResultado('<br>Indique un número de hosts válido (mayor o igual que 1)');
        return;
    }

    // Nº de bits necesarios para alojar esa cantidad de hosts (sin contar red ni broadcast)
    let j = 0;
    while (Math.pow(2, j) - 2 < totalHosts) {
        j++;
    }

    const prefijo = 32 - j;
    if (prefijo < miIp.i * 8) {
        alert(`No es posible: para la clase ${miIp.clase} la máscara mínima es /${miIp.i * 8}`);
        return;
    }

    const mascara = prefijoAMascara(prefijo);
    calculaConMascara(ip, mascara.join('.'));
    escribirResultado(
        `<br>La dirección IP: <b>${miIp.octetos.join('.')}</b> debe tener la máscara <b>${mascara.join('.')}</b> (/${prefijo})` +
        `<br>Se usan <b>${32 - prefijo}</b> bits de hosts y <b>${prefijo}</b> de red: ` +
        `<b>${Math.pow(2, prefijo - miIp.i * 8)}</b> subredes de <b>${Math.pow(2, j) - 2}</b> hosts útiles`
    );
}

// ===== MODO TUTOR =====

function generarDesgloseTutor(ip, mascara) {
    const octetosIP = ip.trim().split('.').map(Number);
    const octetosMask = mascara.split('.').map(Number);

    const binarioIP = octetosIP.map(o => o.toString(2).padStart(8, '0'));
    const binarioMask = octetosMask.map(o => o.toString(2).padStart(8, '0'));

    const binarioAND = [];
    for (let i = 0; i < 4; i++) {
        let bits = '';
        for (let j = 0; j < 8; j++) {
            bits += (binarioIP[i][j] === '1' && binarioMask[i][j] === '1') ? '1' : '0';
        }
        binarioAND.push(bits);
    }
    const octetosRed = binarioAND.map(b => parseInt(b, 2));

    const cadenaMask = binarioMask.join('');
    const posicionCero = cadenaMask.indexOf('0');
    const prefijo = posicionCero === -1 ? 32 : posicionCero;
    const octetoInteres = Math.min(Math.floor(prefijo / 8), 3);
    const numeroMagico = 256 - octetosMask[octetoInteres];

    let html = '<div class="mt-4 p-3 border rounded bg-light">';
    html += '<h5>Desglose paso a paso (Modo Tutor)</h5>';

    html += '<h6 class="mt-3">1. Conversión a binario</h6>';
    html += '<table class="table table-sm table-bordered">';
    html += '<thead><tr><th></th><th>Octeto 1</th><th>Octeto 2</th><th>Octeto 3</th><th>Octeto 4</th></tr></thead>';
    html += '<tbody>';
    html += '<tr><td><b>IP</b></td>';
    for (let i = 0; i < 4; i++) html += `<td>${octetosIP[i]} = ${binarioIP[i]}</td>`;
    html += '</tr>';
    html += '<tr><td><b>Máscara</b></td>';
    for (let i = 0; i < 4; i++) html += `<td>${octetosMask[i]} = ${binarioMask[i]}</td>`;
    html += '</tr>';
    html += '</tbody></table>';

    html += '<h6 class="mt-3">2. Operación AND lógica</h6>';
    html += '<p>La dirección de red se obtiene aplicando AND bit a bit entre la IP y la máscara:</p>';
    html += '<table class="table table-sm table-bordered">';
    html += '<tbody>';
    html += '<tr><td><b>IP binario</b></td>';
    for (let i = 0; i < 4; i++) html += `<td>${binarioIP[i]}</td>`;
    html += '</tr>';
    html += '<tr><td><b>Máscara binario</b></td>';
    for (let i = 0; i < 4; i++) html += `<td>${binarioMask[i]}</td>`;
    html += '</tr>';
    html += '<tr class="table-success"><td><b>AND (Red)</b></td>';
    for (let i = 0; i < 4; i++) html += `<td>${binarioAND[i]}</td>`;
    html += '</tr>';
    html += '<tr><td><b>Red decimal</b></td>';
    for (let i = 0; i < 4; i++) html += `<td>${octetosRed[i]}</td>`;
    html += '</tr>';
    html += '</tbody></table>';
    html += `<p><b>Dirección de red:</b> ${octetosRed.join('.')}</p>`;

    if (prefijo >= 32) {
        html += '<p><b>Máscara /32:</b> no hay subredes ni hosts: la red es una única dirección.</p>';
        html += '</div>';
        return html;
    }

    html += '<h6 class="mt-3">3. Número mágico (salto entre subredes)</h6>';
    html += '<p>El número mágico se calcula restando a 256 el primer octeto de la máscara que no es 255:</p>';
    html += `<p><b>256 - ${octetosMask[octetoInteres]} = ${numeroMagico}</b></p>`;
    html += `<p>El octeto de interés es el octeto ${octetoInteres + 1}.</p>`;
    if (octetosMask[octetoInteres] === 0) {
        html += `<p>Como ese octeto vale 0, el salto de ${numeroMagico} equivale a 1 unidad en el octeto siguiente.</p>`;
    }

    // Rango de subredes calculado con aritmética de 32 bits (sin acarreos manuales)
    const info = claseDelPrimerOcteto(octetosIP[0]);
    const i = (info && info.i) ? info.i : 1;
    const base = ipAInt(octetosIP.map((o, k) => (k < i ? o : 0)));
    const blockSize = Math.pow(2, 32 - prefijo);
    const numSubredes = Math.pow(2, Math.max(prefijo - i * 8, 0));
    const mostrar = Math.min(numSubredes, 8);

    html += '<h6 class="mt-3">4. Rango de subredes</h6>';
    html += `<p>Con máscara /${prefijo} hay <b>${numSubredes}</b> subredes de <b>${blockSize}</b> direcciones cada una:</p>`;
    html += '<ul>';
    for (let n = 0; n < mostrar; n++) {
        const red = base + n * blockSize;
        const broadcast = red + blockSize - 1;
        const hosts = blockSize > 2 ? `${intAIP(red + 1)} - ${intAIP(broadcast - 1)}` : 'ninguno';
        html += `<li>Subred ${n}: <b>${intAIP(red)}</b> — Hosts: ${hosts} — Broadcast: ${intAIP(broadcast)}</li>`;
    }
    if (mostrar < numSubredes) {
        html += `<li>... y ${numSubredes - mostrar} subredes más</li>`;
    }
    html += '</ul>';

    html += '</div>';
    return html;
}

// ===== FUNCIONALIDAD PARA CARGAR PÁGINAS A PARTIR DE LOS ENLACES DEL MENÚ =====

function cargarFragmento(archivo) {
    fetch(archivo)
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
        })
        .then(data => {
            document.getElementById('cuerpo').innerHTML = data;
            inicializarFragmento(archivo);
        })
        .catch(error => console.error('Error:', error));
}

// Los <script> incluidos en un fragmento inyectado con innerHTML NO se
// ejecutan, así que cada herramienta se inicializa aquí, después de cargarla.
function inicializarFragmento(archivo) {
    prepararValidacionIP();

    const inicializadores = {
        'pass.html': 'iniciarPass',
        'tareas.html': 'iniciarTareas',
        'notas.html': 'cargarNotas'
    };
    const nombre = inicializadores[archivo];
    if (nombre && typeof window[nombre] === 'function') {
        window[nombre]();
    }
}

function cargarSubneting(event) {
    event.preventDefault();
    cargarFragmento('subneting.html');
}

function cargarInicio(event) {
    event.preventDefault();
    cargarFragmento('inicio.html');
}

function cargarClases(event) {
    event.preventDefault();
    cargarFragmento('clases.html');
}

function passGenerator(event) {
    event.preventDefault();
    cargarFragmento('pass.html');
}
function tareas(event) {
    event.preventDefault();
    cargarFragmento('tareas.html');  
}

function notas(event) {
    event.preventDefault();
    cargarFragmento('notas.html'); 
}

function agenda(event) {
    event.preventDefault();
    cargarFragmento('agenda.html'); //agenda.html aun no esta creada
}


// ===== FORMULARIOS =====

// Función para actualizar la máscara según el valor seleccionado
function actualizarMascara(valor) {
    const campoMascara = document.getElementById('mascara');
    if (!campoMascara) return;
    if (valor === 'Máscaras') {
        campoMascara.value = '';
        return;
    }
    const bits = parseInt(valor, 10);
    if (!Number.isInteger(bits)) return;
    campoMascara.value = prefijoAMascara(bits).join('.');
}

// Validación en vivo del campo de IP tras cargar cada fragmento
function prepararValidacionIP() {
    const inputIP = document.getElementById('ip');
    if (!inputIP) return;

    const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    inputIP.addEventListener('input', function () {
        const valor = this.value.trim();
        if (!valor) {
            this.classList.remove('is-valid');
            this.classList.remove('is-invalid');
            return;
        }
        if (ipPattern.test(valor)) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
    });
}
