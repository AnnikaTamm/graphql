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

    let userInfo = result.data.user[0] 
    
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
                path
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

        // Accumulate XP values and include project name
        let accumulatedXp = 0;
        const accumulatedData = sortedTransactions.map(transaction => {
            accumulatedXp += transaction.amount;
            const updatedPath = transaction.path.replace("/johvi/div-01/", ""); // Extract project name
            return {
                amount: transaction.amount,
                date: new Date(transaction.createdAt),
                accumulatedXp: accumulatedXp/1000,
                projectName: updatedPath, // Include project name
            };
        });

       
        return accumulatedData;
    } else {
        console.error("No transaction dates found in the response");
        return [];
    }
}

const calculateTotalXP = (transactions) => {
    return transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
}

export {getResults, getUserData, xpByProject, fetchTransactionDates, calculateTotalXP}