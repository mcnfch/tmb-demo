import { NextResponse } from "next/server";
import { readCsv } from "../../../../lib/csvfs";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function loadData(ep: string) {
  try {
    // Handle comprehensive endpoint - load all datasets
    if (ep === "comprehensive") {
      // Use direct CSV loading instead of HTTP requests to avoid internal fetch issues
      const [spendCsv, forecastCsv, hpcUtilization, hpcBurst] = await Promise.all([
        readCsv("data/focus_sandbox.csv").catch(() => []),
        readCsv("seeds/forecast.csv").catch(() => []),
        readCsv("data/hpc_job_usage.csv").catch(() => []),
        readCsv("data/hpc_cloud_burst.csv").catch(() => [])
      ]);
      
      // Create processed data similar to what the APIs would return
      const spend = spendCsv.map((r: any) => ({
        usage_date: r.usage_date,
        business_unit: JSON.parse(r.tags || '{}').bu || 'Unassigned',
        application: JSON.parse(r.tags || '{}').app || 'Unassigned',
        environment: JSON.parse(r.tags || '{}').env || 'Unknown',
        spend: Number(r.cost_usd) || 0
      }));
      
      const variance = forecastCsv.filter(r => !r.month?.startsWith('#')).map((r: any) => ({ // Skip header comment
        month: r.month,
        business_unit: r.business_unit,
        application: r.application,
        budget: Number(r.budget) || 0,
        forecast: Number(r.forecast) || 0
      }));
      
      const result = {
        spend: spend.slice(0, 20), // Sample each dataset
        variance: variance.slice(0, 20),
        topServices: spend.slice(0, 20), // Use spend data for top services
        hygiene: spendCsv.slice(0, 20), // Raw CSV for hygiene analysis
        chargeback: spend.filter(r => r.business_unit && r.application).slice(0, 20),
        hpcUtilization: hpcUtilization.slice(0, 20),
        hpcBurst: hpcBurst.slice(0, 20)
      };
      const dataLengths = {
        spend: spend.length,
        variance: variance.length,
        topServices: spend.length,
        hygiene: spendCsv.length,
        chargeback: spend.filter(r => r.business_unit && r.application).length,
        hpcUtilization: hpcUtilization.length,
        hpcBurst: hpcBurst.length
      };
      
      console.log('Comprehensive data loaded:', dataLengths);
      
      // If all datasets are empty, return debug info instead of empty object
      const totalRows = Object.values(dataLengths).reduce((sum, count) => sum + count, 0);
      if (totalRows === 0) {
        return {
          debug: "All datasets returned empty",
          dataLengths,
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://tmb-demo.forbush.biz'
        };
      }
      
      return result;
    }
    
    // Try to fetch from API first for endpoints that have API routes
    const apiEndpoints = ['spend', 'variance', 'top-services', 'hygiene', 'chargeback'];
    
    if (apiEndpoints.includes(ep)) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tmb-demo.forbush.biz';
      const response = await fetch(`${baseUrl}/api/${ep}?download=1`);
      if (response.ok) {
        return await response.json();
      }
    }
    
    // Fallback to CSV files for endpoints without API routes
    switch (ep) {
      case "spend":
        return await readCsv("data/focus_sandbox.csv");
      case "variance":
        return await readCsv("seeds/forecast.csv");
      case "top-services":
        return await readCsv("data/focus_sandbox.csv");
      case "hygiene":
        return await readCsv("data/focus_sandbox.csv");
      case "chargeback":
        return await readCsv("data/focus_sandbox.csv");
      case "tbm-rollup":
        return await readCsv("data/focus_sandbox.csv");
      case "hpc-utilization":
        return await readCsv("data/hpc_job_usage.csv");
      case "hpc-burst":
        return await readCsv("data/hpc_cloud_burst.csv");
      default:
        return [];
    }
  } catch (error) {
    console.error(`Error loading data for ${ep}:`, error);
    return [];
  }
}

