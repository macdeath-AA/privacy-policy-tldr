document.getElementById("summarize").addEventListener("click", async () => {
    chrome.tabs.query({active:true, currentWindow:true}, (tabs) => {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id },
            function: extractTextandSummarize
        });
    });
});

async function extractTextandSummarize() {
    const bodyText = document.body.innerText;
    const apiKey = 'AIzaSyAc7JVp6SKsecbxm7pltUm1bMmANJ5pTlY'
    
    const prompt = `Summarize the following privacy policy in 3-5 bullet points. Highlight data collection, sharing, and storage. Rate risk as Low, Moderate, or High.\n\n${bodyText}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const requestBody = {
        contents: [
            {
                parts: [
                    {text: prompt}
                ]
            }
        ]
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'appplication/json'
        }, 
        body: JSON.stringify(requestBody)
    });

    
    console.log(response.output_text);

    const data = await response.json();
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to get summary.";
    
    chrome.runtime.sendMessage({ summary });
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.summary) {
        const summaryText = request.summary;
        document.getElementById('summary').innerText = summaryText;

        if (summaryText.includes('High')){
            document.getElementById('risk').innerHTML = `<span class = 'risk high>High Risk</span>`;
        } else if (summaryText.includes('Moderate')) {
            document.getElementById('risk').innerHTML = `<span class = 'risk moderate>Moderate Risk</span>`;
        } else {
            document.getElementById('risk').innerHTML = `<span class = 'risk low>Low Risk</span>`;
        }

    }
})