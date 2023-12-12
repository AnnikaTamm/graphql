// "use strict";
// // api https://01.kood.tech/api/auth/signin
// // document.addEventListener('DOMContentLoaded', function() {
// //     const loginForm = document.getElementById('login');
// //     if (loginForm) {
// //         loginForm.addEventListener('submit', function(event) {
// //             event.preventDefault();
// //             window.location.href = '/graphql';
// //         });
// //     }
// // });

document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('login');
    var logoutBtn = document.getElementById('logoutBtn'); // If you have a logout button
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const getInput = (id) => {
                const field = document.getElementById(id);
                if (field instanceof HTMLInputElement) {
                    return field.value;
                }
                return '';
            };
            const username = getInput('username');
            const password = getInput('password');
            authenticateUser(username, password);
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (event) {
            // Handle logout logic
            // e.g., clear the stored JWT, redirect to login page, etc.
        });
    }
});
function authenticateUser(username, password) {
    var credentials = btoa(username + ':' + password); // Base64 encode the credentials
    fetch('https://01.kood.tech/api/auth/signin', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + credentials
        }
    })
        .then(response => {
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    })
        .then(data => {
        // Store the JWT, perhaps in localStorage or sessionStorage
        // localStorage.setItem('jwt', data.jwt);
        // Redirect to the GraphQL page or change UI state
    })
        .catch(error => {
            console.log(error)
        alert(error.message);
        // Handle errors, show login failure message
    });
}
// // const loginfunction = async () => {
// //     const username = document.getElementById('username').value;
// //     const password = document.getElementById('password').value;
// //     const url = 'https://01.kood.tech/api/auth/signin';
// //     const options = {
// //         method: 'POST',
// //         headers: {
// //             'Content-Type': 'application/json',
// //             'Contenct-encoding': 'base64',
// //             'authorization': 'Basic ' + btoa(username + ":" + password),
// //         },
// //     };
// //     try {
// //         const response = await fetch(url, options)
// //         handleLoginResponse(response)
// //     } catch (error) {
// //         console.error(error)
// //     }
// // }
// // const handleLoginResponse = async (response) => {
// //     const data = await response.json()
// //     if (response.status === 200) {
// //         window.location.href = '/graphql.html';
// //     } else {
// //         alert(data.message)
// //     }
// // }
// // fetch(url, options)
// // .then((response) => response.json())
// // .then((result) => {
// //     console.log(result);
// //     alert(result.message);
// //     if (result.success) { // Assuming 'success' is a field in your response
// //         window.location.href = '/graphql.html';
// //     }
// // });