async function getAIAnalysis(endpoint: string, data: any[] | any): Promise<any> {
  try {
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    const threadId = process.env.OPENAI_ASSISTANT_THREAD;

    if (!assistantId) {
      throw new Error("OpenAI Assistant ID not configured");
    }

    if (!threadId) {
      throw new Error("OpenAI Assistant Thread not configured");
    }

    // Create message in the existing thread with "report" instruction and actual data
    let dataString = JSON.stringify(data, null, 2);
    
    // For comprehensive endpoint, no need to truncate with GPT-4.1's larger context window
    if (endpoint !== "comprehensive") {
      const maxDataLength = 200000; // Leave room for other content
      
      if (dataString.length > maxDataLength && Array.isArray(data)) {
        // Take a sample of the data instead of the full dataset
        const sampleSize = Math.min(50, Math.floor(data.length / 10)); // Sample 10% or max 50 rows
        const sampledData = data.slice(0, sampleSize);
        dataString = JSON.stringify(sampledData, null, 2);
        dataString += `\n\n[Note: This is a sample of ${sampleSize} rows from ${data.length} total rows]`;
      }
    }

    const prompt = endpoint === "comprehensive" ? "produce a comprehensive report" : "report";
    const dataContent = `${prompt}

Endpoint: ${endpoint}
Data for analysis:
${dataString}`;

    console.log(`Sending to AI - Endpoint: ${endpoint}, Data string length: ${dataString.length}, First 500 chars:`, dataString.substring(0, 500));

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: dataContent
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress' || runStatus.status === 'requires_action') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
      attempts++;
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus.status} after ${attempts} attempts`);
    }

    // Get the latest messages
    const messages = await openai.beta.threads.messages.list(threadId, { limit: 5 });
    const assistantMessage = messages.data.find(msg => 
      msg.role === 'assistant' && 
      msg.run_id === run.id
    );

    if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== 'text') {
      throw new Error("No valid assistant response found");
    }

    const responseText = assistantMessage.content[0].text.value;
    
    // Try to parse the JSON response from the assistant
    try {
      const parsed = JSON.parse(responseText);
      
      const rowCount = endpoint === "comprehensive" && typeof data === 'object' && !Array.isArray(data) 
        ? Object.values(data).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
        : Array.isArray(data) ? data.length : 0;
        
      console.log('Row count calculation for', endpoint, ':', rowCount, 'data type:', typeof data, 'is array:', Array.isArray(data));

      return {
        endpoint,
        analysis: parsed.analysis || {},
        insights: parsed.insights || "",
        data_quality: parsed.data_quality || "",
        diagnostics: {
          row_count: rowCount,
          missing_columns: [],
          notes: "AI analysis completed successfully",
          ai_powered: true,
        },
        raw_response: responseText
      };
    } catch (parseError) {
      console.warn("Failed to parse AI response as JSON:", parseError);
      
      // Fallback: try to extract JSON from text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const rowCount = endpoint === "comprehensive" && typeof data === 'object' && !Array.isArray(data) 
            ? Object.values(data).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
            : Array.isArray(data) ? data.length : 0;

          return {
            endpoint,
            analysis: parsed.analysis || {},
            insights: parsed.insights || "",
            data_quality: parsed.data_quality || "",
            diagnostics: {
              row_count: rowCount,
              missing_columns: [],
              notes: "AI analysis completed successfully (extracted JSON)",
              ai_powered: true,
            },
            raw_response: responseText
          };
        } catch {
          // Still failed to parse
        }
      }
      
      // Final fallback: return raw response with basic structure
      const rowCount = endpoint === "comprehensive" && typeof data === 'object' && !Array.isArray(data) 
        ? Object.values(data).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
        : Array.isArray(data) ? data.length : 0;

      return {
        endpoint,
        analysis: {
          spend_trends: ["See raw response for detailed analysis"],
          notable_spikes_dips: [],
          cumulative_view: [],
          recommendations: ["Review the raw AI response for insights"]
        },
        insights: "AI provided analysis in unexpected format",
        data_quality: "Check raw response for details",
        diagnostics: {
          row_count: rowCount,
          missing_columns: [],
          notes: "AI analysis completed but response format needs adjustment",
          ai_powered: true,
        },
        raw_response: responseText
      };
    }

  } catch (error: any) {
    console.error("AI Analysis error:", error);
    
    // Fallback to basic analysis if AI fails
    return fallbackAnalysis(endpoint, data, error.message);
  }
}

function fallbackAnalysis(endpoint: string, rows: any[] | any, errorMessage: string) {
  const row_count = endpoint === "comprehensive" && typeof rows === 'object' && !Array.isArray(rows)
    ? Object.values(rows).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    : Array.isArray(rows) ? rows.length : 0;
  const missing_columns: string[] = [];
  const notes = `AI analysis failed: ${errorMessage}. Falling back to basic analysis.`;

  const analysis: Record<string, string[]> = {
    spend_trends: [],
    notable_spikes_dips: [],
    cumulative_view: [],
    recommendations: [],
  };

  if (endpoint === "spend") {
    analysis.spend_trends.push("Spend shows realistic monthly variability within single-digit percentages.");
    analysis.cumulative_view.push("YTD totals align with plan within single-digit variance.");
    analysis.recommendations.push("Monitor service-level growth areas and confirm plan coverage for remaining months.");
  } else if (endpoint === "variance") {
    analysis.notable_spikes_dips.push("Mixed favorable/unfavorable months within ±1–8% vs budget.");
    analysis.recommendations.push("Focus on top 3 drivers and confirm drivers with BU owners.");
  } else if (endpoint === "top-services") {
    analysis.spend_trends.push("Top services trend appears stable with expected seasonality.");
    analysis.recommendations.push("Investigate outliers in stacked series for unit price vs usage shifts.");
  } else if (endpoint === "hygiene") {
    analysis.cumulative_view.push("Hygiene metrics are within demo targets (e.g., ~3% untagged, 94% FOCUS).");
    analysis.recommendations.push("Continue tag cleanup and enforce standards at ingestion.");
  } else if (endpoint === "chargeback") {
    analysis.recommendations.push("Validate rate card and ensure unallocated is surfaced until mapping closed.");
  } else if (endpoint === "tbm-rollup") {
    analysis.cumulative_view.push("TBM rollup shows expected distribution across towers.");
    analysis.recommendations.push("Drill into towers with rising trends and confirm allocations.");
  } else if (endpoint === "hpc-utilization") {
    analysis.spend_trends.push("HPC utilization shows realistic fluctuations across months.");
    analysis.recommendations.push("Track queue time and spot/reserved mix for cost efficiency.");
  } else if (endpoint === "hpc-burst") {
    analysis.notable_spikes_dips.push("Burst spend by pricing model is within expected ranges.");
    analysis.recommendations.push("Tune mix between on-demand, reserved, and spot for target savings.");
  } else if (endpoint === "comprehensive") {
    analysis.spend_trends.push("Overall cloud spend shows consistent patterns across all service categories.");
    analysis.notable_spikes_dips.push("Variance analysis reveals mixed performance against budgets and forecasts.");
    analysis.cumulative_view.push("Comprehensive view shows healthy cost management with areas for optimization.");
    analysis.recommendations.push("Focus on top spending services, improve tagging compliance, and optimize HPC utilization.");
  }

  return {
    endpoint,
    analysis,
    diagnostics: { 
      row_count, 
      missing_columns, 
      notes,
      ai_powered: false,
    },
    error: errorMessage,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") || "spend";
  
  try {
    const rows = await loadData(endpoint);
    const body = await getAIAnalysis(endpoint, rows);
    return NextResponse.json(body);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        error: error.message,
        endpoint,
        diagnostics: {
          notes: "Failed to load data or analyze",
          ai_powered: false,
        }
      }, 
      { status: 500 }
    );
  }
}
