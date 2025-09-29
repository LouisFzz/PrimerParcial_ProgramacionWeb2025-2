// Verificar si está autenticado al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, verificando autenticación...');
    
    const user = localStorage.getItem('user');
    if (!user) {
        console.log('No hay usuario autenticado, redirigiendo a login...');
        window.location.href = 'index.html';
        return;
    }
    
    const userData = JSON.parse(user);
    console.log('Usuario autenticado:', userData);
    
    // Mostrar información del usuario
    document.getElementById('userCode').textContent = `Código: ${userData.codigo}`;
    document.getElementById('userName').textContent = `Nombre: ${userData.nombre}`;
    
    // Cargar notas del estudiante
    console.log('Cargando notas para código:', userData.codigo);
    loadNotas(userData.codigo);
    
    // Manejar cierre de sesión
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
});

function loadNotas(codigo) {
    console.log('Iniciando carga de notas...');
    
    // Mostrar mensaje de carga
    const notasBody = document.getElementById('notasBody');
    notasBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Cargando notas...</td></tr>';
    
    fetch(`https://24a0dac0-2579-4138-985c-bec2df4bdfcc-00-3unzo70c406dl.riker.replit.dev/students/${codigo}/notas`)
        .then(response => {
            console.log('Respuesta del servidor:', response.status);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(notas => {
            console.log('Notas recibidas:', notas);
            displayNotas(notas);
            calcularPromedioPonderado(notas);
        })
        .catch(error => {
            console.error('Error cargando notas:', error);
            notasBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error al cargar las notas: ${error.message}</td></tr>`;
        });
}

function displayNotas(notas) {
    const notasBody = document.getElementById('notasBody');
    notasBody.innerHTML = '';
    
    if (!notas || notas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center;">No se encontraron notas registradas</td>`;
        notasBody.appendChild(row);
        return;
    }
    
    notas.forEach(asignatura => {
        const definitiva = calcularDefinitiva(asignatura);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asignatura.nombre || 'N/A'}</td>
            <td>${asignatura.creditos || '0'}</td>
            <td>${asignatura.P1 !== undefined ? asignatura.P1.toFixed(1) : 'N/A'}</td>
            <td>${asignatura.P2 !== undefined ? asignatura.P2.toFixed(1) : 'N/A'}</td>
            <td>${asignatura.P3 !== undefined ? asignatura.P3.toFixed(1) : 'N/A'}</td>
            <td>${asignatura.EF !== undefined ? asignatura.EF.toFixed(1) : 'N/A'}</td>
            <td><strong>${definitiva.toFixed(2)}</strong></td>
        `;
        
        notasBody.appendChild(row);
    });
}

function calcularDefinitiva(asignatura) {
    // Calcular la definitiva según la fórmula: (P1 + P2 + P3 + EF) / 4
    const P1 = asignatura.P1 || 0;
    const P2 = asignatura.P2 || 0;
    const P3 = asignatura.P3 || 0;
    const EF = asignatura.EF || 0;
    
    return (P1 + P2 + P3 + EF) / 4;
}

function calcularPromedioPonderado(notas) {
    if (!notas || notas.length === 0) {
        document.getElementById('promedioPonderado').textContent = '0.00';
        return;
    }
    
    let sumaPonderada = 0;
    let totalCreditos = 0;
    
    notas.forEach(asignatura => {
        const definitiva = calcularDefinitiva(asignatura);
        const creditos = asignatura.creditos || 0;
        sumaPonderada += definitiva * creditos;
        totalCreditos += creditos;
    });
    
    const promedio = totalCreditos > 0 ? sumaPonderada / totalCreditos : 0;
    document.getElementById('promedioPonderado').textContent = promedio.toFixed(2);
}