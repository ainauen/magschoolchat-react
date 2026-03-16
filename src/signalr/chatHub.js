import * as signalR from "@microsoft/signalr";

export function createChatHubConnection(getAccessToken) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL; // https://localhost:7220
  const hubUrl = `${baseUrl}/hubs/chat`;

  const conn = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getAccessToken() || ""
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return conn;
}