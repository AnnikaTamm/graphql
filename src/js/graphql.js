import { renderXpGraph, renderProgressGraph } from "./render-graphql.js";
import { getUserData, xpByProject, fetchTransactionDates, calculateTotalXP } from "./data-fetching.js";

const loadProfile = async () => { 
    const jwtToken = sessionStorage.getItem("currentSession"); 
    if (jwtToken) {
        document.getElementById("logoutButton").addEventListener("click", () => {
            sessionStorage.removeItem("currentSession")
            window.location.href = "/index"
        })

        const userData = await getUserData(jwtToken);
        const xpData = await xpByProject(jwtToken);
        const totalXP = calculateTotalXP(xpData);

        const xpDataForGraph = xpData.map(item => ({
            amountInKb: item.amount / 1000, 
            projectName: item.path          
        }));
        const totalXPElement = document.getElementById("totalXP");
        if (totalXPElement) {
            totalXPElement.textContent = `${(totalXP / 1000).toFixed(0)} kB`; // Convert to kilobytes and format
        } else {
            console.error("Element with ID 'totalXP' not found.");
        }

        renderXpGraph(xpDataForGraph);
        createUserProfile(userData);
        console.log("totalxp", totalXP/1000);
        
        const transactionDates = await fetchTransactionDates(jwtToken);
        if (transactionDates && transactionDates.length > 0) {
            renderProgressGraph(transactionDates, xpData);
        } else {
            console.error("No transaction dates available for rendering the progress graph.");
        }
      
    } else {
        window.location.href = "/index" 
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


