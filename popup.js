document.getElementById("summarize").addEventListener("click", async () => {
    chrome.tabs.query({active:true, currentWindow:true}, (tabs) => {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id },
            func: () => document.body.innerText,
        }, async (results) => {
            const bodyText = results[0].result;
            const summary = await extractTextandSummarize(bodyText);
            showSummary(summary);
        });
    });
});


async function loadAPIKey() {   
    const res = await fetch(chrome.runtime.getURL('secrets.json'));
    const data = await res.json();
    return data.GEMINI_API_KEY; 
}

async function extractTextandSummarize(bodyText) {
    // const bodyText = document.body.innerText;
    const apiKey = await loadAPIKey();
    
    const prompt = `You are a privacy policy summarization expert. Given the following privacy policy,
    extract only the most essential details in the format below:
    Risk Level: [Low / Moderate / High only - no explanation]
    Data Collection: [list items, comma-separated]
    Data Sharing: [brief summary of sharing destinations, comma-separated if needed]
    Data Storage: [briefly describe how/where data is stored, or if not mentioned]
    Compliances: [List any mentioned (e.g., GDPR, CCPA, HIPAA) or say 'Not mentioned']
    
    Do not add extra text or explanations.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const requestBody = {
        contents: [
            {
                parts: [
                    {text: prompt + `Policy: ${bodyText}`}
                ]
            }
        ]
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }, 
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to get summary.";
    
    return summary
}

function showSummary(summaryText) {
    
    const riskMatch = summaryText.match(/Risk Level:\s*(low|moderate|high)/i);

    let riskClass = 'low';
    let riskText = '';
    const riskIcon = '&#x26A0';


    if (riskMatch) {
        const level = riskMatch[1];
        riskClass = level.toLowerCase();
        riskText = `Risk Level: ${level}`;
        summaryText = summaryText.replace(riskMatch[0], '')
    }

    const formatted = summaryText
    .replace(/Data Collection:/i,   '<div class = "section-card"><strong>Data Collection:</strong>')
    .replace(/Data Sharing:/i, '</div><div class = "section-card"><strong>Data Sharing:</strong>')
    .replace(/Data Storage:/i, '</div><div class = "section-card"><strong>Data Storage:</strong>')
    .replace(/Compliances:/i, '</div><div class = "section-card"><strong>Compliances:</strong>')
    + '</div>';

    document.getElementById('summary').innerHTML = formatted;
    document.getElementById('risk').innerHTML = `<div class = 'risk-box risk ${riskClass}'><span class='risk-icon'>${riskIcon} ${riskText}</span></div>`;

}