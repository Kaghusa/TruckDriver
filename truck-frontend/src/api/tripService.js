import axios from "axios";



const API_URL = `http://localhost:8000/api/plan-route/`;

export async function planTrip(payload) {
  try {
    const response = await axios.post(API_URL, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Server not reachable" };
  }
}

export function downloadReport(tripData) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tripData));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `trip_report_${Date.now()}.json`);
  dlAnchorElem.click();
}