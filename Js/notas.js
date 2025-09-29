document.addEventListener('DOMContentLoaded', function() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const userData = JSON.parse(user);
    
    document.getElementById('userCode').textContent = userData.codigo;
    document.getElementById('userName').textContent = userData.nombre;
    
    loadNotas(userData.codigo);
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
});

function loadNotas(codigo) {
    const url = `https://24a0dac0-2579-4138-985c-bec2df4bdfcc-00-3unzo70c406dl.riker.replit.dev/students/${codigo}/notas`;
    
    const notasBody = document.getElementById('notasBody');
    notasBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Cargando notas...</td></tr>';
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(text => {
            if (!text || text.trim() === '') {
                throw new Error('Respuesta vacía del servidor');
            }
            
            const data = JSON.parse(text);
            return data;
        })
        .then(data => {
            let notasArray = [];
            
            if (data && data.notas && Array.isArray(data.notas)) {
                notasArray = data.notas;
            } else if (Array.isArray(data)) {
                notasArray = data;
            } else {
                throw new Error('Estructura de datos no reconocida');
            }
            
            displayNotas(notasArray);
            calcularPromedioPonderado(notasArray);
        })
        .catch(error => {
            const notasBody = document.getElementById('notasBody');
            notasBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">
                Error al cargar las notas: ${error.message}
            </td></tr>`;
        });
}

function convertirNota(notaString) {
    if (!notaString && notaString !== 0) return 0;
    if (typeof notaString === 'number') return notaString;
    
    const numero = parseFloat(notaString.toString().replace(',', '.'));
    return isNaN(numero) ? 0 : numero;
}

function displayNotas(notas) {
    const notasBody = document.getElementById('notasBody');
    notasBody.innerHTML = '';
    
    if (!notas || !Array.isArray(notas) || notas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center;">No se encontraron notas registradas</td>`;
        notasBody.appendChild(row);
        return;
    }
    
    notas.forEach((asignatura) => {
        const nombre = asignatura.asignatura || asignatura.nombre || 'N/A';
        const creditos = asignatura.creditos || '0';
        
        const P1 = convertirNota(asignatura.n1 || asignatura.P1);
        const P2 = convertirNota(asignatura.n2 || asignatura.P2);
        const P3 = convertirNota(asignatura.n3 || asignatura.P3);
        const EF = convertirNota(asignatura.ex || asignatura.EF);
        
        const definitiva = calcularDefinitiva({ P1, P2, P3, EF });
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nombre}</td>
            <td>${creditos}</td>
            <td>${P1 !== 0 ? P1.toFixed(1) : 'N/A'}</td>
            <td>${P2 !== 0 ? P2.toFixed(1) : 'N/A'}</td>
            <td>${P3 !== 0 ? P3.toFixed(1) : 'N/A'}</td>
            <td>${EF !== 0 ? EF.toFixed(1) : 'N/A'}</td>
            <td><strong>${definitiva.toFixed(1)}</strong></td>
        `;
        
        notasBody.appendChild(row);
    });
}

function calcularDefinitiva(asignatura) {
    const P1 = convertirNota(asignatura.P1);
    const P2 = convertirNota(asignatura.P2);
    const P3 = convertirNota(asignatura.P3);
    const EF = convertirNota(asignatura.EF);
    
    const definitiva = (P1 + P2 + P3 + EF) / 4;
    return definitiva;
}

function calcularPromedioPonderado(notas) {
    if (!notas || !Array.isArray(notas) || notas.length === 0) {
        document.getElementById('promedioPonderado').textContent = '0.00';
        return;
    }
    
    let sumaPonderada = 0;
    let totalCreditos = 0;
    
    notas.forEach(asignatura => {
        const P1 = convertirNota(asignatura.n1 || asignatura.P1);
        const P2 = convertirNota(asignatura.n2 || asignatura.P2);
        const P3 = convertirNota(asignatura.n3 || asignatura.P3);
        const EF = convertirNota(asignatura.ex || asignatura.EF);
        
        const definitiva = (P1 + P2 + P3 + EF) / 4;
        const creditos = parseInt(asignatura.creditos) || 0;
        
        sumaPonderada += definitiva * creditos;
        totalCreditos += creditos;
    });
    
    const promedio = totalCreditos > 0 ? sumaPonderada / totalCreditos : 0;
    document.getElementById('promedioPonderado').textContent = promedio.toFixed(2);
}
