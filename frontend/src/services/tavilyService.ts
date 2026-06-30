const TAVILY_KEY = import.meta.env.VITE_TAVILY_KEY;

export async function searchMarketNews(query: string) {
  if (!TAVILY_KEY || TAVILY_KEY === 'your_key_here') {
    return { success: false, answer: "Tavily API key not configured.", results: [] };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
        include_domains: [
          "reuters.com", "bloomberg.com", "techcrunch.com", 
          "forbes.com", "wsj.com", "businessinsider.com"
        ]
      })
    });

    if (!response.ok) throw new Error(`Tavily error: ${response.status}`);
    
    const data = await response.json();
    
    return {
      success: true,
      answer: data.answer,
      results: data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content.substring(0, 200) + "...",
        publishedDate: r.published_date,
        source: new URL(r.url).hostname.replace("www.", "")
      }))
    };
  } catch (error) {
    console.error("Tavily error:", error);
    return { success: false, answer: null, results: [] };
  }
}

export async function getCompetitorIntel(companyName: string) {
  return searchMarketNews(`${companyName} enterprise software news funding 2026`);
}

export async function getMarketTrends() {
  return searchMarketNews("B2B SaaS sales pipeline enterprise software market trends 2026");
}

export async function getIndustryNews(dealName: string, companyName: string) {
  return searchMarketNews(`${companyName} ${dealName} technology procurement decision 2026`);
}
