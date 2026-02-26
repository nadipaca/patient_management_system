export const environment = {
  production: false,
  // All requests route through the Spring Cloud Gateway on port 4004.
  // The gateway handles JWT validation and routes to the appropriate microservice.
  apiBaseUrl: 'http://localhost:4004'
};
