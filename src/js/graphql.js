


const loadProfile = async () => { 
    const jwtToken = sessionStorage.getItem("currentSession"); 
    if (jwtToken) {
       
        document.getElementById("logoutButton").addEventListener("click", () => {
            sessionStorage.removeItem("currentSession")
            window.location.href = "/index"
        })
    
        const userData = await getUserData(jwtToken);
        const xpData = await xpByProject(jwtToken);
      // Assuming you've awaited xpByProject somewhere above


        const xpDataForGraph = xpData.map(item => ({
            amountInKb: item.amount / 1000, 
            projectName: item.path          
        }));

        renderXpGraph(xpDataForGraph);
        createUserProfile(userData);
        

        const transactionDates = await fetchTransactionDates(jwtToken);
        if (transactionDates && transactionDates.length > 0) {
            renderProgressGraph(transactionDates, xpData);
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

    const maxXP = Math.max(...xpDataForGraph.map(data => data.amountInKb));

    const margin = { left: 150, right: 10 }; // Margin on the right for the amounts
    const barPadding = 10;
    const barHeight = 20;
    const requiredHeight = xpDataForGraph.length * (barHeight + barPadding);

    const svgContainer = d3.select('#xpGraph');
    const svgWidth = svgContainer.node().getBoundingClientRect().width;
    const svg = svgContainer.html('').attr('width', svgWidth).attr('height', requiredHeight);

    // Define the scale for the width of the bars
    const xScale = d3.scaleLinear()
        .domain([0, maxXP])
        .range([0, svgWidth - margin.left - margin.right]);



    // Add a group element to offset the chart for padding within the SVG
    const chartGroup = svg.append('g').attr('transform', `translate(${margin.left}, 0)`);

    // Add bars to the chart
    const bars = chartGroup.selectAll('.bar')
        .data(xpDataForGraph)
        .enter()
        .append('g')
        .attr('class', 'bar-group');

    bars.append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', (d, i) => i * (barHeight + barPadding))
        .attr('width', d => xScale(d.amountInKb))
        .attr('height', barHeight)
        .attr('fill', 'rgba(70, 130, 180, 0.6)');

    // Add text labels for each bar for the task names
    bars.append('text')
        .attr('class', 'label')
        .attr('x', -10) // Shift labels to the left of the bars
        .attr('y', (d, i) => i * (barHeight + barPadding) + barHeight / 2)
        .attr('dy', '.35em') // vertical-align: middle
        .attr('text-anchor', 'end') // right-align text
        .text(d => d.projectName);

    // Add text at the exact end of the bar, flush with the end, and right-aligned
    bars.append('text')
        .attr('class', 'amount-kb')
        .attr('x', d => xScale(d.amountInKb) - 2) // Position at the exact end of the bar
        .attr('y', (d, i) => i * (barHeight + barPadding) + barHeight / 2)
        .attr('dy', '.35em') // vertical-align: middle
        .style('text-anchor', 'end') // right-align text
        .text(d => `${d.amountInKb.toFixed(1)} kB`);



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
                amount: transaction.amount,
                date: new Date(transaction.createdAt), // Ensure it is a Date object
                accumulatedXp: accumulatedXp/1000, // Convert to kb
                
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
    
    const margin = { top: 30, right: 20, bottom: 60, left: 70 };

    const pointWidthMultiplier = 200; // Increased from 50 to 100
    const baseWidth = 1000; // Increased base width
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

    const currentDate = new Date();

    // Find the latest date in your data or use the current date if it's later
    const latestDate = new Date(Math.max(d3.max(transactionData, d => d.date), currentDate));

    // Create scales
    const x = d3.scaleTime()
        .domain([startDate, latestDate]) // Adjusted domain
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

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "140px") // Increased from 120px
        .style("height", "40px") // Increased from 28px
        .style("padding", "6px") // Increased from 4px
        .style("font", "bold 14px sans-serif") // Made font bolder and slightly larger
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Create and append the dots
    svg.selectAll("dot")
        .data(transactionData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.accumulatedXp))
        .attr("r", 5)
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(formatTooltip(d))
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    const formatTooltip = (d) => {
            return 'Date: ' + formatDate(d.date) + '<br/>' + '+ ' + (d.amount / 1000).toFixed(1) + ' kB';
        }


    // Create Y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add Y grid lines
    svg.append("g")     
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width) // Extend the lines across the full width of the chart
            .tickFormat("")   // Remove the text labels from the grid lines
        )
        .style("color", "#e5e5e5") // The color of the grid lines, set as needed
        .style("stroke-dasharray", "3,3") // Optional: this styles the lines as dashed
        .lower(); 

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%m/%Y')));

    // Add X-axis label
    svg.append("text")
        .attr("x", 0) // x-coordinate at the origin (left side)
        .attr("y", height) // y-coordinate just below the x-axis
        .attr("dy", "2em") // slight offset downwards to avoid overlap with the axis
        .style("text-anchor", "start")
        .text("Date");

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
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


