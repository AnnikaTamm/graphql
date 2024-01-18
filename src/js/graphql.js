
const loadProfile = async () => { 
    const jwtToken = sessionStorage.getItem("currentSession"); // Retrieving the token
    if (jwtToken) {
          
        document.getElementById("logoutButton").addEventListener("click", () => {
            sessionStorage.removeItem("currentSession")
            window.location.href = "/index"
        })
    
        const userData = await getUserData(jwtToken);
   
        // console.log("read this", getUserData(jwtToken))
        createUserProfile(userData);
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
                        email
                    }
                  
            }
        `
    }
    const result = await getResults(queryObject, jwtToken)

    
    console.log("Response from getResults:", result);

  
    const userData = {
        id: result.data.user[0].id,
        login: result.data.user[0].login,
        firstName: result.data.user[0].firstName,
        lastName: result.data.user[0].lastName,
        email: result.data.user[0].email
    }

    return   userData

    



}

const getResults = async (queryObject, jwtToken) => {

    const url = "https://01.kood.tech/api/graphql-engine/v1/graphql"

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer "  + jwtToken 
        },
        body: JSON.stringify(queryObject)
    }
    try {
        const response = await fetch(url, options)
        if(response.ok) {
            const result = await response.json()
            
            console.log("returning2", result)
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
        document.getElementById("id").textContent = userData.id;
        document.getElementById("login").textContent = userData.login;
        document.getElementById("email").textContent = userData.email;
    

    }


window.onload = loadProfile;



