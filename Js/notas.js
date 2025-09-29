// Verificar si está autenticado al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIANDO CARGA DE NOTAS ===');
    
    const user = localStorage.getItem('user');
    console.log('Usuario en localStorage:', user);
    
    if (!user) {
        console.error('❌ NO hay usuario en localStorage - Redirigiendo a login');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        console.log('✅ Usuario parseado:', userData);
        
        // Mostrar información del usuario
        document.getElementById('userCode').textContent = `Código: ${userData.codigo}`;
        document.getElementById('userName').textContent = `Nombre: ${userData.nombre}`;
        
        // Cargar notas del estudiante
        console.log('🔄 Cargando notas para código:', userData.codigo);
        loadNotas(userData.codigo);
        
        // Manejar cierre de sesión
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
        
    } catch (error) {
        console.error('❌ Error parseando usuario:', error);
        window.location.href = 'index.html';
    }
});

function loadNotas(codigo) {
    const url = `https://24a0dac0-2579-4138-985c-bec2df4bdfcc-00-3unzo70c406dl.riker.replit.dev/students/${codigo}/notas`;
    console.log('📡 Haciendo petición a:', url);
    
    // Mostrar mensaje de carga
    const notasBody = document.getElementById('notasBody');
    notasBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: blue;">Cargando notas...</td></tr>';
    
    fetch(url)
        .then(response => {
            console.log('📨 Respuesta recibida - Status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response.text();
        })
        .then(text => {
            console.log('📄 Respuesta en texto:', text);
            
            if (!text || text.trim() === '') {
                throw new Error('Respuesta vacía del servidor');
            }
            
            try {
                const data = JSON.parse(text);
                console.log('✅ JSON parseado correctamente:', data);
                return data;
            } catch (jsonError) {
                console.error('❌ Error parseando JSON:', jsonError);
                throw new Error('Formato de respuesta inválido');
            }
        })
        .then(data => {
            console.log('✅ Datos recibidos:', data);
            
            // EXTRAER EL ARRAY DE NOTAS DEL OBJETO
            let notasArray = [];
            
            if (data && data.notas && Array.isArray(data.notas)) {
                console.log('📊 Notas encontradas en data.notas:', data.notas);
                notasArray = data.notas;
            } else if (Array.isArray(data)) {
                console.log('📊 Notas son directamente un array:', data);
                notasArray = data;
            } else {
                console.warn('⚠️ Estructura de datos inesperada:', data);
                throw new Error('Estructura de datos no reconocida');
            }
            
            console.log('📊 Número de asignaturas:', notasArray.length);
            
            if (notasArray.length > 0) {
                console.log('📝 Primera asignatura:', notasArray[0]);
            }
            
            displayNotas(notasArray);
            calcularPromedioPonderado(notasArray);
        })
        .catch(error => {
            console.error('❌ Error cargando notas:', error);
            notasBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">
                Error al cargar las notas: ${error.message}
            </td></tr>`;
        });
}

// Función para convertir string con coma a número
function convertirNota(notaString) {
    if (!notaString && notaString !== 0) return 0;
    if (typeof notaString === 'number') return notaString;
    
    // Reemplazar coma por punto y convertir a número
    const numero = parseFloat(notaString.toString().replace(',', '.'));
    return isNaN(numero) ? 0 : numero;
}

function displayNotas(notas) {
    console.log('🎨 Mostrando notas en la tabla...');
    const notasBody = document.getElementById('notasBody');
    
    if (!notasBody) {
        console.error('❌ No se encontró el elemento notasBody en el DOM');
        return;
    }
    
    notasBody.innerHTML = '';
    
    if (!notas || !Array.isArray(notas) || notas.length === 0) {
        console.warn('⚠️ No hay notas para mostrar');
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center; color: orange;">
            No se encontraron notas registradas para este estudiante
        </td>`;
        notasBody.appendChild(row);
        return;
    }
    
    console.log(`📋 Mostrando ${notas.length} asignaturas`);
    
    notas.forEach((asignatura, index) => {
        console.log(`Asignatura ${index + 1}:`, asignatura);
        
        // MAPEAR Y CONVERTIR LAS NOTAS
        const nombre = asignatura.asignatura || asignatura.nombre || 'N/A';
        const creditos = asignatura.creditos || '0';
        
        // CONVERTIR strings con comas a números
        const P1 = convertirNota(asignatura.n1 || asignatura.P1);
        const P2 = convertirNota(asignatura.n2 || asignatura.P2);
        const P3 = convertirNota(asignatura.n3 || asignatura.P3);
        const EF = convertirNota(asignatura.ex || asignatura.EF);
        
        const definitiva = calcularDefinitiva({ P1, P2, P3, EF });
        
        console.log(`Notas convertidas - P1: ${P1}, P2: ${P2}, P3: ${P3}, EF: ${EF}, Definitiva: ${definitiva}`);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nombre}</td>
            <td>${creditos}</td>
            <td>${P1 !== 0 ? P1.toFixed(1) : 'N/A'}</td>
            <td>${P2 !== 0 ? P2.toFixed(1) : 'N/A'}</td>
            <td>${P3 !== 0 ? P3.toFixed(1) : 'N/A'}</td>
            <td>${EF !== 0 ? EF.toFixed(1) : 'N/A'}</td>
            <td><strong>${definitiva.toFixed(2)}</strong></td>
        `;
        
        notasBody.appendChild(row);
    });
    
    console.log('✅ Tabla de notas actualizada correctamente');
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
    console.log('🧮 Calculando promedio ponderado...');
    
    if (!notas || !Array.isArray(notas) || notas.length === 0) {
        console.warn('⚠️ No hay notas para calcular promedio');
        document.getElementById('promedioPonderado').textContent = '0.00';
        return;
    }
    
    let sumaPonderada = 0;
    let totalCreditos = 0;
    
    notas.forEach(asignatura => {
        // Convertir las notas
        const P1 = convertirNota(asignatura.n1 || asignatura.P1);
        const P2 = convertirNota(asignatura.n2 || asignatura.P2);
        const P3 = convertirNota(asignatura.n3 || asignatura.P3);
        const EF = convertirNota(asignatura.ex || asignatura.EF);
        
        const definitiva = (P1 + P2 + P3 + EF) / 4;
        const creditos = parseInt(asignatura.creditos) || 0;
        
        sumaPonderada += definitiva * creditos;
        totalCreditos += creditos;
        
        console.log(`Asignatura: ${asignatura.asignatura}, Definitiva: ${definitiva.toFixed(2)}, Créditos: ${creditos}`);
    });
    
    const promedio = totalCreditos > 0 ? sumaPonderada / totalCreditos : 0;
    console.log('✅ Promedio calculado:', promedio.toFixed(2), 'Suma:', sumaPonderada, 'Créditos:', totalCreditos);
    
    document.getElementById('promedioPonderado').textContent = promedio.toFixed(2);
}
