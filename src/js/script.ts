// api https://01.kood.tech/api/auth/signin




document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm') as HTMLFormElement;

    loginForm.addEventListener('submit', function(event: Event) {
        event.preventDefault();

        const usernameInput = document.getElementById('username') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        const errorElement = document.getElementById('error') as HTMLElement;

        const username = usernameInput.value;
        const password = passwordInput.value;

        if (!username || !password) {
            errorElement.textContent = 'Username and password are required';
            return;
        }

        login(username, password, errorElement);
    });
});

async function login(username: string, password: string, errorElement: HTMLElement): Promise<void> {
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
