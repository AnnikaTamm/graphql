// "https://01.kood.tech/api/auth/signin"

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('error');

        if (!username || !password) {
            errorElement.textContent = 'Username and password are required';
            return;
        }

        login(username, password, errorElement);
    });
});

async function login(username, password, errorElement) {
    try {
        const response = await fetch('https://01.kood.tech/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(username + ':' + password)
            }
        });

        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem('currentSession', data.token);
            window.location.href = '/graphql'; // redirect to graphql page
        } else {
            errorElement.textContent = 'Invalid login credentials';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'An error occurred during login';
    }
}
