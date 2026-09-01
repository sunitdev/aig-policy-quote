interface ApiGatewayResponse {
  body: string;
  headers: Record<string, string>;
  statusCode: number;
}

export function handler(): Promise<ApiGatewayResponse> {
  return Promise.resolve({
    statusCode: 200,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      message: "hello from policy quote infra"
    })
  });
}
