const loadProfile = async () => { 
    const jwtToken = sessionStorage.getItem('currentSession'); // Retrieving the token
    if (jwtToken) {
        document.getElementById("logoutButton").addEventListener("click", () => {
            sessionStorage.removeItem("currentSession")
            window.location.href = "/index"
        })

        const usefInfo = await getUserData(jwtToken);

        createUserProfile(usefInfo);

    
    } else {
        window.location.href = "/index" 
    }
}

const getUserData = async (jwtToken) => {   

    const queryObject = {
        query: `
            query {
                
                    user {
                      id
                      login
                        firstName
                        lastName
                    }
                  
            }
        `
    }

    const result = await getResults(queryObject, jwtToken)

    console.log("Response from getResults:", result);


    const userData = {
        login: result.data.user.login,
        firstName: result.data.user.firstName,
        lastName: result.data.user.lastName
    }
    return userData


}

const getResults = async (queryObject, jwtToken) => {

    const url = "https://01.kood.tech/api/graphql-engine/v1/graphql"

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer"  + jwtToken 
        },
        body: JSON.stringify(queryObject)
    }
    try {
        const response = await fetch(url, options)
        if(response.ok) {
            const result = await response.json()
            console.log(result[0])
            return result
        } else {
            console.log("ERRORORORORORO")
        }
    } catch (error) {
        console.error(error)
    }
}

const createUserProfile = (userData) => {
    
        document.getElementById("firstName").textContent = userData.firstName;
        document.getElementById("lastName").textContent = userData.lastName;
        document.getElementById("username").textContent = userData.login;
    }


window.onload = loadProfile;



