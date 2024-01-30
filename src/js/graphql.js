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
        

        const transactionDates = await fetchTransactionDates(jwtToken);
        if (transactionDates && transactionDates.length > 0) {
            renderProgressGraph(transactionDates);
        } else {
            console.error("No transaction dates available for rendering the progress graph.");
        }



        
        console.log("userData", userData)
        console.log("Fetched xpData:", xpData);
        console.log("test")

      
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

    let svgContent = `<text x="50%" y="20" font-size="14" text-anchor="middle" fill="black">Total XP: ${totalXP.toFixed(0)} kb</text>`; // Total XP text at the top

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

const fetchTransactionDates = async (jwtToken) => {
    const queryObject = {
      
        query: `
        {
            transaction(
                where: {
                    path: { _regex: "^\\/johvi\\/div-01\\/[-\\\\w]+$" }
                    type: { _eq: "xp" }
                },
                order_by: { createdAt: asc }
            ) {

                amount
                createdAt
            }
        }
        `
    }

    const result = await getResults(queryObject, jwtToken);
    if (result && result.data && result.data.transaction) {
        // Sort transactions by date in ascending order
        const sortedTransactions = result.data.transaction.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );

        // Accumulate XP values
        let accumulatedXp = 0;
        const accumulatedData = sortedTransactions.map(transaction => {
            accumulatedXp += transaction.amount;
            return {
                date: new Date(transaction.createdAt), // Ensure it is a Date object
                accumulatedXp: accumulatedXp/1000 // Convert to kb
            };
        });
       
        return accumulatedData;
    } else {
        console.error("No transaction dates found in the response");
        return [];
    }
}

const renderProgressGraph = (transactionData) => {
    console.log("Transaction data:", transactionData);
    
    const margin = { top: 20, right: 20, bottom: 150, left: 40 };

    const pointWidthMultiplier = 100; // Increased from 50 to 100
    const baseWidth = 800; // Increased base width
    const width = Math.max(baseWidth, transactionData.length * pointWidthMultiplier) - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG element
    const svg = d3.select("#progressGraph")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate the start date with a month buffer before the earliest date in the data
    const startDate = new Date(d3.min(transactionData, d => d.date));
    startDate.setMonth(startDate.getMonth() - 1);

    // Create scales
    const x = d3.scaleTime()
        .domain([startDate, d3.extent(transactionData, d => d.date)[1]]) // Use the calculated start date
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(transactionData, d => d.accumulatedXp)])
        .nice()
        .range([height, 0]);

    const line = d3.line()
        .defined(d => !isNaN(d.date) && !isNaN(d.accumulatedXp))
        .x(d => x(d.date))
        .y(d => y(d.accumulatedXp))
        .curve(d3.curveMonotoneX);

    // Append the path using the line generator with inline styling
    svg.append("path")
        .datum(transactionData)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue") // Set the stroke color
        .attr("stroke-width", 2); // Set the stroke width

    // Create and append the dots
    svg.selectAll("dot")
        .data(transactionData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.accumulatedXp))
        .attr("r", 5) // Adjust the radius as needed
        .attr("fill", "steelblue"); // Adjust the color as needed

    // Add date labels underneath each dot
    svg.selectAll("dateLabel")
        .data(transactionData)
        .enter()
        .append("text")
        .attr("x", d => x(d.date))
        .attr("y", height + margin.bottom / 2)
        .attr("transform", d => `rotate(-90, ${x(d.date)}, ${height + margin.bottom / 2})`)
        .text(d => formatDate(d.date)) 
        
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .attr("dx", "-.8em")
        .attr("dy", ".15em");

    // Modify the X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%Y")));

    // Create Y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add X-axis label
    // svg.append("text")
    //     .attr("x", width / 2)
    //     .attr("y", height + margin.bottom - 10)
    //     .style("text-anchor", "middle")
    //     .text("Date");

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left - 20)
        .style("text-anchor", "middle")
        .text("Accumulated XP in kB");
}

const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

window.onload = loadProfile;



