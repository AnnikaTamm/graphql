const loadProfile = async () => { 
    const jwtToken = sessionStorage.getItem("currentSession"); 
    if (jwtToken) {
       
        document.getElementById("logoutButton").addEventListener("click", () => {
            sessionStorage.removeItem("currentSession")
            window.location.href = "/index"
        })
    
        const userData = await getUserData(jwtToken);
        const xpData = await xpByProject(jwtToken);

        const xpDataForGraph = xpData.map(item => ({
            amountInKb: item.amount / 1000, 
            projectName: item.path          
        }));

        renderXpGraph(xpDataForGraph);
        createUserProfile(userData);
        console.log("userData", userData)
  
        console.log("Fetched xpData:", xpData);

      
    } else {
        window.location.href = "/index" 
    }
}

const renderXpGraph = (xpDataForGraph) => {
    if (!xpDataForGraph || xpDataForGraph.length === 0) {
        console.error("No XP data available for rendering the graph.");
        return;
    }

    const totalXP = xpDataForGraph.reduce((acc, data) => acc + data.amountInKb, 0);

    const maxXP = Math.max(...xpDataForGraph.map(data => data.amountInKb));

    const svg = document.getElementById('xpGraph');
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    const barHeight = svgHeight / xpDataForGraph.length;
    const nameColumnWidth = 100; 

    let svgContent = `<text x="50%" y="20" font-size="14" text-anchor="middle" fill="black">Total XP: ${totalXP.toFixed(1)} kb</text>`; // Total XP text at the top

    svgContent += xpDataForGraph.map((data, index) => {
        const barWidth = ((data.amountInKb / maxXP) * (svgWidth - nameColumnWidth));
        const y = barHeight * index + 30; 
        const rect = `<rect width="${barWidth}" height="${barHeight - 10}" y="${y}" x="${nameColumnWidth}" fill="grey"></rect>`;

        const textY = y + (barHeight / 2);

        const text = `<text x="5" y="${textY}" font-size="12" alignment-baseline="middle">${data.projectName}</text>`;

        const kbTextX = nameColumnWidth + barWidth + 5;
        const kbText = `<text x="${kbTextX}" y="${textY}" font-size="12" fill="black" alignment-baseline="middle">${data.amountInKb.toFixed(1)} kb</text>`;

        return rect + text + kbText;
    }).join('');

    svg.innerHTML = svgContent;
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
                        auditRatio 
                        attrs
                        totalUp
                        totalDown
            }
            }
      `
    }

    const result = await getResults(queryObject, jwtToken)

    userInfo = result.data.user[0] 
    
    const userData = {
        id: userInfo.id,
        login: userInfo.login,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        auditRatio: userInfo.auditRatio,
        attribute: userInfo.attrs,
        totalUp: userInfo.totalUp,
        totalDown: userInfo.totalDown,
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
            
            return result
     
        } else {
            console.log("error", response.status, response.statusText)
        }
    } catch (error) {
        console.error(error)
    }
}

const xpByProject = async (jwtToken) => {
    const queryObject = {
        variables: {
            transactionType: "xp",
        },
        query: `
            query GetXpByProject($transactionType: String!) {
                transaction(
                    where: {
                        path: { _regex: "^\\/johvi\\/div-01\\/[-\\\\w]+$" }
                        type: { _eq: $transactionType }
                    },
                    order_by: { amount: asc }
                ) {
                    amount
                    path
                }
            }
        
        `
    }

    
    const result = await getResults(queryObject, jwtToken);
    if (result && result.data && result.data.transaction) {
        const xpData = result.data.transaction.map((transaction) => {
            const updatedPath = transaction.path.replace("/johvi/div-01/", "");
            return { ...transaction, path: updatedPath };
        });
        return xpData;
    } else {
        console.error("Transaction data not found in the response");
        return []; // Return an empty array or handle the error as appropriate
    }
}

const createUserProfile = (userData) => { 
    document.getElementById("firstName").textContent = userData.firstName;
    document.getElementById("lastName").textContent = userData.lastName;
    document.getElementById("login").textContent = userData.login;
    document.getElementById("email").textContent = userData.email;
    document.getElementById("auditRatio").textContent = parseFloat(userData.auditRatio).toFixed(2);
    document.getElementById("attribute").textContent = userData.attribute.addressCity;
    document.getElementById("totalUp").textContent = parseFloat(userData.totalUp/1000).toFixed(0)+` kb`;
    document.getElementById("totalDown").textContent = parseFloat(userData.totalDown/1000).toFixed(0)+` kb`;
}

window.onload = loadProfile;



