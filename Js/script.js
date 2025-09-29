
document.addEventListener('DOMContentLoaded', function() {
    const user = localStorage.getItem('user');
    if (user) {
        window.location.href = 'notas.html';
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const codigo = document.getElementById('codigo').value.trim();
        const password = document.getElementById('password').value;
    
        if (!codigo) {
            showError('Por favor ingrese su código de estudiante');
            return;
        }
        
        if (!password) {
            showError('Por favor ingrese su contraseña');
            return;
        }
        
        if (password !== '1234') {
            showError('Credenciales no válidas');
            return;
        }
 
        loginBtn.disabled = true;
        loginBtn.textContent = 'Verificando...';
        
        checkStudentExists(codigo)
            .then(studentExists => {
                if (!studentExists) {
                    throw new Error('Código de estudiante no válido');
                }
                
                return fetch('https://24a0dac0-2579-4138-985c-bec2df4bdfcc-00-3unzo70c406dl.riker.replit.dev/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        codigo: codigo,
                        clave: password
                    })
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Credenciales no válidas');
                }
                return response.json();
            })
            .then(user => {
            
                return fetch(`https://24a0dac0-2579-4138-985c-bec2df4bdfcc-00-3unzo70c406dl.riker.replit.dev/students/${codigo}/notas`)
                    .then(notasResponse => {
                        if (!notasResponse.ok) {
                            throw new Error('El estudiante no tiene notas registradas');
                        }
                        return notasResponse.json();
                    })
                    .then(notas => {
                   
                        localStorage.setItem('user', JSON.stringify(user));
                        window.location.href = 'notas.html';
                    });
            })
            .catch(error => {
                console.error('Error en login:', error);
                if (error.message.includes('Código de estudiante no válido')) {
                    showError('Código de estudiante no válido');
                } else if (error.message.includes('no tiene notas')) {
                    showError('El estudiante no tiene notas registradas');
                } else {
                    showError('Credenciales no válidas');
                }
            })
            .finally(() => {
            
                loginBtn.disabled = false;
                loginBtn.textContent = 'Iniciar Sesión';
            });
    });
    
    function checkStudentExists(codigo) {
        return fetch('https://24a0dac0-2579-4138-985c-bec2df4bdfcc-00-3unzo70c406dl.riker.replit.dev/students')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al verificar estudiante');
                }
                return response.json();
            })
            .then(students => {
                return students.some(student => student.codigo == codigo);
            })
            .catch(error => {
                console.error('Error verificando estudiante:', error);
                return false;
            });
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        document.getElementById('codigo').value = '';
        document.getElementById('password').value = '';

        document.getElementById('codigo').focus();
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});